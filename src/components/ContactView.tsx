"use client";

import { useRef, useState } from "react";
import { getActiveSocialLinks } from "@/components/SocialIcons";
import type { ContactContent } from "@/lib/site-content";
import type { AvailabilityContent } from "@/lib/cms/availability";
import ContactStage from "@/components/contact/ContactStage";
import { submitEnquiry, type EnquiryForm } from "@/lib/contact/submit";

// _gotcha is the honeypot spam trap
type FormDataState = EnquiryForm;

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
  // shown with the success state when the visitor's confirmation email could not be sent
  const [notice, setNotice] = useState<string>("");

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
    setNotice("");
  };

  // A second submit before React re-renders (double Enter, double tap) must not send twice
  const sendingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sendingRef.current) return;

    setStatus("loading");
    setErrorMessage("");
    setNotice("");
    sendingRef.current = true;

    try {
      // Formspree takes the enquiry, then EmailJS sends the visitor's confirmation (lib/contact/submit.ts)
      const result = await submitEnquiry(formData, {
        postForm: async (endpoint, body) => {
          const res = await fetch(endpoint, { method: "POST", body, headers: { Accept: "application/json" } });
          return { ok: res.ok, status: res.status };
        },
        sendEmail: async (serviceId, templateId, params, publicKey) => {
          const { default: emailjs } = await import("@emailjs/browser");
          return emailjs.send(serviceId, templateId, params, { publicKey });
        },
        warn: (message) => console.warn(message),
      });

      if (result.status === "success") {
        setStatus("success");
        setNotice(result.notice);
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
        setErrorMessage(result.message);
      }
    } finally {
      sendingRef.current = false;
    }
  };

  const socials = getActiveSocialLinks(content.socials);

  const sharedProps = {
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
  };

  return <ContactStage {...sharedProps} />;
}
