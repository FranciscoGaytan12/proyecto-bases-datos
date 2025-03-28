"use client"

import { Shield, Clock, Award, Users, Heart, Mail } from "lucide-react"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"

function Benefits() {
  const benefitsRef = useRef(null)
  const isBenefitsInView = useInView(benefitsRef, { once: true, amount: 0.2 })

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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
    hover: {
      y: -10,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.2 },
    },
  }

  return (
    <section id="benefits" className="py-20 bg-white" ref={benefitsRef}>
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          animate={isBenefitsInView ? "visible" : "hidden"}
          variants={fadeIn}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Nuestros Beneficios</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Descubre por qué miles de clientes confían en nosotros para proteger lo que más valoran.
          </p>
        </motion.div>

        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="hidden"
          animate={isBenefitsInView ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          {/* Benefit Card 1 */}
          <motion.div className="bg-amber-50 rounded-lg p-8 shadow-sm" variants={cardVariants} whileHover="hover">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Shield className="h-12 w-12 text-amber-600 mb-4" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Cobertura Completa</h3>
            <p className="text-gray-600">
              Ofrecemos planes integrales que se adaptan a tus necesidades específicas, brindando protección en todo
              momento.
            </p>
          </motion.div>

          {/* Benefit Card 2 */}
          <motion.div className="bg-amber-50 rounded-lg p-8 shadow-sm" variants={cardVariants} whileHover="hover">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Clock className="h-12 w-12 text-amber-600 mb-4" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Atención 24/7</h3>
            <p className="text-gray-600">
              Nuestro equipo está disponible las 24 horas, los 7 días de la semana para asistirte en cualquier
              emergencia.
            </p>
          </motion.div>

          {/* Benefit Card 3 */}
          <motion.div className="bg-amber-50 rounded-lg p-8 shadow-sm" variants={cardVariants} whileHover="hover">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Award className="h-12 w-12 text-amber-600 mb-4" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Servicio Premium</h3>
            <p className="text-gray-600">
              Experiencia de cliente excepcional con procesos simplificados y atención personalizada.
            </p>
          </motion.div>

          {/* Benefit Card 4 */}
          <motion.div className="bg-amber-50 rounded-lg p-8 shadow-sm" variants={cardVariants} whileHover="hover">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Users className="h-12 w-12 text-amber-600 mb-4" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Asesores Expertos</h3>
            <p className="text-gray-600">
              Contamos con un equipo de profesionales altamente capacitados para brindarte la mejor asesoría.
            </p>
          </motion.div>

          {/* Benefit Card 5 */}
          <motion.div className="bg-amber-50 rounded-lg p-8 shadow-sm" variants={cardVariants} whileHover="hover">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Heart className="h-12 w-12 text-amber-600 mb-4" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Planes Familiares</h3>
            <p className="text-gray-600">
              Protege a toda tu familia con nuestros planes especiales diseñados para el bienestar de tus seres
              queridos.
            </p>
          </motion.div>

          {/* Benefit Card 6 */}
          <motion.div className="bg-amber-50 rounded-lg p-8 shadow-sm" variants={cardVariants} whileHover="hover">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <Mail className="h-12 w-12 text-amber-600 mb-4" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Trámites Sencillos</h3>
            <p className="text-gray-600">
              Simplificamos todos los procesos para que puedas gestionar tu seguro de manera rápida y sin
              complicaciones.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default Benefits

