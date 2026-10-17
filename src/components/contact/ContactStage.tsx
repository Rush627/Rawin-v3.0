"use client";

import { useState, type ChangeEvent, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { ArrowUpRight, Check, Loader2, RotateCcw } from "lucide-react";
import type { ContactContent } from "@/lib/site-content";
import { AVAILABILITY_TONE, type AvailabilityContent } from "@/lib/cms/availability";
import type { SocialLinkItem } from "@/components/SocialIcons";
import MaskText from "@/components/system/MaskText";
import { EASE_EDITORIAL } from "@/lib/motion";
import { statusTone } from "@/components/shell/SiteFooter";

export interface ContactStageProps {
  formData: { user_name: string; user_email: string; mobile_number: string; subject: string; message: string; _gotcha: string };
  status: "idle" | "loading" | "success" | "error";
  errorMessage: string;
  /** shown under the success message (the visitor's confirmation email could not be sent) */
  notice?: string;
  placeholders: { name: string; email: string; phone: string; subject: string; message: string };
  emailAddress: string;
  locationString: string;
  socials: SocialLinkItem[];
  desktopGmailUrl: string;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent) => void;
  handleEmailCardClick: (e: MouseEvent<HTMLAnchorElement>) => void;
  handleResetStatus: () => void;
  content: ContactContent;
  /** canonical availability (the tablet badge shows its note) */
  availability?: AvailabilityContent;
}

function Field({
  index,
  label,
  optional,
  invalid,
  children,
  htmlFor,
  focused,
}: {
  index: string;
  label: string;
  optional?: boolean;
  invalid?: boolean;
  children: ReactNode;
  htmlFor: string;
  focused: boolean;
}) {
  return (
    <div className="group relative pt-6 sm:pt-7">
      <label htmlFor={htmlFor} className="absolute top-0 left-0 right-0 flex items-baseline justify-between label-mono">
        <span className={`transition-colors ${focused ? "text-accent" : invalid ? "text-danger" : "text-fg-subtle"}`}>
          <span className="mr-2">{index}</span>
          {label}
        </span>
        <span className="text-fg-subtle normal-case tracking-normal font-sans text-[12px]">{optional ? "Optional" : "Required"}</span>
      </label>
      {children}
      <span
        aria-hidden="true"
        className={`absolute left-0 bottom-0 h-[2px] bg-accent origin-left transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.1,1)] ${
          focused ? "scale-x-100" : "scale-x-0"
        }`}
      />
    </div>
  );
}

export default function ContactStage(props: ContactStageProps) {
  const {
    formData,
    status,
    errorMessage,
    notice,
    placeholders,
    emailAddress,
    locationString,
    socials,
    desktopGmailUrl,
    handleChange,
    handleSubmit,
    handleEmailCardClick,
    handleResetStatus,
    content,
    availability,
  } = props;
  const reduced = useReducedMotionSafe();
  const [focus, setFocus] = useState<string | null>(null);
  const showPhone = Boolean(content.showPhoneNumber && content.phone);
  const isError = status === "error";
  const missing = (v: string) => isError && !v.trim();

  const title = content.title || "Let's talk about what you're building.";
  const words = title.trim().split(/\s+/);
  const split = Math.max(1, Math.ceil(words.length / 2));
  const lines = words.length > 3
    ? [<span key="l0">{words.slice(0, split).join(" ")}</span>, <em key="e" className="italic text-accent">{words.slice(split).join(" ")}</em>]
    : [<span key="l1">{title}</span>];

  const inputBase =
    "w-full bg-transparent border-0 border-b border-line-strong rounded-none px-0 pt-2 pb-2.5 sm:pt-3 sm:pb-3 text-[16px] sm:text-[18px] xl:text-[19px] text-fg placeholder:text-fg-subtle/70 outline-none focus:outline-none focus-visible:outline-none transition-colors aria-[invalid=true]:border-danger";
  // the gauge in the form header: how many of the five fields hold something
  const filled = [formData.user_name, formData.user_email, formData.mobile_number, formData.subject, formData.message].filter((v) => v.trim()).length;
  const bind = (name: string) => ({
    onFocus: () => setFocus(name),
    onBlur: () => setFocus((f) => (f === name ? null : f)),
  });

  // Phones: the header's Orbit row is not shown on Contact, so the page starts right under the bar
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 pt-[calc(env(safe-area-inset-top)+6.75rem)] md:pt-[11.25rem] lg:pt-[12.25rem] pb-8">
      <div className="flex items-center justify-between gap-4 label-mono text-fg-muted mb-5 sm:mb-8 lg:mb-12">
        <span className="inline-flex items-center gap-3">
          <span className="text-accent">06</span>
          <span className="h-px w-8 bg-line-strong" />
          <span>{content.eyebrow || "Get in touch"}</span>
        </span>
        {/* tablets only: on desktop the inquiry card stands alone (the footer carries availability) */}
        {availability?.note && (
          <span className={`hidden sm:inline-flex lg:hidden items-center gap-2 normal-case tracking-normal font-sans text-[13px] ${statusTone(AVAILABILITY_TONE[availability.state])}`}>
            <span className="status-dot" />
            <span className="text-fg">{availability.note}</span>
          </span>
        )}
      </div>

      <div className="contact-grid grid grid-cols-12 gap-x-4 gap-y-9 sm:gap-y-12">
        {/* Statement + channels */}
        <div className="col-span-12 lg:col-span-5 flex flex-col">
          <MaskText as="h1" immediate className="contact-title text-fg" lines={lines} />
          <p className="mt-4 sm:mt-6 text-[15.5px] leading-[1.6] sm:text-[17px] lg:text-lg sm:leading-relaxed text-fg-muted max-w-[42ch]">
            {content.description ||
              "Open to full-time developer roles, freelance work and thoughtful collaborations. Messages reach me directly."}
          </p>

          <div className="mt-7 sm:mt-10 lg:mt-auto lg:pt-14">
            <p className="label-mono text-fg-subtle mb-2 sm:mb-3">Write directly</p>
            <a
              href={desktopGmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleEmailCardClick}
              aria-label={`Send direct email to ${emailAddress}`}
              className="group inline-flex items-baseline gap-2 font-display text-[clamp(1.3rem,5.8vw,1.75rem)] sm:text-[clamp(1.75rem,3.2vw,2.6rem)] lg:text-[clamp(1.55rem,2.35vw,2.6rem)] leading-[1.05] tracking-[-0.02em] text-fg [overflow-wrap:anywhere]"
            >
              <span className="link-draw">{emailAddress}</span>
              <ArrowUpRight className="w-[0.55em] h-[0.55em] shrink-0 transition-transform duration-500 group-hover:rotate-45" />
            </a>

            <div className="mt-6 sm:mt-9">
            <dl className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-x-5 sm:gap-x-6 border-t border-line">
              <div className="py-3 sm:py-4 border-b border-line">
                <dt className="label-mono text-fg-subtle">Based in</dt>
                <dd className="mt-1 sm:mt-1.5 text-[14.5px] sm:text-[15px] text-fg">{locationString}</dd>
              </div>
              {showPhone ? (
                <div className="py-3 sm:py-4 border-b border-line">
                  <dt className="label-mono text-fg-subtle">Phone</dt>
                  <dd className="mt-1 sm:mt-1.5 text-[14.5px] sm:text-[15px] text-fg">
                    <a href={`tel:${content.phone.replace(/\s+/g, "")}`} className="link-draw">
                      {content.phone}
                    </a>
                  </dd>
                </div>
              ) : (
                <div className="py-3 sm:py-4 border-b border-line">
                  <dt className="label-mono text-fg-subtle">Response</dt>
                  <dd className="mt-1 sm:mt-1.5 text-[14.5px] sm:text-[15px] text-fg">{content.responseTime || "Usually within a day"}</dd>
                </div>
              )}
            </dl>
            </div>

            {/* Phones get these in the footer just below; tablets and desktops keep them here */}
            {socials.length > 0 && (
              <ul className="mt-6 hidden md:flex flex-wrap gap-2" aria-label="Social profiles">
                {socials.map((s) => {
                  const Icon = s.icon;
                  return (
                    <li key={s.id}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2 h-11 pl-3.5 pr-4 rounded-full border border-line hover:border-fg text-sm text-fg transition-colors"
                      >
                        <Icon className="w-4 h-4 text-fg-muted group-hover:text-accent transition-colors" />
                        <span>{s.name}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="col-span-12 lg:col-span-7">
          <div className="contact-card relative surface-paper rounded-[22px] sm:rounded-[32px] p-5 sm:p-8 lg:p-10 xl:p-12 overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute -top-1/3 -right-1/4 w-[70%] aspect-square rounded-full opacity-60 blur-3xl pointer-events-none"
              style={{ background: "radial-gradient(circle, var(--atmo-a), transparent 70%)" }}
            />
            <AnimatePresence mode="wait" initial={false}>
              {status === "success" ? (
                <motion.div
                  key="sent"
                  role="status"
                  className="relative min-h-[420px] sm:min-h-[520px] flex flex-col"
                  initial={reduced ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.6, ease: EASE_EDITORIAL }}
                >
                  <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success/15 text-success">
                    <Check className="w-6 h-6" />
                  </span>
                  <p className="mt-auto label-mono text-fg-subtle">Transmission received</p>
                  <h2 className="mt-4 display-sm text-fg">{content.successTitle || "Message sent successfully"}</h2>
                  <p className="mt-4 text-fg-muted max-w-[42ch]">
                    {content.successMessage || "Thank you for reaching out. I'll get back to you as soon as possible."}
                  </p>
                  {notice && <p className="mt-3 text-sm text-fg-subtle max-w-[42ch]">{notice}</p>}
                  <button type="button" onClick={handleResetStatus} className="mt-10 btn btn-ghost w-fit">
                    <RotateCcw className="w-4 h-4" />
                    <span>Send another message</span>
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  noValidate={false}
                  className="relative flex flex-col gap-6 sm:gap-8"
                  aria-describedby={isError ? "contact-error" : undefined}
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduced ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 label-mono text-fg-subtle -mb-1 sm:-mb-2">
                    <span>New inquiry</span>
                    <span className="inline-flex items-center gap-3">
                      <span aria-hidden="true" className="contact-gauge">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <span key={i} className={i < filled ? "is-on" : undefined} />
                        ))}
                      </span>
                      <span>Form / 05 fields</span>
                    </span>
                  </div>

                  {/* Honeypot spam trap — hidden from people and assistive tech */}
                  <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
                    <label>
                      Leave this field empty
                      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" value={formData._gotcha} onChange={handleChange} />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                    <Field index="01" label="Name" htmlFor="c-name" focused={focus === "name"} invalid={missing(formData.user_name)}>
                      <input
                        id="c-name"
                        type="text"
                        name="user_name"
                        required
                        autoComplete="name"
                        placeholder={placeholders.name}
                        value={formData.user_name}
                        onChange={handleChange}
                        aria-invalid={missing(formData.user_name) || undefined}
                        className={inputBase}
                        {...bind("name")}
                      />
                    </Field>
                    <Field index="02" label="Email" htmlFor="c-email" focused={focus === "email"} invalid={missing(formData.user_email)}>
                      <input
                        id="c-email"
                        type="email"
                        name="user_email"
                        required
                        autoComplete="email"
                        inputMode="email"
                        placeholder={placeholders.email}
                        value={formData.user_email}
                        onChange={handleChange}
                        aria-invalid={missing(formData.user_email) || undefined}
                        className={inputBase}
                        {...bind("email")}
                      />
                    </Field>
                    <Field index="03" label="Phone" optional htmlFor="c-phone" focused={focus === "phone"}>
                      <input
                        id="c-phone"
                        type="tel"
                        name="mobile_number"
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder={placeholders.phone}
                        value={formData.mobile_number}
                        onChange={handleChange}
                        className={inputBase}
                        {...bind("phone")}
                      />
                    </Field>
                    <Field index="04" label="Subject" htmlFor="c-subject" focused={focus === "subject"}>
                      <input
                        id="c-subject"
                        type="text"
                        name="subject"
                        required
                        placeholder={placeholders.subject}
                        value={formData.subject}
                        onChange={handleChange}
                        className={inputBase}
                        {...bind("subject")}
                      />
                    </Field>
                  </div>

                  <Field index="05" label="Message" htmlFor="c-message" focused={focus === "message"} invalid={missing(formData.message)}>
                    <textarea
                      id="c-message"
                      name="message"
                      required
                      rows={4}
                      placeholder={placeholders.message}
                      value={formData.message}
                      onChange={handleChange}
                      aria-invalid={missing(formData.message) || undefined}
                      className={`${inputBase} resize-y min-h-[112px] sm:min-h-[132px] leading-relaxed`}
                      {...bind("message")}
                    />
                  </Field>

                  {/* feedback and actions share one block, so an empty message area adds no gap */}
                  <div className="flex flex-col gap-4 sm:gap-5">
                  <div aria-live="assertive">
                    {isError && errorMessage && (
                      <p id="contact-error" className="flex items-start gap-2 text-sm text-danger">
                        <span aria-hidden="true" className="mt-[0.45em] w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                        <span>{errorMessage}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-5">
                    <p className="text-[12.5px] sm:text-[13px] text-fg-subtle max-w-[34ch]">Your details are only used to reply to this message.</p>
                    <button type="submit" disabled={status === "loading"} className="btn btn-accent w-full sm:w-auto sm:min-w-[200px]">
                      {status === "loading" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending…</span>
                        </>
                      ) : (
                        <>
                          <span>Send message</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
