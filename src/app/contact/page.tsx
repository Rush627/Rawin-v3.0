import type { Metadata } from "next";
import { getSiteContent } from "@/lib/site-content";
import ContactView from "@/components/ContactView";

export const metadata: Metadata = {
  title: "Contact & Inquiries | Rushan Siddiqui : Full Stack Developer",
  description:
    "Direct communication channel for Rushan Siddiqui : Full Stack Developer. Open to full-time engineering roles, freelance contracts, and software architecture consultancies.",
};

export const revalidate = 0;

export default async function ContactPage() {
  const content = await getSiteContent();

  // Data Safety: Server conditionally provides the phone number only if showPhoneNumber is enabled
  const contactForClient = {
    ...content.contact,
    phone: content.contact.showPhoneNumber ? content.contact.phone : "",
  };

  return <ContactView content={contactForClient} global={content.global} />;
}
