/**
 * Orbit's voice takes priority over the site ambience: while the microphone is opening, open or
 * closing, while a voice message is being recorded, and from the moment a reply is requested
 * until it has ended, been stopped or failed, the ambience is held at silence. Pure binding
 * logic (no React, no Web Audio), shared by the hook and the tests.
 */

export interface Observable<S> {
  getState: () => S;
  subscribe: (fn: () => void) => () => void;
}

type Phased = { phase: string };

/** Browser dictation (DictationController): any phase but idle. */
export const dictationActive = (s: Phased) => s.phase !== "idle";
/** The recording fallback (RecorderController): the upload and transcription need no quiet. */
export const recorderActive = (s: Phased) => s.phase === "starting" || s.phase === "recording";
/** Spoken replies (SpeechController, CloudSpeechController): preparing or playing. */
export const speechActive = (s: Phased) => s.phase !== "idle";

/**
 * Follow a controller's state changes directly (synchronously, so the hold is placed the moment
 * capture or speech is requested) and report them through `hold`. Returns the release: it
 * unsubscribes and always releases the hold (unmount, navigation away mid-activity).
 */
export function bindHold<S>(ctrl: Observable<S>, isActive: (state: S) => boolean, hold: (on: boolean) => void): () => void {
  let last: boolean | null = null;
  const apply = () => {
    const on = isActive(ctrl.getState());
    if (on === last) return;
    last = on;
    hold(on);
  };
  apply();
  const off = ctrl.subscribe(apply);
  return () => {
    off();
    if (last) hold(false);
    last = false;
  };
}
