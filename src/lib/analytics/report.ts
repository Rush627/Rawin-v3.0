import { combineReports, includeViewer, LAUNCH_OFF, recordedReport, simulateReport, type AnalyticsRange, type LaunchConfig, type Report, type Viewer } from "./model";
import { getLaunchConfig, getLaunchConfigShared, getVisitRows, getVisitRowsFresh } from "./store";

export interface PublicAnalytics {
  range: AnalyticsRange;
  generatedAt: number;
  /** false when recorded analytics could not be read: the page says so instead of showing zeros */
  available: boolean;
  /** Launch Mode is on: figures include simulated launch activity (disclosed on the page) */
  launch: boolean;
  report: Report | null;
  /**
   * The viewer's own country (from the hosting platform only) and whether their visit is part of
   * that country's count in `report`. null when the country could not be determined.
   */
  you: { country: string; included: boolean; excluded?: "owner" | "bot"; test?: true } | null;
}

/** How often an open page refreshes while Launch Mode figures are moving (jittered client-side). */
export const LAUNCH_REFRESH_MS = 90_000;

/**
 * The figures the public page shows: recorded traffic, plus the simulated baseline while Launch
 * Mode is on. Both come from the same report shape, so the overview, chart, map, ranking and
 * country count always agree. Recorded figures are never altered.
 */
export async function getPublicAnalytics(
  range: AnalyticsRange,
  viewer: Viewer | null = null,
  now = Date.now(),
  /** an explicit refresh: read the stored figures and settings now instead of the shared cache */
  { fresh = false }: { fresh?: boolean } = {},
): Promise<PublicAnalytics> {
  let config: LaunchConfig = LAUNCH_OFF;
  try {
    config = await (fresh ? getLaunchConfigShared() : getLaunchConfig());
  } catch {
    // settings unreadable: recorded figures only (never assume simulation)
  }
  let recorded: Report;
  let included = false;
  try {
    const rows = await (fresh ? getVisitRowsFresh() : getVisitRows());
    // the viewer's own visit is counted once, in the recorded figures (see includeViewer)
    ({ report: recorded, included } = includeViewer(recordedReport(rows, range, now), rows, viewer, now));
  } catch {
    return { range, generatedAt: now, available: false, launch: false, report: null, you: null };
  }
  const simulated = config.enabled ? simulateReport(config, range, now) : null;
  return {
    range,
    generatedAt: now,
    available: true,
    launch: config.enabled,
    report: combineReports(recorded, simulated),
    you: viewer ? { country: viewer.country, included, ...(viewer.excluded ? { excluded: viewer.excluded } : {}), ...(viewer.test ? { test: true as const } : {}) } : null,
  };
}

/** Recorded figures only (Studio). Throws when unreadable. */
export async function getRecordedAnalytics(range: AnalyticsRange, now = Date.now()): Promise<Report> {
  return recordedReport(await getVisitRows(), range, now);
}
