"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { verifyAdminCredentials, createAdminSession, destroyAdminSession } from "@/lib/auth";
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from "@/lib/rate-limit";

export interface LoginActionState {
  error?: string;
  success?: boolean;
}

export async function loginAction(
  prevState: LoginActionState | null,
  formData: FormData
): Promise<LoginActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/saint-denis";

  // Determine client IP for rate limiting
  const headerList = await headers();
  const clientIp =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "127.0.0.1";

  // 1. Check rate limit
  const rateCheck = checkRateLimit(clientIp);
  if (!rateCheck.allowed) {
    const minutes = Math.ceil(rateCheck.retryAfterSeconds / 60);
    return {
      error: `Too many failed login attempts. Please try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`,
    };
  }

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  const result = await verifyAdminCredentials(email, password);

  if (!result.success || !result.email) {
    const failedAttempt = recordFailedAttempt(clientIp);
    if (!failedAttempt.allowed) {
      const minutes = Math.ceil(failedAttempt.retryAfterSeconds / 60);
      return {
        error: `Too many failed login attempts. Please try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`,
      };
    }
    return { error: "Invalid email or password." };
  }

  // Clear rate limit record on successful authentication
  clearRateLimit(clientIp);

  await createAdminSession(result.email);

  // Safe redirect URL
  const target = redirectTo.startsWith("/saint-denis") ? redirectTo : "/saint-denis";
  redirect(target);
}

export async function logoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/saint-denis/login");
}
