export function formatPostDate(dateStr?: string, style: "short" | "long" = "short"): string {
  if (!dateStr) return "Recent";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      timeZone: "Asia/Kolkata",
      month: style === "long" ? "long" : "short",
      day: style === "long" ? "numeric" : undefined,
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatReadTime(readTime?: string): string {
  if (!readTime) return "5 min read";
  return /read/i.test(readTime) ? readTime : `${readTime} read`;
}
