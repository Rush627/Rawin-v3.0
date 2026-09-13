"use client";

import { useState } from "react";
import emailjs from "@emailjs/browser";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { GithubIcon, LinkedinIcon, TwitterIcon } from "@/components/SocialIcons";
import type { ContactContent, GlobalContent } from "@/lib/site-content";

// Verified credentials preserved from production
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mblkyvyw";
const EMAILJS_PUBLIC_KEY = "7OVQm6WrduZGlvd6i";
const EMAILJS_SERVICE_ID = "service_46acsfl";
const EMAILJS_TEMPLATE_ID = "template_x0tcmrn";

interface FormDataState {
  user_name: string;
  user_email: string;
  mobile_number: string;
  subject: string;
  message: string;
  _gotcha: string; // Honeypot spam trap
}

interface ContactViewProps {
  content: ContactContent;
  global?: GlobalContent;
}

export default function ContactView({ content, global }: ContactViewProps) {
  const [formData, setFormData] = useState<FormDataState>({
    user_name: "",
    user_email: "",
    mobile_number: "",
    subject: "",
    message: "",
    _gotcha: "",
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const emailAddress = content.email || global?.contactEmail || "rushansiddiqui5262@gmail.com";
  const locationString = content.location || global?.location || "Jaunpur, Uttar Pradesh, India";

  // Dynamic CMS form placeholders with fallback defaults
  const placeholders = {
    name: content.form?.namePlaceholder || "Jane Doe",
    email: content.form?.emailPlaceholder || "jane@example.com",
    phone: content.form?.phonePlaceholder || "+1 555 0192",
    subject: content.form?.subjectPlaceholder || "Project Inquiry / Job Opportunity",
    message: content.form?.messagePlaceholder || "Describe your goals, project timeline, or questions...",
  };

  // Gmail compose URL for desktop web
  const desktopGmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailAddress)}`;

  const handleEmailCardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Release focus so when returning from Gmail, mouse click doesn't leave the element focused
    (e.currentTarget as HTMLElement)?.blur();

    const isMobile =
      typeof window !== "undefined" &&
      (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768);

    if (isMobile) {
      e.preventDefault();
      const encodedEmail = encodeURIComponent(emailAddress);
      const gmailAppUrl = `googlegmail:///co?to=${encodedEmail}`;
      const mailtoUrl = `mailto:${encodedEmail}`;

      const start = Date.now();
      window.location.href = gmailAppUrl;
      setTimeout(() => {
        if (Date.now() - start < 1500) {
          window.location.href = mailtoUrl;
        }
      }, 500);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot spam trap
    if (formData._gotcha) {
      setStatus("success");
      return;
    }

    if (!formData.user_name || !formData.user_email || !formData.message) {
      setStatus("error");
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      // 1. Submit to Formspree endpoint
      const formspreePayload = new FormData();
      formspreePayload.append("user_name", formData.user_name);
      formspreePayload.append("user_email", formData.user_email);
      formspreePayload.append("mobile_number", formData.mobile_number || "N/A");
      formspreePayload.append("subject", formData.subject || "RAWIN 3.0 Portfolio Inquiry");
      formspreePayload.append("message", formData.message);

      const formspreeRes = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: formspreePayload,
        headers: { Accept: "application/json" },
      });

      // 2. Dispatch EmailJS as redundancy backup
      try {
        emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          user_name: formData.user_name,
          user_email: formData.user_email,
          subject: formData.subject || "RAWIN 3.0 Portfolio Inquiry",
          message: formData.message,
        });
      } catch (emailjsError) {
        console.warn("EmailJS secondary dispatch notice:", emailjsError);
      }

      if (formspreeRes.ok) {
        setStatus("success");
        setFormData({
          user_name: "",
          user_email: "",
          mobile_number: "",
          subject: "",
          message: "",
          _gotcha: "",
        });
      } else {
        setStatus("error");
        setErrorMessage("Submission failed. Please try again or reach out directly via email.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please check your connection or email directly.");
    }
  };

  const socials = [
    {
      id: "github",
      name: "GitHub",
      url: content.socials?.github || "",
      icon: GithubIcon,
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      url: content.socials?.linkedin || "",
      icon: LinkedinIcon,
    },
    {
      id: "twitter",
      name: "X / Twitter",
      url: content.socials?.twitter || "",
      icon: TwitterIcon,
    },
  ].filter((s) => s.url.trim().length > 0);

  return (
    <div className="w-full max-w-6xl mx-auto pt-28 sm:pt-32 pb-20 px-4 sm:px-6 flex flex-col gap-8 sm:gap-10 overflow-x-hidden">
      {/* Header */}
      <section className="flex flex-col gap-3 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium glass-pill text-pacific-cyan w-fit border border-pacific-cyan/20">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{content.eyebrow || "Get in Touch"}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground font-space">
          {content.title || "Start a Conversation"}
        </h1>
        <p className="text-sm sm:text-base text-muted max-w-xl leading-relaxed">
          {content.description ||
            "Have an open role, a freelance inquiry, or an ambitious project idea? Send a message and I will reply within 24 hours."}
        </p>
      </section>

      {/* Two Column Layout on Desktop, Clean Vertical Stack on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start lg:items-stretch">
        {/* LEFT COLUMN: Dominant Form */}
        <div className="lg:col-span-7 flex flex-col">
          {/* Interactive Form Card */}
          <div className="glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-9 border border-white/[0.08] shadow-xl relative overflow-hidden flex-1 flex flex-col">
            {status === "success" ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-foreground font-space mt-1">
                  {content.successTitle || "Message Sent Successfully"}
                </h2>
                <p className="text-muted text-sm max-w-md leading-relaxed">
                  {content.successMessage ||
                    "Thank you for reaching out! Your message has been sent. I will review it and get back to you shortly."}
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-sm hover:bg-pacific-cyan/90 transition-all cursor-pointer shadow-md hover:shadow-[0_0_20px_rgba(24,155,173,0.35)]"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between gap-5 sm:gap-6">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  {/* Full Name */}
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
                      className="w-full h-12 px-4 rounded-xl bg-ink-black/60 border border-white/10 text-foreground text-base sm:text-sm placeholder:text-muted/40 focus:outline-none focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan transition-colors"
                    />
                  </div>

                  {/* Email Address */}
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
                      className="w-full h-12 px-4 rounded-xl bg-ink-black/60 border border-white/10 text-foreground text-base sm:text-sm placeholder:text-muted/40 focus:outline-none focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  {/* Mobile Number */}
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
                      className="w-full h-12 px-4 rounded-xl bg-ink-black/60 border border-white/10 text-foreground text-base sm:text-sm placeholder:text-muted/40 focus:outline-none focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan transition-colors"
                    />
                  </div>

                  {/* Subject */}
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
                      className="w-full h-12 px-4 rounded-xl bg-ink-black/60 border border-white/10 text-foreground text-base sm:text-sm placeholder:text-muted/40 focus:outline-none focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan transition-colors"
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="flex flex-col gap-1.5 flex-1">
                  <label htmlFor="message" className="text-xs font-mono text-muted/90">
                    Your Message <span className="text-pacific-cyan">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    placeholder={placeholders.message}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full p-4 rounded-xl bg-ink-black/60 border border-white/10 text-foreground text-base sm:text-sm placeholder:text-muted/40 focus:outline-none focus:border-pacific-cyan focus:ring-1 focus:ring-pacific-cyan transition-colors resize-y min-h-[130px] lg:flex-1 leading-relaxed"
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="flex items-center justify-center gap-2 w-full sm:w-fit px-8 py-3.5 rounded-xl bg-pacific-cyan text-ink-black font-semibold text-sm hover:bg-pacific-cyan/90 transition-all shadow-[0_0_25px_rgba(24,155,173,0.35)] hover:shadow-[0_0_35px_rgba(24,155,173,0.5)] transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer min-h-[46px]"
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
              </form>
            )}
            </div>
        </div>

        {/* RIGHT COLUMN: Supporting Contact Cards */}
        <aside className="lg:col-span-5 flex flex-col gap-5">
          {/* Direct Email Card (Clickable, Opens Gmail) */}
          <a
            href={desktopGmailUrl}
            onClick={handleEmailCardClick}
            onPointerUp={(e) => (e.currentTarget as HTMLElement)?.blur()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Send direct email to ${emailAddress}`}
            className="group glass-card rounded-2xl p-5 sm:p-6 border border-white/[0.08] flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.008] hover:border-pacific-cyan/40 hover:shadow-[0_10px_30px_rgba(24,155,173,0.15)] cursor-pointer relative overflow-hidden outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-pacific-cyan focus-visible:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-pacific-cyan/10 border border-pacific-cyan/25 flex items-center justify-center text-pacific-cyan group-hover:bg-pacific-cyan group-hover:text-ink-black transition-all">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted/60">
                Direct Email
              </span>
              <p className="text-sm sm:text-base font-semibold text-foreground mt-0.5 break-all group-hover:text-pacific-cyan transition-colors">
                {emailAddress}
              </p>
              <p className="text-xs text-muted/70 mt-1">
                Click to open a prefilled email
              </p>
            </div>
          </a>

          {/* Location Card - EXCLUSION A: Preserved with deliberate green glow, NO BorderGlow */}
          <div className="glass-card rounded-2xl p-5 sm:p-6 border border-white/[0.08] flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted/60">
                Location
              </span>
              <p className="text-sm sm:text-base font-semibold text-foreground mt-0.5">
                {locationString}
              </p>
              <p className="text-xs text-muted/70 mt-1">
                Available for remote collaborations worldwide
              </p>
            </div>
          </div>

          {/* Social Channels Card (renders only configured channels) */}
          {socials.length > 0 && (
            <div className="glass-card rounded-2xl p-5 sm:p-6 border border-white/[0.08] flex flex-col gap-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted/60">
                Social Channels
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
                      <ExternalLink className="w-3.5 h-3.5 text-muted/40 group-hover:text-pacific-cyan transition-colors" />
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
