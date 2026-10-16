// All editable copy and project data for the portfolio lives here.
// A "styled" string uses *asterisks* to mark italic (Instrument Serif italic) fragments,
// mirroring the original design's selectively italicised words.

import media from "./media.generated.json";

export type MediaInfo = {
  lqip: string;
  cover: { width: number; height: number };
  /** Full-page capture sliced into tiles (heights at 1200px wide). */
  full?: { width: number; height: number; tiles: number[] };
};

export type Project = {
  slug: string;
  title: string;
  kind: "web" | "film";
  tags: string[];
  /** One-line summary shown in the project viewer. */
  summary: string;
  /** Public URL of the live site, if any. */
  live?: string;
  /** CSS object-position for the cover when it's cropped (default "center top"). */
  focus?: string;
  media: MediaInfo;
};

const m = media as Record<string, MediaInfo>;

export const site = {
  name: "Aashutosh Mali",
  /** Hero / footer wordmark, split into words; *x* = italic. */
  nameWords: ["A*a*sh*uto*sh", "M*al*i"],
  email: "nusta.aashu@gmail.com",
  title: "Aashutosh Mali — Landing Page Designer, Developer & Motion Designer",
  description:
    "Independent designer and developer crafting high-converting landing pages, marketing sites and product films for AI and SaaS teams.",
  heroBio: "Independent designer and developer specialised in landing pages & motion",
  role: ["Web &", "Motion"],
  about:
    "Most landing pages get three seconds. I make those three seconds count. I design, build and animate pages people actually scroll, and product films people actually finish. One person, no handoffs, nothing lost in translation. Lately: AI voice agents, mortgage tech and a social media team in a box.",
  footer: {
    headline: ["Let's work", "*together*"],
    info: "Available for select landing page, website and motion projects. Open to ongoing retainers with agencies and product teams.",
    availability: "Open to new projects",
    /** Closing call to action revealed as the footer name fills in. */
    cta: { label: "Got a project? Let's talk", note: "Replies within 24 hours" },
  },
  /** Socials shown in the hero tiles and footer. Leave a value empty to hide it. */
  socials: {
    linkedin: "",
    instagram: "",
  },
};

export const services = {
  first: {
    tag: "Web",
    /** Rendered as: line1 / line2a [flying box] line2b / line3 */
    line1: "Landing pages built",
    line2a: "to",
    line2b: "*convert* and",
    line3: "*captivate* visitors.",
    ariaLabel: "Landing pages built to convert and captivate visitors.",
    gridTitle: "Web",
    items: ["Landing pages", "Conversion design", "Next.js", "Marketing sites", "GSAP & Motion", "Responsive builds", "SEO & speed"],
  },
  second: {
    tag: "Motion",
    line1: "Brought to life with",
    line2a: "*crisp* and",
    line2b: "*cinematic*",
    line3: "product films.",
    ariaLabel: "Brought to life with crisp and cinematic product films.",
    gridTitle: "Motion",
    items: ["Product films", "Brand films", "Launch videos", "UI animation", "Remotion", "Explainers", "Social cuts"],
  },
};

export const featured: Project[] = [
  {
    slug: "metal-labs",
    title: "Metal Labs",
    kind: "web",
    tags: ["Design", "Development", "Next.js"],
    summary: "Marketing site for an AI agent platform that calls, qualifies and follows up with every mortgage lead.",
    focus: "left top",
    media: m["metal-labs"],
  },
  {
    slug: "litlabs",
    title: "Lit Labs",
    kind: "web",
    tags: ["Design", "Development", "Next.js"],
    summary: "Agency site for an AI implementation studio that builds systems that work like employees.",
    live: "https://www.litlabs.io",
    media: m["litlabs"],
  },
  {
    slug: "plume",
    title: "Plume",
    kind: "web",
    tags: ["Design", "Development", "Next.js"],
    summary: "Landing page for a done-for-you social media service, from $69 a month.",
    live: "https://plume-neon-alpha.vercel.app/",
    media: m["plume"],
  },
  {
    slug: "robyn",
    title: "Robyn AI",
    kind: "web",
    tags: ["Design", "Development", "Next.js"],
    summary: "Landing page and industry pages for an AI receptionist that answers every call, 24/7.",
    live: "https://www.robynai.co.uk",
    media: m["robyn"],
  },
  {
    slug: "wenup-film",
    title: "Wenup Film",
    kind: "film",
    tags: ["Motion", "Brand film", "40s"],
    summary: "A 40-second brand film for amicable prenups — typography-led, warm and very clear on price.",
    media: m["wenup-film"],
  },
  {
    slug: "venturecite-film",
    title: "VentureCite Film",
    kind: "film",
    tags: ["Motion", "Launch film", "90s"],
    summary: "A 90-second launch film showing how brands get recommended by AI engines.",
    media: m["venturecite-film"],
  },
];

export const moreProjects: Project[] = [
  {
    slug: "chapeau",
    title: "Chapeau",
    kind: "web",
    tags: ["Design", "Development", "Next.js"],
    summary: "A loud, kinetic site for a growth collective — marketing, AI and strategy under one hat.",
    media: m["chapeau"],
  },
  {
    slug: "plume-film",
    title: "Plume Film",
    kind: "film",
    tags: ["Motion", "Product film", "40s"],
    summary: "A 40-second product film: from 11pm content panic to “your social, handled.”",
    media: m["plume-film"],
  },
  {
    slug: "dros",
    title: "DROS",
    kind: "web",
    tags: ["Development", "Next.js"],
    summary: "Marketing site for an AI engagement OS that helps US debt collectors recover revenue, compliantly.",
    live: "https://www.dros.ai",
    media: m["dros"],
  },
  {
    slug: "roswell",
    title: "Roswell IT",
    kind: "web",
    tags: ["Development", "Next.js"],
    summary: "Managed IT services site for a Scottish provider with nearly 30 years of history.",
    live: "https://www.roswellit.com",
    media: m["roswell"],
  },
  {
    slug: "venturecite",
    title: "VentureCite",
    kind: "web",
    tags: ["Design", "Development", "React"],
    summary: "Marketing site for a platform that measures and improves how AI engines recommend your brand.",
    live: "https://www.venturecite.com",
    media: m["venturecite"],
  },
];

export const contact = {
  heroWord: "C*on*tact",
  subtitle: "Have an upcoming project? Share the details below, or feel free to",
  steps: {
    service: {
      title: "How can I help you?",
      options: [
        { value: "Landing Page", icon: "frame" },
        { value: "Website", icon: "asterisk" },
        { value: "Motion Video", icon: "play" },
      ],
    },
    details: { title: "Tell me about the project" },
  },
  success: {
    title: "Thank you!",
    body: "Your inquiry has been sent successfully. I'll review your details and get back to you within 24 hours.",
  },
};

export const allProjects = [...featured, ...moreProjects];
