declare module "liquid-gl" {
  export interface LiquidGLLens {
    destroy(): void;
    setTint?(tint: string | null): void;
    setDraggable?(enabled: boolean): void;
  }

  export interface LiquidGLOptions {
    target?: string;
    snapshot?: string;
    resolution?: number;
    engine?: "auto" | "webgpu" | "webgl2" | "webgl";
    zIndex?: number;
    content?: string | false;
    refraction?: number;
    aberration?: number;
    bevelDepth?: number;
    bevelWidth?: number;
    frost?: number;
    shadow?: boolean;
    specular?: boolean;
    reveal?: "fade" | "none";
    tilt?: boolean;
    tiltFactor?: number;
    tiltEase?: number;
    draggable?: boolean;
    interaction?: "none" | "fluid";
    interactionStrength?: number;
    interactionRadius?: number;
    interactionViscosity?: number;
    magnify?: number;
    tint?: string | null;
    helper?: boolean;
    on?: {
      init?: (lens: LiquidGLLens) => void;
    };
  }

  type LiquidGLFn = ((options?: LiquidGLOptions) => LiquidGLLens | LiquidGLLens[] | undefined) & {
    registerDynamic?: (elements: string | Element | Element[]) => void;
  };

  const liquidGL: LiquidGLFn | undefined;
  export default liquidGL;
}
