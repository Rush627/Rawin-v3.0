/** Availability vocabulary shared by server and client components (no data, no I/O). */

export type AvailabilityState = "available" | "limited" | "unavailable";
export interface AvailabilityContent {
  /** the underlying fact; colours everywhere derive from it */
  state: AvailabilityState;
  /** short status, e.g. "Available now" (hero, resume, Orbit) */
  label: string;
  /** supporting line, e.g. "Open for opportunities" (hero badge, footer, contact) */
  note: string;
}
export const AVAILABILITY_STATES: AvailabilityState[] = ["available", "limited", "unavailable"];
export const AVAILABILITY_TONE: Record<AvailabilityState, "green" | "orange" | "red"> = {
  available: "green",
  limited: "orange",
  unavailable: "red",
};
export const AVAILABILITY_STATE_LABEL: Record<AvailabilityState, string> = {
  available: "Available",
  limited: "Limited availability",
  unavailable: "Not available",
};
/** Legacy colour names → state (documents saved before the availability section existed). */
export const TONE_TO_STATE: Record<string, AvailabilityState> = { green: "available", orange: "limited", red: "unavailable" };
/** Resume status indicator for each state (the resume plate has its own palette names). */
export const AVAILABILITY_RESUME_INDICATOR: Record<AvailabilityState, "green" | "orange" | "gray"> = {
  available: "green",
  limited: "orange",
  unavailable: "gray",
};
