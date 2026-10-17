/**
 * Same-browser announcement that a CMS save succeeded. Open public tabs listen on this channel
 * (AvailabilityWatcher) and re-read the public status at once instead of waiting for their next
 * poll; other browsers and devices pick the change up on that poll. Carries no content: the
 * listeners always fetch the saved values from the server.
 */
export const LIVE_SYNC_CHANNEL = "rawin_availability_sync";

export function announceCmsUpdate(section: string) {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
  try {
    const channel = new BroadcastChannel(LIVE_SYNC_CHANNEL);
    channel.postMessage({ type: "CMS_UPDATED", section });
    channel.close();
  } catch {
    // no cross-tab channel: the next poll carries the change
  }
}
