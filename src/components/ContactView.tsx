"use client";

import { useState } from "react";
import emailjs from "@emailjs/browser";
import { GithubIcon, LinkedinIcon, TwitterIcon } from "@/components/SocialIcons";
import type { ContactContent, GlobalContent } from "@/lib/site-content";
import DesktopContactView from "@/components/DesktopContactView";
import MobileContactView from "@/components/MobileContactView";

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

  const handleResetStatus = () => {
    setStatus("idle");
    setErrorMessage("");
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

  const sharedProps = {
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
    global,
  };

  return (
    <div className="relative w-full min-h-screen min-h-dvh">
      {/* Top ambient backdrop for smooth floating navbar pass-through */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 inset-x-0 h-32 bg-gradient-to-b from-ink-black via-ink-black/90 to-transparent z-30"
      />

      {/* Desktop Presentation (>= 1024px) */}
      <div className="hidden lg:block">
        <DesktopContactView {...sharedProps} />
      </div>

      {/* Smartphone & Tablet Presentation (< 1024px) */}
      <div className="block lg:hidden">
        <MobileContactView {...sharedProps} />
      </div>
    </div>
  );
}
