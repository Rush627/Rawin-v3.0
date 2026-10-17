import { AMBIENCE, FORMATS } from "./catalog";
import { SOUND_STORAGE_KEY } from "./policy";

/**
 * The earliest audio step, inlined in the public layout so it runs while the HTML is parsed,
 * seconds before React hydrates on a phone (measured: about 5 s with the CPU of a mid-range
 * phone). Until hydration the audio director does not exist, so a tap in that window was lost:
 * iOS Safari only lets audio start inside the tap's own event handler, so a later attempt
 * cannot use it. This script:
 *
 *   - catches the visitor's first tap, click or key press and, inside it, creates and resumes
 *     the AudioContext (plus the one-sample silent buffer iOS needs). The director adopts that
 *     context when it starts (engine.ts), already allowed to play;
 *   - starts downloading the ambience (one format, the first this browser plays) so the sound
 *     does not wait for hydration either. The director decodes those bytes.
 *
 * Nothing plays here. It does nothing when the visitor has muted the site, or when the CMS
 * allows neither sound; it stops listening once the context runs or the director is up.
 * Self-contained source (no imports at run time), so it can be inlined.
 */
export function buildAudioBootScript(allowed: { background: boolean; click: boolean }): string {
  const cfg = {
    bg: Boolean(allowed.background),
    any: Boolean(allowed.background || allowed.click),
    key: SOUND_STORAGE_KEY,
    base: AMBIENCE.base,
    formats: FORMATS.map((f) => [f.ext, f.type]),
  };
  return `(function(c){try{var w=window;if(w.__rawinEarlyAudio||w.__rawinAudio||!c.any)return;try{if(localStorage.getItem(c.key)==="off")return}catch(e){}var st={ctx:null,bed:null,ext:null};w.__rawinEarlyAudio=st;if(c.bg&&w.fetch){var a=document.createElement("audio"),f=null;for(var i=0;i<c.formats.length;i++){if(c.formats[i][0]==="mp3"||(a.canPlayType&&a.canPlayType(c.formats[i][1]))){f=c.formats[i];break}}if(f){st.ext=f[0];st.bed=fetch(c.base+"."+f[0]).then(function(r){return r.ok?r.arrayBuffer():null}).catch(function(){return null})}}var types=["pointerdown","pointerup","touchend","click","keydown"];var off=function(){for(var j=0;j<types.length;j++)w.removeEventListener(types[j],on,true)};var on=function(){if(w.__rawinAudio){off();return}var C=w.AudioContext||w.webkitAudioContext;if(!C){off();return}try{if(!st.ctx)st.ctx=new C({latencyHint:"playback"});var x=st.ctx;var b=x.createBuffer(1,1,x.sampleRate),s=x.createBufferSource();s.buffer=b;s.connect(x.destination);s.start();var p=x.resume();if(p&&p.then)p.then(function(){if(x.state==="running")off()},function(){})}catch(e){}};for(var k=0;k<types.length;k++)w.addEventListener(types[k],on,{capture:true,passive:true})}catch(e){}})(${JSON.stringify(cfg)});`;
}

/** What the boot script leaves for the director (see engine.ts). */
export interface EarlyAudio {
  ctx: AudioContext | null;
  bed: Promise<ArrayBuffer | null> | null;
  ext: string | null;
}
