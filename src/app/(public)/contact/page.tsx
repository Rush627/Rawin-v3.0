import { getSiteContent } from "@/lib/site-content";
import ContactView from "@/components/ContactView";
import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata("contact", "/contact");
}

export const revalidate = 3600;

export default async function ContactPage() {
  const content = await getSiteContent();

  // Data Safety: Server conditionally provides the phone number only if showPhoneNumber is enabled
  const contactForClient = {
    ...content.contact,
    phone: content.contact.showPhoneNumber ? content.contact.phone : "",
  };

  return <ContactView content={contactForClient} availability={content.availability} />;
}
