"use client"

import { Mail, Shield, Clock, Award, Users, Heart, ChevronRight, Menu, X } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence, useScroll, useInView } from "framer-motion"
import { useRef } from "react"

export default function InsuranceLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { scrollYProgress } = useScroll()
  
  // Referencias para animaciones al hacer scroll
  const aboutRef = useRef(null)
  const benefitsRef = useRef(null)
  const ctaRef = useRef(null)
  
  const isAboutInView = useInView(aboutRef, { once: true, amount: 0.3 })
  const isBenefitsInView = useInView(benefitsRef, { once: true, amount: 0.2 })
  const isCtaInView = useInView(ctaRef, { once: true, amount: 0.5 })

  // Variantes de animación
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  }
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    },
    hover: { 
      y: -10,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.2 }
    }
  }

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Barra de progreso */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-amber-600 z-50"
        style={{ scaleX: scrollYProgress }}
      />
      
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-40 bg-white shadow-sm"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Shield className="h-8 w-8 text-amber-600" />
            <span className="ml-2 text-xl font-bold text-gray-800">SeguroTotal</span>
          </motion.div>
          
          {/* Mobile menu button */}
          <motion.button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            whileTap={{ scale: 0.95 }}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-800" />
            ) : (
              <Menu className="h-6 w-6 text-gray-800" />
            )}
          </motion.button>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              <Link href="#" className="text-gray-700 hover:text-amber-600 transition-colors">
                Inicio
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              <Link href="#about" className="text-gray-700 hover:text-amber-600 transition-colors">
                Nosotros
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              <Link href="#benefits" className="text-gray-700 hover:text-amber-600 transition-colors">
                Beneficios
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              <Link href="#contact" className="text-gray-700 hover:text-amber-600 transition-colors">
                Contacto
              </Link>
            </motion.div>
            <motion.button 
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              Cotizar Ahora
            </motion.button>
          </nav>
        </div>
        
        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              className="md:hidden bg-white border-t border-gray-100 py-4"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="container mx-auto px-4 flex flex-col space-y-4">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Link 
                    href="#" 
                    className="text-gray-700 hover:text-amber-600 transition-colors py-2 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Inicio
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link 
                    href="#about" 
                    className="text-gray-700 hover:text-amber-600 transition-colors py-2 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Nosotros
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Link 
                    href="#benefits" 
                    className="text-gray-700 hover:text-amber-600 transition-colors py-2 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Beneficios
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Link 
                    href="#contact" 
                    className="text-gray-700 hover:text-amber-600 transition-colors py-2 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Contacto
                  </Link>
                </motion.div>
                <motion.button 
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md transition-colors w-full"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cotizar Ahora
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-amber-500 to-amber-600 text-white overflow-hidden">
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.1 }}
          transition={{ duration: 1.5 }}
        >
          <div className="absolute inset-0 bg-repeat opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fillOpacity='0.2' fillRule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E\")" }}></div>
        </motion.div>
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <motion.div 
            className="max-w-3xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Protegemos lo que más valoras
            </motion.h1>
            <motion.p 
              className="text-lg md:text-xl mb-8 text-amber-50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Ofrecemos soluciones de seguros personalizadas para ti y tu familia, con la tranquilidad y confianza que mereces.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <motion.button 
                className="bg-white text-amber-600 hover:bg-amber-50 px-6 py-3 rounded-md font-medium transition-colors"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                whileTap={{ scale: 0.95 }}
              >
                Cotizar Ahora
              </motion.button>
              <motion.button 
                className="border border-white text-white hover:bg-white/10 px-6 py-3 rounded-md font-medium transition-colors"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                whileTap={{ scale: 0.95 }}
              >
                Conocer Más
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-amber-50 to-transparent"></div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-amber-50" ref={aboutRef}>
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            animate={isAboutInView ? "visible" : "hidden"}
            variants={fadeIn}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Sobre Nosotros</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Con más de 20 años de experiencia, somos líderes en el mercado de seguros, brindando protección y tranquilidad a miles de familias.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isAboutInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Image 
                src="/placeholder.svg?height=500&width=600" 
                alt="Equipo de profesionales" 
                width={600} 
                height={500}
                className="rounded-lg shadow-lg"
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
                  Brindar protección y seguridad a nuestros clientes a través de soluciones innovadoras y personalizadas, con un servicio de excelencia.
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
                    <ChevronRight className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="ml-2 text-gray-600">Integridad y transparencia en cada acción</span>
                  </motion.li>
                  <motion.li 
                    className="flex items-start"
                    variants={fadeIn}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <ChevronRight className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="ml-2 text-gray-600">Compromiso con la satisfacción del cliente</span>
                  </motion.li>
                  <motion.li 
                    className="flex items-start"
                    variants={fadeIn}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <ChevronRight className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="ml-2 text-gray-600">Innovación constante en nuestros servicios</span>
                  </motion.li>
                  <motion.li 
                    className="flex items-start"
                    variants={fadeIn}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <ChevronRight className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="ml-2 text-gray-600">Responsabilidad social y ambiental</span>
                  </motion.li>
                </ul>
              </motion.div>
              <motion.button 
                className="flex items-center text-amber-600 hover:text-amber-700 font-medium transition-colors"
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

      {/* Benefits Section */}
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
            <motion.div 
              className="bg-amber-50 rounded-lg p-8 shadow-sm"
              variants={cardVariants}
              whileHover="hover"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Shield className="h-12 w-12 text-amber-600 mb-4" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Cobertura Completa</h3>
              <p className="text-gray-600">
                Ofrecemos planes integrales que se adaptan a tus necesidades específicas, brindando protección en todo momento.
              </p>
            </motion.div>
            
            {/* Benefit Card 2 */}
            <motion.div 
              className="bg-amber-50 rounded-lg p-8 shadow-sm"
              variants={cardVariants}
              whileHover="hover"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Clock className="h-12 w-12 text-amber-600 mb-4" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Atención 24/7</h3>
              <p className="text-gray-600">
                Nuestro equipo está disponible las 24 horas, los 7 días de la semana para asistirte en cualquier emergencia.
              </p>
            </motion.div>
            
            {/* Benefit Card 3 */}
            <motion.div 
              className="bg-amber-50 rounded-lg p-8 shadow-sm"
              variants={cardVariants}
              whileHover="hover"
            >
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
            <motion.div 
              className="bg-amber-50 rounded-lg p-8 shadow-sm"
              variants={cardVariants}
              whileHover="hover"
            >
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
            <motion.div 
              className="bg-amber-50 rounded-lg p-8 shadow-sm"
              variants={cardVariants}
              whileHover="hover"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Heart className="h-12 w-12 text-amber-600 mb-4" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Planes Familiares</h3>
              <p className="text-gray-600">
                Protege a toda tu familia con nuestros planes especiales diseñados para el bienestar de tus seres queridos.
              </p>
            </motion.div>
            
            {/* Benefit Card 6 */}
            <motion.div 
              className="bg-amber-50 rounded-lg p-8 shadow-sm"
              variants={cardVariants}
              whileHover="hover"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <Mail className="h-12 w-12 text-amber-600 mb-4" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Trámites Sencillos</h3>
              <p className="text-gray-600">
                Simplificamos todos los procesos para que puedas gestionar tu seguro de manera rápida y sin complicaciones.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-amber-600 text-white" ref={ctaRef}>
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            animate={isCtaInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            <motion.h2 
              className="text-3xl md:text-4xl font-bold mb-6"
              variants={fadeIn}
            >
              ¿Listo para proteger lo que más valoras?
            </motion.h2>
            <motion.p 
              className="text-xl mb-8 max-w-2xl mx-auto"
              variants={fadeIn}
            >
              Obtén una cotización personalizada en minutos y comienza a disfrutar de la tranquilidad que mereces.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={fadeIn}
            >
              <motion.button 
                className="bg-white text-amber-600 hover:bg-amber-50 px-8 py-3 rounded-md font-medium transition-colors"
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

      {/* Footer */}
      <footer id="contact" className="bg-gray-800 text-white pt-16 pb-8">
        <div className="container mx-auto px-4">
          <motion.div 
            className="grid md:grid-cols-4 gap-8 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div>
              <motion.div 
                className="flex items-center mb-4"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Shield className="h-8 w-8 text-amber-500" />
                <span className="ml-2 text-xl font-bold">SeguroTotal</span>
              </motion.div>
              <p className="text-gray-400 mb-4">
                Brindando protección y tranquilidad a familias y empresas desde hace más de 20 años.
              </p>
              <div className="flex space-x-4">
                <motion.a 
                  href="#" 
                  className="text-gray-400 hover:text-amber-500 transition-colors"
                  whileHover={{ y: -5, color: "#F59E0B" }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </motion.a>
                <motion.a 
                  href="#" 
                  className="text-gray-400 hover:text-amber-500 transition-colors"
                  whileHover={{ y: -5, color: "#F59E0B" }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 \

