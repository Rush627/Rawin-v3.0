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
import TechnicalTraceField from "@/components/TechnicalTraceField";

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
    <div className="w-full max-w-6xl mx-auto pt-32 pb-16 px-6 lg:px-8 flex flex-col gap-12">
      {/* ─── Editorial Intro Header ─── */}
      <header className="flex flex-col gap-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium text-pacific-cyan bg-pacific-cyan/[0.08] border border-pacific-cyan/20 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-pacific-cyan" />
          <MessageSquare className="w-3.5 h-3.5 text-pacific-cyan" />
          <span>{content.eyebrow || "GET IN TOUCH"}</span>
        </div>

        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground font-space leading-[1.12]">
          {content.title || "Let's talk about what you're building."}
        </h1>

        <p className="text-base text-muted/80 leading-relaxed font-sans max-w-2xl">
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
          <div className="p-8 lg:p-9 rounded-2xl bg-[#121219]/95 border border-white/[0.07] hover:border-white/[0.11] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_36px_rgba(0,0,0,0.4)] backdrop-blur-md flex flex-col h-full transition-colors duration-200">
            {status === "success" ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-4 my-auto">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-7 h-7" />
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
                  className="mt-4 px-6 py-2.5 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-pacific-cyan/90 transition-all cursor-pointer shadow-md"
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
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-xs sm:text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Row 1: Full Name | Email Address */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="user_name" className="text-[11px] font-mono uppercase tracking-wider text-muted/75">
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
                      className="w-full h-12 px-4 rounded-xl bg-[#0d0d13] border border-white/[0.07] hover:border-white/[0.12] text-foreground text-sm placeholder:text-muted/30 focus:outline-none focus:border-pacific-cyan/60 focus:ring-1 focus:ring-pacific-cyan/20 focus:bg-[#0f0f16] transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="user_email" className="text-[11px] font-mono uppercase tracking-wider text-muted/75">
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
                      className="w-full h-12 px-4 rounded-xl bg-[#0d0d13] border border-white/[0.07] hover:border-white/[0.12] text-foreground text-sm placeholder:text-muted/30 focus:outline-none focus:border-pacific-cyan/60 focus:ring-1 focus:ring-pacific-cyan/20 focus:bg-[#0f0f16] transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]"
                    />
                  </div>
                </div>

                {/* Row 2: Mobile Number | Subject */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="mobile_number" className="text-[11px] font-mono uppercase tracking-wider text-muted/75">
                      Mobile Number <span className="text-muted/45 text-[10px] normal-case">(optional)</span>
                    </label>
                    <input
                      id="mobile_number"
                      type="tel"
                      name="mobile_number"
                      placeholder={placeholders.phone}
                      value={formData.mobile_number}
                      onChange={handleChange}
                      className="w-full h-12 px-4 rounded-xl bg-[#0d0d13] border border-white/[0.07] hover:border-white/[0.12] text-foreground text-sm placeholder:text-muted/30 focus:outline-none focus:border-pacific-cyan/60 focus:ring-1 focus:ring-pacific-cyan/20 focus:bg-[#0f0f16] transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="subject" className="text-[11px] font-mono uppercase tracking-wider text-muted/75">
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
                      className="w-full h-12 px-4 rounded-xl bg-[#0d0d13] border border-white/[0.07] hover:border-white/[0.12] text-foreground text-sm placeholder:text-muted/30 focus:outline-none focus:border-pacific-cyan/60 focus:ring-1 focus:ring-pacific-cyan/20 focus:bg-[#0f0f16] transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]"
                    />
                  </div>
                </div>

                {/* Row 3: Your Message */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="message" className="text-[11px] font-mono uppercase tracking-wider text-muted/75">
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
                    className="w-full p-4 rounded-xl bg-[#0d0d13] border border-white/[0.07] hover:border-white/[0.12] text-foreground text-sm placeholder:text-muted/30 focus:outline-none focus:border-pacific-cyan/60 focus:ring-1 focus:ring-pacific-cyan/20 focus:bg-[#0f0f16] transition-all resize-y min-h-[150px] leading-relaxed font-sans shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]"
                  />
                </div>

                {/* Row 4: Submit Action */}
                <div className="mt-auto pt-2">
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-pacific-cyan/90 transition-all duration-150 shadow-[0_2px_10px_rgba(24,155,173,0.2)] hover:shadow-[0_4px_16px_rgba(24,155,173,0.3)] transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] disabled:opacity-50 cursor-pointer min-h-[46px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pacific-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-ink-black"
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Transmitting...</span>
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
            className="group p-5 lg:p-6 rounded-2xl bg-[#121219]/95 border border-white/[0.07] hover:border-white/[0.13] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_28px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3.5 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.07] text-pacific-cyan/90 flex items-center justify-center transition-colors group-hover:bg-pacific-cyan/[0.08] group-hover:border-pacific-cyan/25">
                <Mail className="w-4 h-4" />
              </div>
              <div className="w-7 h-7 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 text-muted/35 group-hover:text-pacific-cyan group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted/60">
                DIRECT EMAIL
              </span>
              <p className="text-sm lg:text-base font-semibold font-space text-foreground mt-1 break-all group-hover:text-pacific-cyan transition-colors">
                {emailAddress}
              </p>
              <p className="text-xs text-muted/65 mt-0.5">
                Click to open a prefilled email
              </p>
            </div>
          </a>

          {/* Module 2: Location Card */}
          <div className="p-5 lg:p-6 rounded-2xl bg-[#121219]/95 border border-white/[0.07] hover:border-emerald-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_28px_rgba(0,0,0,0.35)] transition-colors duration-200 flex flex-col gap-3.5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.07] text-emerald-400/90 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted/60">
                LOCATION
              </span>
              <p className="text-sm lg:text-base font-semibold font-space text-foreground mt-1">
                {locationString}
              </p>
              <p className="text-xs text-muted/65 mt-0.5">
                Available for remote collaborations worldwide
              </p>
            </div>
          </div>

          {/* Optional Phone Card */}
          {showPhone && (
            <div className="p-5 lg:p-6 rounded-2xl bg-[#121219]/95 border border-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_28px_rgba(0,0,0,0.35)] flex flex-col gap-3.5 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center text-muted">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted/60">
                  PHONE
                </span>
                <p className="text-sm lg:text-base font-semibold font-space text-foreground mt-1">
                  {content.phone}
                </p>
              </div>
            </div>
          )}

          {/* Module 3: Social Channels as One Cohesive Surface */}
          {socials.length > 0 && (
            <div className="p-5 lg:p-6 rounded-2xl bg-[#121219]/95 border border-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_28px_rgba(0,0,0,0.35)] flex flex-col gap-3 backdrop-blur-md">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted/60">
                SOCIAL CHANNELS
              </span>
              <div className="divide-y divide-white/[0.05] rounded-xl overflow-hidden border border-white/[0.05] bg-[#0d0d13]">
                {socials.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Visit Rushan Siddiqui on ${social.name}`}
                      className="flex items-center justify-between p-3.5 hover:bg-white/[0.02] text-muted hover:text-foreground transition-colors duration-150 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover:border-pacific-cyan/25 transition-colors">
                          <Icon className="w-3.5 h-3.5 text-pacific-cyan/85 shrink-0 group-hover:text-pacific-cyan" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-foreground/85 group-hover:text-foreground transition-colors">
                          {social.name}
                        </span>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-muted/35 group-hover:text-pacific-cyan group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ─── Desktop-Only Technical Trace Field ─── */}
      <div className="pt-2">
        <TechnicalTraceField />
      </div>
    </div>
  );
}
