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
    <div className="w-full max-w-xl mx-auto pt-28 sm:pt-32 pb-14 px-4 sm:px-6 flex flex-col gap-6 sm:gap-7 relative">
      {/* ─── Compact Mobile Hero Header ─── */}
      <header className="flex flex-col gap-3 pb-3 border-b border-white/[0.08]">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium text-pacific-cyan bg-pacific-cyan/[0.08] border border-pacific-cyan/20 w-fit shadow-[inset_0_1px_0_rgba(24,155,173,0.2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-pacific-cyan shadow-[0_0_6px_rgba(24,155,173,0.8)]" />
          <MessageSquare className="w-3 h-3 text-pacific-cyan" />
          <span>{content.eyebrow || "GET IN TOUCH"}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-space leading-tight">
          {content.title || "Let's talk."}
        </h1>

        <p className="text-xs sm:text-sm text-muted/80 leading-relaxed font-sans max-w-sm">
          {content.description ||
            "Have an open role, project inquiry, or question? Send a note below."}
        </p>
      </header>

      {/* ─── Primary Visual Component: Message Form ─── */}
      <section aria-label="Send a Message" className="w-full">
        <div className="p-4 sm:p-6 rounded-2xl bg-[#121219]/90 backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_32px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden">
          {status === "success" ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-3 relative z-10">
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
                className="mt-3 px-5 py-2.5 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-pacific-cyan/90 transition-all cursor-pointer shadow-md active:scale-[0.98]"
              >
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 sm:gap-4 relative z-10">
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
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-red-400 text-xs shadow-[inset_0_1px_0_rgba(239,68,68,0.2)]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="flex flex-col gap-1">
                <label htmlFor="mobile_user_name" className="text-[11px] font-mono uppercase tracking-wider text-muted/80">
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
                  className="w-full h-11 px-3.5 rounded-xl bg-[#0d0d13] border border-white/[0.08] hover:border-white/[0.14] text-foreground text-[16px] sm:text-sm placeholder:text-muted/35 focus:outline-none focus:border-pacific-cyan/60 focus:ring-1 focus:ring-pacific-cyan/25 focus:bg-[#0d0d13] focus:shadow-[0_0_12px_rgba(24,155,173,0.12)] transition-all shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.45)]"
                />
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-1">
                <label htmlFor="mobile_user_email" className="text-[11px] font-mono uppercase tracking-wider text-muted/80">
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
                  className="w-full h-11 px-3.5 rounded-xl bg-[#0d0d13] border border-white/[0.08] hover:border-white/[0.14] text-foreground text-[16px] sm:text-sm placeholder:text-muted/35 focus:outline-none focus:border-pacific-cyan/60 focus:ring-1 focus:ring-pacific-cyan/25 focus:bg-[#0d0d13] focus:shadow-[0_0_12px_rgba(24,155,173,0.12)] transition-all shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.45)]"
                />
              </div>

              {/* Mobile Number */}
              <div className="flex flex-col gap-1">
                <label htmlFor="mobile_mobile_number" className="text-[11px] font-mono uppercase tracking-wider text-muted/80">
                  Mobile Number <span className="text-muted/40 text-[10px] normal-case">(optional)</span>
                </label>
                <input
                  id="mobile_mobile_number"
                  type="tel"
                  name="mobile_number"
                  placeholder={placeholders.phone}
                  value={formData.mobile_number}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#0d0d13] border border-white/[0.08] hover:border-white/[0.14] text-foreground text-[16px] sm:text-sm placeholder:text-muted/35 focus:outline-none focus:border-pacific-cyan/60 focus:ring-1 focus:ring-pacific-cyan/25 focus:bg-[#0d0d13] focus:shadow-[0_0_12px_rgba(24,155,173,0.12)] transition-all shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.45)]"
                />
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-1">
                <label htmlFor="mobile_subject" className="text-[11px] font-mono uppercase tracking-wider text-muted/80">
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
                  className="w-full h-11 px-3.5 rounded-xl bg-[#0d0d13] border border-white/[0.08] hover:border-white/[0.14] text-foreground text-[16px] sm:text-sm placeholder:text-muted/35 focus:outline-none focus:border-pacific-cyan/60 focus:ring-1 focus:ring-pacific-cyan/25 focus:bg-[#0d0d13] focus:shadow-[0_0_12px_rgba(24,155,173,0.12)] transition-all shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.45)]"
                />
              </div>

              {/* Your Message */}
              <div className="flex flex-col gap-1">
                <label htmlFor="mobile_message" className="text-[11px] font-mono uppercase tracking-wider text-muted/80">
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
                  className="w-full p-3.5 rounded-xl bg-[#0d0d13] border border-white/[0.08] hover:border-white/[0.14] text-foreground text-[16px] sm:text-sm placeholder:text-muted/35 focus:outline-none focus:border-pacific-cyan/60 focus:ring-1 focus:ring-pacific-cyan/25 focus:bg-[#0d0d13] focus:shadow-[0_0_12px_rgba(24,155,173,0.12)] transition-all resize-y min-h-[110px] leading-relaxed font-sans shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.45)]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full h-12 mt-1 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#1db0c4] active:bg-[#158999] transition-all duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_8px_rgba(24,155,173,0.25)] active:scale-[0.99] disabled:opacity-50 cursor-pointer min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pacific-cyan"
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
          className="p-4 sm:p-5 rounded-2xl bg-[#121219]/90 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.16] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.35)] flex items-center justify-between gap-3 transition-all active:scale-[0.99] active:bg-white/[0.03] outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan relative overflow-hidden"
        >
          <div className="flex items-center gap-3.5 min-w-0 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-pacific-cyan/[0.08] border border-pacific-cyan/20 flex items-center justify-center text-pacific-cyan shrink-0 shadow-[inset_0_1px_0_rgba(24,155,173,0.15)]">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted/60 block">
                DIRECT EMAIL
              </span>
              <span className="text-xs sm:text-sm font-semibold font-space text-foreground truncate block mt-0.5">
                {emailAddress}
              </span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0 relative z-10">
            <ArrowUpRight className="w-3.5 h-3.5 text-muted/40" />
          </div>
        </a>

        {/* Location Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#121219]/90 backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.35)] flex items-center gap-3.5 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-[inset_0_1px_0_rgba(16,185,129,0.15)] relative z-10">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0 relative z-10">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted/60 block">
              LOCATION
            </span>
            <span className="text-xs sm:text-sm font-semibold font-space text-foreground truncate block mt-0.5">
              {locationString}
            </span>
          </div>
        </div>

        {/* Optional Phone Card */}
        {showPhone && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#121219]/90 backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.35)] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-muted shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted/60 block">
                PHONE
              </span>
              <span className="text-xs sm:text-sm font-semibold font-space text-foreground truncate block mt-0.5">
                {content.phone}
              </span>
            </div>
          </div>
        )}

        {/* Social Channels: One Cohesive Communication Surface */}
        {socials.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#121219]/90 backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.35)] flex flex-col gap-2.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted/60">
              SOCIAL CHANNELS
            </span>
            <div className="divide-y divide-white/[0.05] rounded-xl overflow-hidden border border-white/[0.06] bg-[#0d0d13]/70">
              {socials.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit Rushan Siddiqui on ${social.name}`}
                    className="flex items-center justify-between p-3.5 hover:bg-white/[0.02] active:bg-white/[0.04] text-muted hover:text-foreground transition-all group min-h-[48px]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-pacific-cyan/[0.08] border border-pacific-cyan/15 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-pacific-cyan shrink-0" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-foreground/90 group-hover:text-pacific-cyan transition-colors truncate">
                        {social.name}
                      </span>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted/40 group-hover:text-pacific-cyan shrink-0" />
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
