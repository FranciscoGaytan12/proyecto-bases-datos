'use client'

import Image from "next/image";
import { motion, useScroll } from "framer-motion";

// Components
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import About from "@/components/About";
import Hero from "@/components/Hero";
import Benefits from "@/components/Benefits";
import CTA from "@/components/CTA";

export default function Home() {
  const { scrollYProgress } = useScroll()
  
  return (
    <div className="min-h-screen bg-amber-50">
      {/* Barra de progreso */}
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-[#656839] z-50" style={{ scaleX: scrollYProgress }} />

      <Header />
        <Hero />
        <About />
        <Benefits />
        <CTA />
      <Footer />
    </div>
  )
};
