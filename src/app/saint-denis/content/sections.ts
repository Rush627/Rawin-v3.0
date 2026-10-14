/** Site Content editors, grouped by the public destination they control. */
export const CONTENT_SECTIONS = [
  { slug: "identity", title: "Identity", description: "Brand name, site title, short bio and the header brand.", view: "/" },
  { slug: "seo", title: "SEO", description: "Search titles and descriptions for each page.", view: "/" },
  { slug: "home", title: "Home", description: "Hero, rotating roles, toolkit and values.", view: "/" },
  { slug: "about", title: "About", description: "Story, evolution milestones, principles and the engineering journey.", view: "/about" },
  { slug: "uses", title: "Uses", description: "Daily tools, development stack, process and setup.", view: "/uses" },
  { slug: "resume", title: "Resume", description: "Summary, skills, experience, education and the PDF.", view: "/resume" },
  { slug: "contact", title: "Contact & Social", description: "Email, location, phone and social links used site-wide.", view: "/contact" },
  { slug: "footer", title: "Footer & Closing", description: "The closing invitation, copyright and ticker.", view: "/projects" },
  { slug: "orbit", title: "RAWIN Orbit", description: "Greetings, welcome messages, composer and capabilities.", view: "/ai" },
] as const;

export type ContentSlug = (typeof CONTENT_SECTIONS)[number]["slug"];
