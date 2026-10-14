import { unstable_cache } from "next/cache";

/**
 * GitHub contribution history for the profile in the CMS (contact.socials.github).
 *
 * Source: GitHub's official GraphQL API (user.contributionsCollection.contributionCalendar), the
 * same data as the profile's yearly graph: the last 365 days. It requires a token: set
 * GITHUB_TOKEN, server-only (a fine-grained token with public read access and no repository
 * permissions is enough). Without one, or when GitHub fails, the page shows an honest
 * "unavailable" state; nothing is scraped and nothing is invented.
 *
 * Caching: a successful calendar is cached for 15 minutes per profile, shared by every visitor.
 * A failure is never cached as a calendar: it is remembered for one minute per server instance
 * only, so GitHub is not asked again on every request while it is down or limiting.
 */

export interface ContributionDay {
  date: string;
  count: number;
  /** 0 – 4, GitHub's own intensity quartile */
  level: number;
}

export type GithubActivity =
  | { status: "ok"; username: string; profileUrl: string; total: number; weeks: ContributionDay[][]; fetchedAt: string }
  | { status: "unavailable"; username: string | null; profileUrl: string | null; reason: UnavailableReason };

export type UnavailableReason = "no-profile" | "invalid-profile" | "not-configured" | "not-found" | "rate-limited" | "timeout" | "upstream";

/** The GitHub username from a profile URL, or null for anything that is not a plain profile URL. */
export function githubUsername(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const m = /^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38})\/?$/.exec(url.trim());
  return m ? m[1] : null;
}

const LEVELS: Record<string, number> = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

const QUERY = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}`;

/** Fetches and parses the calendar. Exported for tests (fetch and token are injectable). */
export async function fetchGithubActivity(
  profileUrl: unknown,
  opts: { token?: string; fetchImpl?: typeof fetch; timeoutMs?: number } = {}
): Promise<GithubActivity> {
  const url = typeof profileUrl === "string" && profileUrl.trim() ? profileUrl.trim() : null;
  if (!url) return { status: "unavailable", username: null, profileUrl: null, reason: "no-profile" };
  const username = githubUsername(url);
  if (!username) return { status: "unavailable", username: null, profileUrl: url, reason: "invalid-profile" };
  const token = (opts.token ?? process.env.GITHUB_TOKEN ?? "").trim();
  if (!token) return { status: "unavailable", username, profileUrl: url, reason: "not-configured" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 6000);
  try {
    const res = await (opts.fetchImpl ?? fetch)("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "User-Agent": "rawin-analytics" },
      body: JSON.stringify({ query: QUERY, variables: { login: username } }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (res.status === 403 || res.status === 429) return { status: "unavailable", username, profileUrl: url, reason: "rate-limited" };
    if (!res.ok) return { status: "unavailable", username, profileUrl: url, reason: "upstream" };
    const json = await res.json();
    const cal = json?.data?.user?.contributionsCollection?.contributionCalendar;
    if (!cal || !Array.isArray(cal.weeks)) {
      const types: unknown[] = Array.isArray(json?.errors) ? json.errors.map((e: { type?: unknown }) => e?.type) : [];
      const reason = types.includes("RATE_LIMITED") ? "rate-limited" : types.includes("NOT_FOUND") || (json?.data && json.data.user === null) ? "not-found" : "upstream";
      return { status: "unavailable", username, profileUrl: url, reason };
    }
    // keep only well-formed days; nothing is filled in for days GitHub did not return
    const weeks: ContributionDay[][] = cal.weeks
      .map((w: { contributionDays?: unknown }) =>
        (Array.isArray(w?.contributionDays) ? w.contributionDays : [])
          .filter((d: { date?: unknown }) => typeof d?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.date))
          .map((d: { date: string; contributionCount?: unknown; contributionLevel?: unknown }) => ({
            date: d.date,
            count: Math.max(0, Math.floor(Number(d.contributionCount) || 0)),
            level: LEVELS[String(d.contributionLevel)] ?? 0,
          }))
      )
      .filter((w: ContributionDay[]) => w.length > 0);
    return { status: "ok", username, profileUrl: url, total: Math.max(0, Number(cal.totalContributions) || 0), weeks, fetchedAt: new Date().toISOString() };
  } catch (err) {
    const aborted = (err as { name?: string })?.name === "AbortError";
    return { status: "unavailable", username, profileUrl: url, reason: aborted ? "timeout" : "upstream" };
  } finally {
    clearTimeout(timer);
  }
}

class Unavailable extends Error {
  readonly result: GithubActivity;
  constructor(result: GithubActivity) {
    super("github unavailable");
    this.result = result;
  }
}

// Only a real calendar is returned from (and so stored by) the cache; a failure throws through it
const cachedCalendar = unstable_cache(
  async (profileUrl: string) => {
    const r = await fetchGithubActivity(profileUrl);
    if (r.status !== "ok") throw new Unavailable(r);
    return r;
  },
  ["github-activity-v2"],
  { tags: ["github-activity"], revalidate: 900 }
);

/** Recent failures per profile, per server instance: a short back-off, never a cached calendar. */
const recentFailures = new Map<string, { result: GithubActivity; until: number }>();
const BACKOFF_MS = 60_000;

/** The calendar for a CMS profile URL, or an honest unavailable state. Never throws. */
export async function getGithubActivity(profileUrl: string): Promise<GithubActivity> {
  const url = (profileUrl || "").trim();
  const username = githubUsername(url);
  // answers that need no request are decided here, outside the cache
  if (!url) return { status: "unavailable", username: null, profileUrl: null, reason: "no-profile" };
  if (!username) return { status: "unavailable", username: null, profileUrl: url, reason: "invalid-profile" };
  if (!process.env.GITHUB_TOKEN?.trim()) return { status: "unavailable", username, profileUrl: url, reason: "not-configured" };

  const failed = recentFailures.get(url);
  if (failed && failed.until > Date.now()) return failed.result;
  try {
    const r = await cachedCalendar(url);
    recentFailures.delete(url);
    return r;
  } catch (err) {
    const result: GithubActivity = err instanceof Unavailable ? err.result : { status: "unavailable", username, profileUrl: url, reason: "upstream" };
    recentFailures.set(url, { result, until: Date.now() + BACKOFF_MS });
    return result;
  }
}
