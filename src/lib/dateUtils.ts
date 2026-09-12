/**
 * Date and timezone utilities for Asia/Kolkata (IST, UTC+05:30).
 * Ensures blog post dates and datetime-local inputs strictly adhere to IST without server locale shifts.
 */

/**
 * Formats a Date or ISO string into YYYY-MM-DDTHH:mm representing the time in Asia/Kolkata (IST).
 */
export function toKolkataDateTimeInput(date: Date | string = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");
  const minute = get("minute");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Parses a YYYY-MM-DDTHH:mm string submitted from datetime-local input,
 * treating it explicitly as Asia/Kolkata (IST, UTC+05:30) time, and returns an ISO UTC string.
 */
export function parseKolkataDateTimeInput(input: string): string | undefined {
  if (!input || !input.trim()) return undefined;
  const trimmed = input.trim();

  // If already has timezone offset or Z, parse directly
  if (trimmed.includes("Z") || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  // Format: YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss
  // Append Asia/Kolkata offset: +05:30
  const normalized = trimmed.length === 16 ? `${trimmed}:00+05:30` : `${trimmed}+05:30`;
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

/**
 * Formats a date string in Asia/Kolkata timezone with human-readable month and year (e.g. "Mar 2026").
 */
export function formatDateKolkata(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      timeZone: "Asia/Kolkata",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats a date string in Asia/Kolkata timezone with full date (e.g. "March 12, 2026").
 */
export function formatDateLongKolkata(dateStr?: string): string {
  if (!dateStr) return "Recent";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      timeZone: "Asia/Kolkata",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
