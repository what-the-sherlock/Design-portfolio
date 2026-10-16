import { Footer } from "@/components/Footer";
import { About } from "@/components/home/About";
import { Cases } from "@/components/home/Cases";
import { Hero } from "@/components/home/Hero";
import { MoreProjects } from "@/components/home/MoreProjects";
import { Overlays } from "@/components/home/Overlays";
import { Services } from "@/components/home/Services";
import { PageSetup } from "@/components/PageSetup";

export default function HomePage() {
  return (
    <Overlays>
      <main className="page">
        <Hero />
        <Cases />
        <MoreProjects />
        <About />
        <Services />
      </main>
      <Footer />
      <PageSetup theme="theme-1" />
    </Overlays>
  );
}
