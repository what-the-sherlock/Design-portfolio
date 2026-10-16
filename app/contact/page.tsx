import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { ContactHero } from "@/components/contact/ContactHero";
import { Footer } from "@/components/Footer";
import { PageSetup } from "@/components/PageSetup";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: `Contact — ${site.name}`,
  description: "Have an upcoming landing page, website or motion project? Share the details and I'll get back to you within 24 hours.",
};

export default function ContactPage() {
  return (
    <>
      <main className="page">
        <ContactHero />
        <ContactForm />
      </main>
      <Footer showTop={false} showCta={false} />
      <PageSetup theme="theme-2" />
    </>
  );
}
