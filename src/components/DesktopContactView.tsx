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
import type { ContactContent, GlobalContent } from "@/lib/site-content";

export interface ContactSharedProps {
  formData: {
    user_name: string;
    user_email: string;
    mobile_number: string;
    subject: string;
    message: string;
    _gotcha: string;
  };
  status: "idle" | "loading" | "success" | "error";
  errorMessage: string;
  placeholders: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  };
  emailAddress: string;
  locationString: string;
  socials: Array<{
    id: string;
    name: string;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  desktopGmailUrl: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleEmailCardClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  handleResetStatus: () => void;
  content: ContactContent;
  global?: GlobalContent;
}

export default function DesktopContactView({
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
    <div className="w-full max-w-6xl mx-auto pt-32 pb-24 px-6 lg:px-8 flex flex-col gap-12">
      {/* ─── Editorial Intro Header ─── */}
      <header className="flex flex-col gap-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono font-medium text-pacific-cyan bg-pacific-cyan/[0.08] border border-pacific-cyan/20 w-fit">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{content.eyebrow || "GET IN TOUCH"}</span>
        </div>

        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground font-space leading-[1.12]">
          Let&apos;s talk about what you&apos;re building.
        </h1>

        <p className="text-base text-muted/85 leading-relaxed font-sans max-w-2xl">
          {content.description ||
            "Have an open role, a freelance inquiry, or an ambitious software vision? Send a message and I will reply within 24 hours."}
        </p>
      </header>

      {/* ─── Two-Column Workspace ─── */}
      <div className="grid grid-cols-12 gap-8 lg:gap-10 items-stretch">
        {/* Left Column: Message Form Workspace */}
        <section
          aria-label="Send a Message"
          className="col-span-7 flex flex-col h-full"
        >
          <div className="p-8 lg:p-9 rounded-2xl bg-ink-black/40 border border-white/[0.08] shadow-xl relative overflow-hidden flex flex-col h-full">
            {status === "success" ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-4 my-auto">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-foreground font-space mt-1">
                  {content.successTitle || "Message Sent Successfully"}
                </h2>
                <p className="text-muted text-sm max-w-md leading-relaxed whitespace-pre-line">
                  {content.successMessage ||
                    "Thank you for reaching out. Your message has been transmitted and I will get back to you shortly."}
                </p>
                <button
                  type="button"
                  onClick={handleResetStatus}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-pacific-cyan/90 transition-all cursor-pointer shadow-md hover:shadow-[0_0_20px_rgba(24,155,173,0.35)]"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
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
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-3 text-red-400 text-xs sm:text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Row 1: Full Name | Email Address */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="user_name" className="text-xs font-mono text-muted/90">
                      Full Name <span className="text-pacific-cyan">*</span>
                    </label>
                    <input
                      id="user_name"
                      type="text"
                      name="user_name"
                      required
                      placeholder={placeholders.name}
                      value={formData.user_name}
                      onChange={handleChange}
                      className="w-full h-12 px-4 rounded-xl bg-ink-black/60 border border-white/10 text-foreground text-sm placeholder:text-muted/40 focus:outline-none focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="user_email" className="text-xs font-mono text-muted/90">
                      Email Address <span className="text-pacific-cyan">*</span>
                    </label>
                    <input
                      id="user_email"
                      type="email"
                      name="user_email"
                      required
                      placeholder={placeholders.email}
                      value={formData.user_email}
                      onChange={handleChange}
                      className="w-full h-12 px-4 rounded-xl bg-ink-black/60 border border-white/10 text-foreground text-sm placeholder:text-muted/40 focus:outline-none focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan transition-colors"
                    />
                  </div>
                </div>

                {/* Row 2: Mobile Number | Subject */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="mobile_number" className="text-xs font-mono text-muted/90">
                      Mobile Number <span className="text-muted/50 text-[11px]">(optional)</span>
                    </label>
                    <input
                      id="mobile_number"
                      type="tel"
                      name="mobile_number"
                      placeholder={placeholders.phone}
                      value={formData.mobile_number}
                      onChange={handleChange}
                      className="w-full h-12 px-4 rounded-xl bg-ink-black/60 border border-white/10 text-foreground text-sm placeholder:text-muted/40 focus:outline-none focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="subject" className="text-xs font-mono text-muted/90">
                      Subject <span className="text-pacific-cyan">*</span>
                    </label>
                    <input
                      id="subject"
                      type="text"
                      name="subject"
                      required
                      placeholder={placeholders.subject}
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full h-12 px-4 rounded-xl bg-ink-black/60 border border-white/10 text-foreground text-sm placeholder:text-muted/40 focus:outline-none focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan transition-colors"
                    />
                  </div>
                </div>

                {/* Row 3: Your Message */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="message" className="text-xs font-mono text-muted/90">
                    Your Message <span className="text-pacific-cyan">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    placeholder={placeholders.message}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full p-4 rounded-xl bg-ink-black/60 border border-white/10 text-foreground text-sm placeholder:text-muted/40 focus:outline-none focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan transition-colors resize-y min-h-[150px] leading-relaxed font-sans"
                  />
                </div>

                {/* Row 4: Submit Action */}
                <div className="mt-auto pt-2">
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-pacific-cyan/90 transition-all shadow-[0_0_20px_rgba(24,155,173,0.3)] hover:shadow-[0_0_30px_rgba(24,155,173,0.45)] transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer min-h-[46px]"
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Transmitting Message...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* Right Column: Information & Channels Rail */}
        <aside
          aria-label="Direct Communication Channels"
          className="col-span-5 flex flex-col gap-4"
        >
          {/* Module 1: Direct Email Card */}
          <a
            href={desktopGmailUrl}
            onClick={handleEmailCardClick}
            onPointerUp={(e) => (e.currentTarget as HTMLElement)?.blur()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Send direct email to ${emailAddress}`}
            className="group p-5 lg:p-6 rounded-2xl bg-ink-black/40 border border-white/[0.08] hover:border-pacific-cyan/40 transition-all duration-300 flex flex-col gap-3 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-pacific-cyan/10 border border-pacific-cyan/25 flex items-center justify-center text-pacific-cyan group-hover:bg-pacific-cyan group-hover:text-ink-black transition-all">
                <Mail className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted/40 group-hover:text-pacific-cyan group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted/60">
                DIRECT EMAIL
              </span>
              <p className="text-sm lg:text-base font-semibold text-foreground mt-0.5 break-all group-hover:text-pacific-cyan transition-colors">
                {emailAddress}
              </p>
              <p className="text-xs text-muted/70 mt-1">
                Click to open a prefilled email
              </p>
            </div>
          </a>

          {/* Module 2: Location Card */}
          <div className="p-5 lg:p-6 rounded-2xl bg-ink-black/40 border border-white/[0.08] hover:border-emerald-500/30 transition-all duration-300 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted/60">
                LOCATION
              </span>
              <p className="text-sm lg:text-base font-semibold text-foreground mt-0.5">
                {locationString}
              </p>
              <p className="text-xs text-muted/70 mt-1">
                Available for remote collaborations worldwide
              </p>
            </div>
          </div>

          {/* Optional Phone Card */}
          {showPhone && (
            <div className="p-5 lg:p-6 rounded-2xl bg-ink-black/40 border border-white/[0.08] flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-muted">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted/60">
                  PHONE
                </span>
                <p className="text-sm lg:text-base font-semibold text-foreground mt-0.5">
                  {content.phone}
                </p>
              </div>
            </div>
          )}

          {/* Module 3: Social Channels */}
          {socials.length > 0 && (
            <div className="p-5 lg:p-6 rounded-2xl bg-ink-black/40 border border-white/[0.08] flex flex-col gap-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted/60">
                SOCIAL CHANNELS
              </span>
              <div className="flex flex-col gap-2 pt-1">
                {socials.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Visit Rushan Siddiqui on ${social.name}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-pacific-cyan/30 text-muted hover:text-foreground transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-pacific-cyan shrink-0 transition-transform group-hover:scale-110" />
                        <span className="text-xs sm:text-sm font-medium group-hover:text-pacific-cyan transition-colors">
                          {social.name}
                        </span>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-muted/40 group-hover:text-pacific-cyan group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
