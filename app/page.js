import Image from "next/image";

// Components
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import About from "@/components/About";
import Hero from "@/components/Hero";
import Benefits from "@/components/Benefits";

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <About />
      <Benefits />
      <Footer />
    </>
  );
}
