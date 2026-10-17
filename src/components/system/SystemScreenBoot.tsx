import { SYSTEM_SCREEN_BOOT_SCRIPT } from "@/lib/system-screen";

/**
 * Rendered by the server-side system screens (not found, maintenance, content unavailable)
 * ahead of RawinErrorView: marks the page as a system screen while it is parsed and withdraws
 * any startup chosen for this load, before it can play (see lib/system-screen.ts).
 */
export default function SystemScreenBoot() {
  return <script dangerouslySetInnerHTML={{ __html: SYSTEM_SCREEN_BOOT_SCRIPT }} />;
}
