"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type OrbitVisualState = "listening" | "talking";
export type OrbitOrbVariant = "hero" | "message" | "header";

export interface RawinOrbitOrbProps {
  state?: OrbitVisualState;
  variant?: OrbitOrbVariant;
  className?: string;
  active?: boolean;
}

// Master vertex shader
const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// Master monochromatic GLSL fragment shader
// Uses white, off-white, silver-grey, cool grey, and subtle dark grey falloff.
// Zero cyan, zero colored neon, zero cartoon elements.
const FRAGMENT_SHADER = `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uBreath;
uniform float uIntensity;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 st) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 3; i++) {
    value += amplitude * snoise(st * frequency);
    st += vec2(1.7, 9.2);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float dist = length(uv);

  // Subtle breathing radius variation (strictly under 3% radius variance)
  float breathExpansion = sin(uBreath) * 0.024 * (1.0 + uIntensity * 0.4);

  // Fluid domain warping
  float angle = atan(uv.y, uv.x);
  vec2 flowCoord = vec2(dist * 2.8 - uTime * 0.16, angle * 1.5 + uTime * 0.09);
  float n1 = fbm(flowCoord);
  float n2 = snoise(uv * 3.6 + vec2(n1 * 0.4, uTime * 0.22));

  // Organic edge displacement (controlled and restrained)
  float disp = n2 * (0.026 + uIntensity * 0.018);
  float r = dist - breathExpansion - disp;

  // Refined monochromatic palette: pure white, off-white, silver-grey, cool grey
  vec3 colCore      = vec3(1.0, 1.0, 1.0);
  vec3 colInner     = vec3(0.94, 0.95, 0.97);
  vec3 colFilament  = vec3(0.72, 0.75, 0.80);
  vec3 colMid       = vec3(0.48, 0.52, 0.58);
  vec3 colCorona    = vec3(0.20, 0.22, 0.26);

  // Layer 1: Atmospheric Outer Field / Corona (r: 0.20 to 0.46)
  float coronaMask = 1.0 - smoothstep(0.20, 0.46, r);
  float coronaBreath = 0.35 + 0.15 * sin(uBreath) + uIntensity * 0.22;
  vec3 col = colCorona * coronaMask * coronaBreath;
  float alpha = coronaMask * (0.45 + uIntensity * 0.25);

  // Layer 2: Soft fluid body (r: 0.12 to 0.25)
  float bodyMask = 1.0 - smoothstep(0.12, 0.25, r);
  vec3 bodyCol = mix(colMid, colFilament, n1 * 0.5 + 0.5);
  col = mix(col, bodyCol, bodyMask * 0.75);
  alpha = max(alpha, bodyMask * 0.88);

  // Layer 3: Dynamic swirling filaments
  float filamentMask = 1.0 - smoothstep(0.06, 0.19, r);
  float filamentDetail = max(0.0, snoise(uv * 6.5 + vec2(uTime * 0.35, -uTime * 0.25)));
  col += colFilament * filamentMask * filamentDetail * (0.35 + uIntensity * 0.4);

  // Layer 4: Brighter internal energy region (r: 0.03 to 0.14)
  float coreMask = 1.0 - smoothstep(0.03, 0.14, r);
  float coreIntensity = 0.85 + 0.15 * sin(uBreath + 0.5) + uIntensity * 0.45;
  col = mix(col, colInner * coreIntensity, coreMask * 0.92);
  alpha = max(alpha, coreMask);

  // Layer 5: Restrained core highlight (r: 0.0 to 0.055)
  float specMask = 1.0 - smoothstep(0.0, 0.055, r);
  col = mix(col, colCore, specMask * 0.98);

  // Soft vignette cutoff at outer border
  float edgeCut = 1.0 - smoothstep(0.44, 0.49, dist);
  alpha *= edgeCut;

  gl_FragColor = vec4(col, alpha);
}
`;

interface OrbInstance {
  id: string;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

// Singleton animation and WebGL engine.
// Avoids multiple WebGL contexts and keeps all instances 100% phase-synchronized.
class SingletonOrbEngine {
  private masterCanvas: HTMLCanvasElement | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private instances = new Map<string, OrbInstance>();
  private animId: number | null = null;
  private lastTime = 0;
  private breathPhase = 0;
  private currentSpeed = 1.0;
  private currentTalkingIntensity = 0.0;
  private isAnyTalking = false;
  private prefersReducedMotion = false;

  public init() {
    if (typeof window === "undefined" || this.renderer) return;

    this.prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const size = 256;
    this.masterCanvas = document.createElement("canvas");
    this.masterCanvas.width = size;
    this.masterCanvas.height = size;

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.masterCanvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      this.renderer.setSize(size, size, false);
      this.renderer.setPixelRatio(1);
    } catch {
      this.renderer = null;
      return;
    }

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    this.camera.position.z = 1;

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uResolution: { value: new THREE.Vector2(size, size) },
        uTime: { value: 0 },
        uBreath: { value: 0 },
        uIntensity: { value: 0 },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const quad = new THREE.Mesh(geometry, this.material);
    this.scene.add(quad);
  }

  public register(id: string, canvas: HTMLCanvasElement, width: number, height: number) {
    if (!this.renderer) this.init();
    this.instances.set(id, { id, canvas, width, height });

    if (this.instances.size === 1 && !this.animId) {
      this.lastTime = performance.now();
      this.animId = requestAnimationFrame(this.tick);
    }
  }

  public updateSize(id: string, width: number, height: number) {
    const inst = this.instances.get(id);
    if (inst) {
      inst.width = width;
      inst.height = height;
    }
  }

  public unregister(id: string) {
    this.instances.delete(id);
    if (this.instances.size === 0 && this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  public setTalking(talking: boolean) {
    this.isAnyTalking = talking;
  }

  private tick = (timestamp: number) => {
    this.animId = requestAnimationFrame(this.tick);

    const delta = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    if (!this.renderer || !this.material || !this.scene || !this.camera || !this.masterCanvas) {
      return;
    }

    if (this.prefersReducedMotion) {
      this.material.uniforms.uTime.value = 0;
      this.material.uniforms.uBreath.value = 0;
      this.material.uniforms.uIntensity.value = 0;
      this.renderer.render(this.scene, this.camera);
      this.paintInstances();
      return;
    }

    // Target speeds: listening ~1.0 rad/s (approx 6.2s full cycle), talking ~2.6 rad/s (approx 2.4s cycle)
    const targetSpeed = this.isAnyTalking ? 2.6 : 1.0;
    const targetIntensity = this.isAnyTalking ? 1.0 : 0.0;

    // Smooth organic deceleration over 1.2 to 1.5s
    const speedLerp = this.isAnyTalking ? 3.2 : 1.6;
    const intensityLerp = this.isAnyTalking ? 3.5 : 1.8;

    this.currentSpeed += (targetSpeed - this.currentSpeed) * delta * speedLerp;
    this.currentTalkingIntensity +=
      (targetIntensity - this.currentTalkingIntensity) * delta * intensityLerp;

    // Continuous accumulation ensures zero reset on token or message update
    this.breathPhase += delta * this.currentSpeed;

    this.material.uniforms.uTime.value = timestamp * 0.001;
    this.material.uniforms.uBreath.value = this.breathPhase;
    this.material.uniforms.uIntensity.value = this.currentTalkingIntensity;

    this.renderer.render(this.scene, this.camera);
    this.paintInstances();
  };

  private paintInstances() {
    if (!this.masterCanvas) return;

    this.instances.forEach((inst) => {
      const ctx = inst.canvas.getContext("2d");
      if (!ctx || inst.width <= 0 || inst.height <= 0) return;

      ctx.clearRect(0, 0, inst.width, inst.height);
      ctx.drawImage(this.masterCanvas!, 0, 0, inst.width, inst.height);
    });
  }
}

// Global engine instance across all components
const engine = new SingletonOrbEngine();

export default function RawinOrbitOrb({
  state = "listening",
  variant = "hero",
  className = "",
  active = false,
}: RawinOrbitOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [instanceId] = useState(() => `orb-${Math.random().toString(36).slice(2, 9)}`);

  const isTalking = active || state === "talking";

  useEffect(() => {
    engine.setTalking(isTalking);
  }, [isTalking]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      engine.updateSize(instanceId, w, h);
    };

    updateDimensions();
    engine.register(instanceId, canvas, canvas.width, canvas.height);

    const ro = new ResizeObserver(() => {
      updateDimensions();
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      engine.unregister(instanceId);
    };
  }, [instanceId]);

  // Variant size mapping
  // Hero: Desktop 120-170px, Mobile 85-115px
  // Header mark: Desktop 22-28px, Mobile 20-24px
  // Message avatar: 24-32px
  const variantClass = {
    hero: "w-[95px] h-[95px] sm:w-[125px] sm:h-[125px] md:w-[155px] md:h-[155px]",
    header: "w-[22px] h-[22px] md:w-[26px] md:h-[26px]",
    message: "w-6 h-6 sm:w-7 sm:h-7",
  }[variant];

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center shrink-0 pointer-events-none select-none ${variantClass} ${className}`}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none"
      />
    </div>
  );
}
