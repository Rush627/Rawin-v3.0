"use client";

import { useRef, useState } from "react";
import { getActiveSocialLinks } from "@/components/SocialIcons";
import type { ContactContent } from "@/lib/site-content";
import type { AvailabilityContent } from "@/lib/cms/availability";
import ContactStage from "@/components/contact/ContactStage";

// Verified credentials preserved from production
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mblkyvyw";

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
  availability?: AvailabilityContent;
}

export default function ContactView({ content, availability }: ContactViewProps) {
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

  // email and location are the canonical contact identity (resolved server-side)
  const emailAddress = content.email;
  const locationString = content.location;

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

  // A second submit before React re-renders (double Enter, double tap) must not send twice
  const sendingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sendingRef.current) return;

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
    sendingRef.current = true;

    try {
      // Formspree is the single delivery path (one enquiry = one message). EmailJS used to
      // send a second copy of every enquiry; it is no longer called.
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
    } finally {
      sendingRef.current = false;
    }
  };

  const socials = getActiveSocialLinks(content.socials);

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
    availability,
  };

  return <ContactStage {...sharedProps} />;
}
