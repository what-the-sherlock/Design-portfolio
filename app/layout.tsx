import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Fragment_Mono, Instrument_Serif, Inter } from "next/font/google";
import { FaviconAnimator } from "@/components/FaviconAnimator";
import { FloatingScrollbar } from "@/components/FloatingScrollbar";
import { Loader } from "@/components/Loader";
import { Navbar } from "@/components/Navbar";
import { Providers } from "@/components/Providers";
import { site } from "@/content/site";
import { headScript } from "@/lib/intro";
import "@/styles/base.css";
import "@/styles/chrome.css";
import "@/styles/home.css";
import "@/styles/footer-contact.css";

const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument-serif", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = Fragment_Mono({ subsets: ["latin"], weight: "400", variable: "--font-fragment-mono", display: "swap" });

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: site.title,
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.title,
    description: site.description,
    images: [{ url: "/media/metal-labs/cover-1600.webp", width: 1600, height: 1066 }],
  },
  twitter: { card: "summary_large_image", title: site.title, description: site.description },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  jobTitle: "Landing Page Designer, Developer & Motion Designer",
  description: site.description,
  email: `mailto:${site.email}`,
  url: siteUrl,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="theme-1" className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: headScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body id="top">
        <Providers>
          <Loader />
          <Navbar />
          {children}
          <FloatingScrollbar />
          <FaviconAnimator />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
