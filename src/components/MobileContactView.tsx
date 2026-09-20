import React from "react";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  MessageSquare,
  ArrowUpRight,
  Phone,
} from "lucide-react";
import type { ContactSharedProps } from "@/components/DesktopContactView";

export default function MobileContactView({
  formData,
  status,
  errorMessage,
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
}: ContactSharedProps) {
  const showPhone = Boolean(content.showPhoneNumber && content.phone);

  return (
    <div className="w-full max-w-xl mx-auto pt-32 sm:pt-36 pb-16 px-4 sm:px-6 flex flex-col gap-6 sm:gap-8">
      {/* ─── Compact Mobile Intro ─── */}
      <header className="flex flex-col gap-2 pb-4 border-b border-white/[0.08]">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium text-pacific-cyan bg-pacific-cyan/[0.08] border border-pacific-cyan/20 w-fit">
          <MessageSquare className="w-3 h-3" />
          <span>{content.eyebrow || "GET IN TOUCH"}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-space leading-tight">
          Let&apos;s talk.
        </h1>

        <p className="text-xs sm:text-sm text-muted/80 leading-relaxed font-sans max-w-sm">
          {content.description ||
            "Have an open role, project inquiry, or question? Send a note below."}
        </p>
      </header>

      {/* ─── Primary Visual Component: Message Form ─── */}
      <section aria-label="Send a Message" className="w-full">
        <div className="p-4 sm:p-5 rounded-2xl bg-ink-black/50 border border-white/[0.08] shadow-lg flex flex-col">
          {status === "success" ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-foreground font-space mt-1">
                {content.successTitle || "Message Sent Successfully"}
              </h2>
              <p className="text-muted text-xs leading-relaxed whitespace-pre-line max-w-xs">
                {content.successMessage ||
                  "Thank you for reaching out. Your message has been sent and I will reply shortly."}
              </p>
              <button
                type="button"
                onClick={handleResetStatus}
                className="mt-3 px-5 py-2 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-pacific-cyan/90 transition-all cursor-pointer shadow-md"
              >
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {/* Honeypot spam trap */}
              <input
                type="text"
                name="_gotcha"
                value={formData._gotcha}
                onChange={handleChange}
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete="off"
              />

              {status === "error" && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="flex flex-col gap-1">
                <label htmlFor="mobile_user_name" className="text-[11px] font-mono text-muted/80">
                  Full Name <span className="text-pacific-cyan">*</span>
                </label>
                <input
                  id="mobile_user_name"
                  type="text"
                  name="user_name"
                  required
                  placeholder={placeholders.name}
                  value={formData.user_name}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 rounded-xl bg-ink-black/70 border border-white/[0.08] text-foreground text-sm placeholder:text-muted/30 focus:outline-none focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan transition-colors"
                />
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-1">
                <label htmlFor="mobile_user_email" className="text-[11px] font-mono text-muted/80">
                  Email Address <span className="text-pacific-cyan">*</span>
                </label>
                <input
                  id="mobile_user_email"
                  type="email"
                  name="user_email"
                  required
                  placeholder={placeholders.email}
                  value={formData.user_email}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 rounded-xl bg-ink-black/70 border border-white/[0.08] text-foreground text-sm placeholder:text-muted/30 focus:outline-none focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan transition-colors"
                />
              </div>

              {/* Mobile Number */}
              <div className="flex flex-col gap-1">
                <label htmlFor="mobile_mobile_number" className="text-[11px] font-mono text-muted/80">
                  Mobile Number <span className="text-muted/40 text-[10px]">(optional)</span>
                </label>
                <input
                  id="mobile_mobile_number"
                  type="tel"
                  name="mobile_number"
                  placeholder={placeholders.phone}
                  value={formData.mobile_number}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 rounded-xl bg-ink-black/70 border border-white/[0.08] text-foreground text-sm placeholder:text-muted/30 focus:outline-none focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan transition-colors"
                />
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-1">
                <label htmlFor="mobile_subject" className="text-[11px] font-mono text-muted/80">
                  Subject <span className="text-pacific-cyan">*</span>
                </label>
                <input
                  id="mobile_subject"
                  type="text"
                  name="subject"
                  required
                  placeholder={placeholders.subject}
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 rounded-xl bg-ink-black/70 border border-white/[0.08] text-foreground text-sm placeholder:text-muted/30 focus:outline-none focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan transition-colors"
                />
              </div>

              {/* Your Message */}
              <div className="flex flex-col gap-1">
                <label htmlFor="mobile_message" className="text-[11px] font-mono text-muted/80">
                  Your Message <span className="text-pacific-cyan">*</span>
                </label>
                <textarea
                  id="mobile_message"
                  name="message"
                  required
                  rows={4}
                  placeholder={placeholders.message}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full p-3.5 rounded-xl bg-ink-black/70 border border-white/[0.08] text-foreground text-sm placeholder:text-muted/30 focus:outline-none focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan transition-colors resize-y min-h-[110px] leading-relaxed font-sans"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full h-12 mt-1 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-pacific-cyan/90 transition-all shadow-[0_0_18px_rgba(24,155,173,0.3)] active:scale-[0.99] disabled:opacity-50 cursor-pointer min-h-[46px]"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmitting...</span>
                  </>
                ) : (
                  <>
                    <span>Send Message</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ─── Compact Supporting Info Modules ─── */}
      <section aria-label="Direct Contact and Social Channels" className="flex flex-col gap-3">
        {/* Direct Email Card */}
        <a
          href={desktopGmailUrl}
          onClick={handleEmailCardClick}
          onPointerUp={(e) => (e.currentTarget as HTMLElement)?.blur()}
          aria-label={`Send email to ${emailAddress}`}
          className="p-4 rounded-xl bg-ink-black/40 border border-white/[0.06] hover:border-pacific-cyan/30 flex items-center justify-between gap-3 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-pacific-cyan/10 border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted/50 block">
                DIRECT EMAIL
              </span>
              <span className="text-xs font-medium text-foreground truncate block">
                {emailAddress}
              </span>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-muted/40 shrink-0" />
        </a>

        {/* Location Card */}
        <div className="p-4 rounded-xl bg-ink-black/40 border border-white/[0.06] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted/50 block">
              LOCATION
            </span>
            <span className="text-xs font-medium text-foreground truncate block">
              {locationString}
            </span>
          </div>
        </div>

        {/* Optional Phone Card */}
        {showPhone && (
          <div className="p-4 rounded-xl bg-ink-black/40 border border-white/[0.06] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-muted shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted/50 block">
                PHONE
              </span>
              <span className="text-xs font-medium text-foreground truncate block">
                {content.phone}
              </span>
            </div>
          </div>
        )}

        {/* Social Channels: Compact Horizontal Dock */}
        {socials.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted/50">
              SOCIAL CHANNELS
            </span>
            <div
              className={`grid gap-2 w-full ${
                socials.length >= 4
                  ? "grid-cols-2 min-[420px]:grid-cols-4"
                  : socials.length === 3
                  ? "grid-cols-3"
                  : "grid-cols-2"
              }`}
            >
              {socials.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit Rushan Siddiqui on ${social.name}`}
                    className="py-2.5 px-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] hover:border-pacific-cyan/30 flex items-center justify-center gap-1.5 text-foreground/85 hover:text-pacific-cyan transition-all active:scale-[0.98] min-w-0"
                  >
                    <Icon className="w-3.5 h-3.5 text-pacific-cyan shrink-0" />
                    <span className="text-xs font-medium truncate">
                      {social.name}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
