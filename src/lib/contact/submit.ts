/**
 * Contact enquiries. Two deliveries, in this order:
 *
 * 1. Formspree receives the enquiry (the owner's copy). Its answer decides whether the visitor
 *    sees "sent" or an error: an enquiry Formspree did not take was not received.
 * 2. Only after that, EmailJS sends the automatic confirmation to the visitor's address
 *    (template params user_name, user_email, subject, message; the template routes it). This is
 *    the RAWIN 2.0 behaviour, which RAWIN 3.0 kept until 2026-10-14, when the call was removed as
 *    a "duplicate" and visitors stopped getting the email.
 *
 * A confirmation that EmailJS refuses (or that never reaches it) does not undo the enquiry: the
 * visitor still sees "sent", with a note that the confirmation email could not go out, so they
 * are not invited to send the same enquiry twice. An accepted EmailJS request only means EmailJS
 * took it; inbox delivery is not observable from here.
 *
 * Pure (no React, no SDK import): the caller passes the network calls, so tests drive it directly.
 */

export const FORMSPREE_ENDPOINT = "https://formspree.io/f/mblkyvyw";

/**
 * EmailJS browser identifiers. These are public by design (EmailJS's browser SDK sends them
 * from every visitor's browser; abuse is limited by the domain allowlist in the EmailJS
 * dashboard), so the values that shipped with RAWIN 2.0 and 3.0 are the defaults. NEXT_PUBLIC_*
 * variables override them at build time when the account changes.
 */
export const EMAILJS_CONFIG = {
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "7OVQm6WrduZGlvd6i",
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "service_46acsfl",
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "template_x0tcmrn",
};

export type EmailJsConfig = typeof EMAILJS_CONFIG;

export interface EnquiryForm {
  user_name: string;
  user_email: string;
  mobile_number: string;
  subject: string;
  message: string;
  _gotcha: string;
}

export const DEFAULT_SUBJECT = "RAWIN 3.0 Portfolio Inquiry";

/** The confirmation template's variables (the contract RAWIN 3.0 used before 2026-10-14) */
export function confirmationParams(form: EnquiryForm): Record<string, string> {
  return {
    user_name: form.user_name.trim(),
    user_email: form.user_email.trim(),
    subject: form.subject.trim() || DEFAULT_SUBJECT,
    message: form.message,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ValidationError = "required" | "email";

export function validateEnquiry(form: EnquiryForm): ValidationError | null {
  if (!form.user_name.trim() || !form.user_email.trim() || !form.message.trim()) return "required";
  if (!EMAIL_RE.test(form.user_email.trim())) return "email";
  return null;
}

export interface EnquiryDeps {
  /** POST to Formspree; resolves with the HTTP answer, rejects on a network failure */
  postForm(endpoint: string, body: FormData): Promise<{ ok: boolean; status: number }>;
  /** emailjs.send(); rejects with { status, text } when EmailJS refuses, or a network error */
  sendEmail(serviceId: string, templateId: string, params: Record<string, string>, publicKey: string): Promise<{ status: number; text: string }>;
  config?: EmailJsConfig;
  /** where a refused confirmation is reported for diagnosis (never with credentials) */
  warn?(message: string): void;
}

export type ConfirmationOutcome = "sent" | "failed" | "unconfigured" | "skipped";

export type EnquiryResult =
  | { status: "success"; confirmation: ConfirmationOutcome; notice: string }
  | { status: "error"; reason: ValidationError | "rejected" | "network"; message: string };

export const MESSAGES = {
  required: "Please fill in all required fields.",
  email: "Please enter a valid email address.",
  rejected: "Submission failed. Please try again or reach out directly via email.",
  network: "Network error. Please check your connection or email directly.",
  confirmationFailed:
    "Your message was delivered, but the confirmation email to your inbox could not be sent. No need to send it again.",
};

function describe(e: unknown): string {
  if (e && typeof e === "object" && "status" in e) {
    const { status, text } = e as { status: unknown; text?: unknown };
    return `EmailJS answered ${String(status)}${text ? `: ${String(text)}` : ""}`;
  }
  return e instanceof Error ? `${e.name}: ${e.message}` : "unknown error";
}

export async function submitEnquiry(form: EnquiryForm, deps: EnquiryDeps): Promise<EnquiryResult> {
  // honeypot: a bot is told it worked and nothing is sent
  if (form._gotcha) return { status: "success", confirmation: "skipped", notice: "" };

  const invalid = validateEnquiry(form);
  if (invalid) return { status: "error", reason: invalid, message: MESSAGES[invalid] };

  const body = new FormData();
  body.append("user_name", form.user_name);
  body.append("user_email", form.user_email);
  body.append("mobile_number", form.mobile_number || "N/A");
  body.append("subject", form.subject || DEFAULT_SUBJECT);
  body.append("message", form.message);

  try {
    const res = await deps.postForm(FORMSPREE_ENDPOINT, body);
    if (!res.ok) return { status: "error", reason: "rejected", message: MESSAGES.rejected };
  } catch {
    return { status: "error", reason: "network", message: MESSAGES.network };
  }

  const config = deps.config ?? EMAILJS_CONFIG;
  if (!config.publicKey || !config.serviceId || !config.templateId) {
    deps.warn?.("Contact confirmation email not sent: EmailJS is not configured.");
    return { status: "success", confirmation: "unconfigured", notice: MESSAGES.confirmationFailed };
  }
  try {
    await deps.sendEmail(config.serviceId, config.templateId, confirmationParams(form), config.publicKey);
    return { status: "success", confirmation: "sent", notice: "" };
  } catch (e) {
    deps.warn?.(`Contact confirmation email not sent (${describe(e)}).`);
    return { status: "success", confirmation: "failed", notice: MESSAGES.confirmationFailed };
  }
}
