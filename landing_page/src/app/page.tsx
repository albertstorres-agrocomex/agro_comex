import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import EquipeSection from "@/components/EquipeSection";
import DesafioSection from "@/components/DesafioSection";
import ProjetoSection from "@/components/ProjetoSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <EquipeSection />
        <DesafioSection />
        <ProjetoSection />
      </main>
      <Footer />
    </>
  );
}