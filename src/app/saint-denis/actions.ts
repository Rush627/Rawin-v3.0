"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  verifyAdminCredentials,
  createAdminSession,
  destroyAdminSession,
  getAdminSession,
  bumpSessionVersion,
} from "@/lib/auth";
import { clientIdentity } from "@/lib/admin-credentials";
import { loginWaitSeconds, noteLoginFailure, clearLoginFailures } from "@/lib/login-throttle";

export interface LoginActionState {
  error?: string;
  success?: boolean;
}

function pauseMessage(seconds: number) {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `Too many failed sign-in attempts. Please try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`;
}

/** Only admin paths, never the login page itself, never anything that could leave the site. */
function safeAdminTarget(raw: unknown): string {
  const value = typeof raw === "string" ? raw : "";
  if (!/^\/saint-denis(\/[A-Za-z0-9/_-]*)?$/.test(value) || value.startsWith("/saint-denis/login")) return "/saint-denis";
  return value;
}

export async function loginAction(
  prevState: LoginActionState | null,
  formData: FormData
): Promise<LoginActionState> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase().slice(0, 200) : "";
  const password = typeof rawPassword === "string" ? rawPassword.slice(0, 500) : "";

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  const headerList = await headers();
  const client = clientIdentity((name) => headerList.get(name));

  try {
    const wait = await loginWaitSeconds(client.key, email);
    if (wait > 0) return { error: pauseMessage(wait) };
  } catch {
    return { error: "Sign-in is temporarily unavailable. Please try again shortly." };
  }

  const result = await verifyAdminCredentials(email, password);

  if (!result.success || !result.email) {
    if (result.error && result.error.startsWith("Sign-in is temporarily unavailable")) return { error: result.error };
    await noteLoginFailure(client.key, email).catch(() => {});
    const wait = await loginWaitSeconds(client.key, email).catch(() => 0);
    return { error: wait > 0 ? pauseMessage(wait) : "Invalid email or password." };
  }

  await clearLoginFailures(client.key, email).catch(() => {});
  await createAdminSession(result.email, result.sessionVersion ?? 0);

  redirect(safeAdminTarget(formData.get("redirectTo")));
}

/** Ends this browser's session. */
export async function logoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/saint-denis/login");
}

/**
 * Revokes every session for this account (all devices, including this one): the account's
 * session version is incremented, so every previously issued token fails getAdminSession().
 */
export async function signOutEverywhereAction(): Promise<{ error?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "Unauthorized. Administrator session required." };
  try {
    await bumpSessionVersion(session.email);
  } catch (err) {
    console.error("[Auth] Session revocation failed:", err instanceof Error ? err.message : String(err));
    return { error: "Sessions could not be revoked. Nothing was changed; please try again." };
  }
  await destroyAdminSession();
  redirect("/saint-denis/login");
}
