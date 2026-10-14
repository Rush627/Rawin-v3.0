/** Conversation lifecycle shared by Rawin Orbit's interface and its orb. */
export type OrbitState =
  | "idle"
  | "user_sent"
  | "generating"
  | "streaming"
  | "complete"
  | "error";
