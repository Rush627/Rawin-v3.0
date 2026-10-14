/**
 * Orbit's welcome greeting: which of four CMS-written lines fits the visitor's local time.
 * The CMS owns the wording (ai.greetingMorning … ai.greetingLateNight); this module only
 * decides the period. Times are the visitor's own (browser clock and time zone), never the
 * server's.
 *
 * Boundaries, local 24-hour clock, half-open so every minute belongs to exactly one period:
 *   morning     05:00 – 11:59
 *   afternoon   12:00 – 16:59
 *   evening     17:00 – 21:59
 *   late night  22:00 – 04:59 (across midnight)
 */

export type GreetingPeriod = "morning" | "afternoon" | "evening" | "lateNight";

/** Hours at which a new period begins, in order. */
export const PERIOD_STARTS: { hour: number; period: GreetingPeriod }[] = [
  { hour: 5, period: "morning" },
  { hour: 12, period: "afternoon" },
  { hour: 17, period: "evening" },
  { hour: 22, period: "lateNight" },
];

export function periodForHour(hour: number): GreetingPeriod {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "lateNight";
}

/** The hour (0–23) at `date` in `timeZone` (default: the runtime's own zone). */
export function localHour(date: Date, timeZone?: string): number {
  const h = new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone }).format(date);
  return Number(h) % 24;
}

export function periodAt(date: Date, timeZone?: string): GreetingPeriod {
  return periodForHour(localHour(date, timeZone));
}

/** Milliseconds from `date` until the next period begins, on the runtime's local clock. */
export function msUntilNextPeriod(date: Date): number {
  const h = date.getHours();
  const next = PERIOD_STARTS.find((p) => p.hour > h)?.hour ?? PERIOD_STARTS[0].hour + 24;
  const at = new Date(date);
  at.setHours(next, 0, 0, 0);
  return Math.max(1000, at.getTime() - date.getTime());
}

export interface GreetingCopy {
  greetingMorning?: string;
  greetingAfternoon?: string;
  greetingEvening?: string;
  greetingLateNight?: string;
}

export function greetingFor(period: GreetingPeriod, copy: GreetingCopy): string {
  const map: Record<GreetingPeriod, string | undefined> = {
    morning: copy.greetingMorning,
    afternoon: copy.greetingAfternoon,
    evening: copy.greetingEvening,
    lateNight: copy.greetingLateNight,
  };
  return (map[period] || "").trim();
}
