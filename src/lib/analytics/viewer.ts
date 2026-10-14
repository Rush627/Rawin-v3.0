import { displayCountry, normalizeCountryCode } from "./countries";
import { countryFromGeoHeader, isLikelyBot, type Viewer } from "./model";
import { visitorCode } from "./store";

/**
 * The current viewer from a request's headers, using exactly the collector's rules
 * (/api/analytics/collect): only Netlify's own edge headers are trusted, the country comes only
 * from its geo header, and the visit counts only for a non-bot visitor who is not the signed-in
 * owner. Without a reliable country there is no viewer: nothing is guessed from language,
 * timezone or locale, and nothing defaults to any country. The address is used only to derive
 * today's visitor code, as the collector does, and is never returned or stored.
 */
export function viewerFromRequest(headers: Headers, sessionCookie: string | undefined, now = Date.now()): Viewer | null {
  const edgeAddress = headers.get("x-nf-client-connection-ip")?.trim() || "";
  if (!edgeAddress) return devTestViewer();
  const reported = countryFromGeoHeader(headers.get("x-nf-geo"));
  if (!reported) return null;
  // the same display code the aggregated records use, so "you" and the ranking always match
  const country = displayCountry(reported);
  const ua = headers.get("user-agent");
  // the collector's exclusions, in its order: bots, then the owner's own browsing
  const excluded = isLikelyBot(ua) ? "bot" : sessionCookie ? "owner" : null;
  return excluded ? { country, code: null, excluded } : { country, code: visitorCode(edgeAddress, ua || "", now) };
}

/**
 * Local development only: a server-side test country, so the indicator can be checked under
 * `next dev`, where no hosting edge supplies location headers. Set ANALYTICS_DEV_COUNTRY=IN (for
 * example) in the environment of `npm run dev`. It is marked `test` and labelled on the page as a
 * test country, never counted (no visitor code) and never recorded (the collector is separate).
 * Inert under `next build` / `next start` (NODE_ENV is "production") and on any request that came
 * through the hosting edge; there is no query parameter or client-side switch.
 */
function devTestViewer(): Viewer | null {
  if (process.env.NODE_ENV !== "development") return null;
  const country = normalizeCountryCode(process.env.ANALYTICS_DEV_COUNTRY);
  return country ? { country: displayCountry(country), code: null, test: true } : null;
}
