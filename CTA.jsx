"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

function CTA() {
  const ctaRef = useRef(null)
  const isCtaInView = useInView(ctaRef, { once: true, amount: 0.5 })

  // Variantes de animación
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <section className="py-16 bg-[#345995] text-white" ref={ctaRef}>
      <div className="container mx-auto px-4 text-center">
        <motion.div initial="hidden" animate={isCtaInView ? "visible" : "hidden"} variants={staggerContainer}>
          <motion.h2 className="text-3xl md:text-4xl font-bold mb-6" variants={fadeIn}>
            ¿Listo para proteger lo que más valoras?
          </motion.h2>
          <motion.p className="text-xl mb-8 max-w-2xl mx-auto" variants={fadeIn}>
            Obtén una cotización personalizada en minutos y comienza a disfrutar de la tranquilidad que mereces.
          </motion.p>
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" variants={fadeIn}>
            <motion.button
              className="bg-white text-blue-400 hover:bg-amber-50 px-8 py-3 rounded-md font-medium transition-colors"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              whileTap={{ scale: 0.95 }}
            >
              Cotizar Ahora
            </motion.button>
            <motion.button
              className="border border-white text-white hover:bg-white/10 px-8 py-3 rounded-md font-medium transition-colors"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              whileTap={{ scale: 0.95 }}
            >
              Hablar con un Asesor
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default CTA

