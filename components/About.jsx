"use client"

import { ChevronRight } from "lucide-react"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"

function About() {
  const aboutRef = useRef(null)
  const isAboutInView = useInView(aboutRef, { once: true, amount: 0.3 })

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
    <section id="about" className="py-20 bg-[#CBC9AD]" ref={aboutRef}>
        <div className="container mx-auto px-4">
            <motion.div
                className="text-center mb-16"
                initial="hidden"
                animate={isAboutInView ? "visible" : "hidden"}
                variants={fadeIn}
            >
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Sobre Nosotros</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Con más de 20 años de experiencia, somos líderes en el mercado de seguros, brindando protección y
                    tranquilidad a miles de familias.
                </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={isAboutInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <img
                        src="/images/ola2.png/300x300"
                        alt="Equipo de profesionales"
                        className="rounded-lg shadow-lg w-full h-auto"
                    />
                </motion.div>
                <motion.div
                    className="space-y-6"
                    initial="hidden"
                    animate={isAboutInView ? "visible" : "hidden"}
                    variants={staggerContainer}
                >
                    <motion.div variants={fadeIn}>
                        <h3 className="text-2xl font-semibold text-gray-800 mb-2">Nuestra Misión</h3>
                        <p className="text-gray-600">
                            Brindar protección y seguridad a nuestros clientes a través de soluciones innovadoras y personalizadas,
                            con un servicio de excelencia.
                        </p>
                    </motion.div>
                    <motion.div variants={fadeIn}>
                        <h3 className="text-2xl font-semibold text-gray-800 mb-2">Nuestros Valores</h3>
                        <ul className="space-y-3">
                            <motion.li
                                className="flex items-start"
                                variants={fadeIn}
                                whileHover={{ x: 5 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                <ChevronRight className="h-5 w-5 text-[#656839] mt-0.5 flex-shrink-0" />
                                <span className="ml-2 text-gray-600">Integridad y transparencia en cada acción</span>
                            </motion.li>
                            <motion.li
                                className="flex items-start"
                                variants={fadeIn}
                                whileHover={{ x: 5 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                <ChevronRight className="h-5 w-5 text-[#656839] mt-0.5 flex-shrink-0" />
                                <span className="ml-2 text-gray-600">Compromiso con la satisfacción del cliente</span>
                            </motion.li>
                            <motion.li
                                className="flex items-start"
                                variants={fadeIn}
                                whileHover={{ x: 5 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                <ChevronRight className="h-5 w-5 text-[#656839] mt-0.5 flex-shrink-0" />
                                <span className="ml-2 text-gray-600">Innovación constante en nuestros servicios</span>
                            </motion.li>
                            <motion.li
                                className="flex items-start"
                                variants={fadeIn}
                                whileHover={{ x: 5 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                <ChevronRight className="h-5 w-5 text-[#656839] mt-0.5 flex-shrink-0" />
                                <span className="ml-2 text-gray-600">Responsabilidad social y ambiental</span>
                            </motion.li>
                        </ul>
                    </motion.div>
                    <motion.button
                        className="flex items-center text-[#656839] hover:text-[#656839] font-medium transition-colors"
                        variants={fadeIn}
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                        <span>Conoce más sobre nuestra historia</span>
                        <ChevronRight className="h-5 w-5 ml-1" />
                    </motion.button>
                </motion.div>
            </div>
        </div>
    </section>
)
}

export default About

