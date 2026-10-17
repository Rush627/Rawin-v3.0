/**
 * The ambience loop splice, as pure math on decoded samples (no Web Audio), so it is testable.
 *
 * The supplied recording opens with a ~10 s fade-in and closes with a ~7 s fade-out: played end
 * to end and repeated, every repetition passes through ~15 s of near silence (the "pause"). The
 * loop therefore runs over the steady body of the recording, [start, end), and the last `xfade`
 * seconds before `end` are blended (equal power) with the `xfade` seconds that lead into
 * `start`. When the player jumps from `end` back to `start`, the material on both sides of the
 * jump is the same continuous stretch of the recording: no gap, no click, no level step.
 *
 * Only the decoded copy in memory is changed; the files are never altered. The first play still
 * starts at 0 (with the recording's own fade-in); every later repetition is seamless.
 */

export interface LoopPoints {
  /** seconds */
  start: number;
  end: number;
  xfade: number;
}

/** Sample-frame bounds for a buffer of `frames` at `rate`, or null if the buffer is too short. */
export function loopFrames(points: LoopPoints, rate: number, frames: number) {
  const start = Math.round(points.start * rate);
  const end = Math.min(frames, Math.round(points.end * rate));
  const x = Math.round(points.xfade * rate);
  if (x <= 0 || start - x < 0 || end - x <= start) return null;
  return { start, end, x };
}

/**
 * Bake the splice into the channels in place. Returns the loop bounds in seconds for an
 * AudioBufferSourceNode (loopStart / loopEnd), or null when the buffer cannot hold the loop
 * (it then simply loops whole).
 */
export function bakeLoop(channels: Float32Array[], rate: number, points: LoopPoints): { loopStart: number; loopEnd: number } | null {
  const frames = channels[0]?.length ?? 0;
  const f = loopFrames(points, rate, frames);
  if (!f) return null;
  const { start, end, x } = f;
  for (const ch of channels) {
    for (let i = 0; i < x; i++) {
      // i = 0 at end - x (all tail), i = x - 1 just before the jump (all lead-in)
      const t = (i + 0.5) / x;
      const out = Math.cos((t * Math.PI) / 2);
      const inn = Math.sin((t * Math.PI) / 2);
      ch[end - x + i] = ch[end - x + i] * out + ch[start - x + i] * inn;
    }
  }
  return { loopStart: start / rate, loopEnd: end / rate };
}
