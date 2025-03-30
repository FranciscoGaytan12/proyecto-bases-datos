"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

// Imágenes para el carrusel - 
const carouselImages = [
  {
    url: "https://images.unsplash.com/photo-1560520031-3a4dc4e9de0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80",
    title: "Protegemos lo que más valoras",
    subtitle:
      "Ofrecemos soluciones de seguros personalizadas para ti y tu familia, con la tranquilidad y confianza que mereces.",
  },
  {
    url: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80",
    title: "Expertos en seguros desde hace 20 años",
    subtitle:
      "Nuestro equipo de profesionales te brinda la mejor asesoría para proteger tu futuro y el de tus seres queridos.",
  },
  {
    url: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80",
    title: "Soluciones a tu medida",
    subtitle: "Diseñamos planes personalizados que se adaptan a tus necesidades específicas y a tu presupuesto.",
  },
]

function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Función para cambiar a la siguiente imagen
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselImages.length)
  }

  // Función para cambiar a la imagen anterior
  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? carouselImages.length - 1 : prevIndex - 1))
  }

  // Cambio automático de imágenes
  useEffect(() => {
    let interval

    if (isAutoPlaying) {
      interval = setInterval(() => {
        nextSlide()
      }, 6000) // Cambiar cada 6 segundos
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isAutoPlaying, currentIndex])

  // Pausar la reproducción automática cuando el usuario interactúa
  const handleManualNavigation = (callback) => {
    setIsAutoPlaying(false)
    callback()

    // Reanudar la reproducción automática después de 10 segundos de inactividad
    setTimeout(() => {
      setIsAutoPlaying(true)
    }, 10000)
  }

  return (
    <section className="relative text-white overflow-hidden h-screen">
      {/* Carrusel de imágenes */}
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <img
            src={carouselImages[currentIndex].url || "/placeholder.svg"}
            alt={`Slide ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />
          {/* Overlay oscuro para mejorar legibilidad del texto */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40"></div>
        </motion.div>
      </AnimatePresence>

      {/* Patrón decorativo */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.1 }}
        transition={{ duration: 1.5 }}
      >
        <div
          className="absolute inset-0 bg-repeat opacity-10"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fillOpacity='0.2' fillRule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        ></div>
      </motion.div>

      {/* Contenido del Hero */}
      <div className="container mx-auto px-4 py-20 md:py-32 relative z-10 h-full flex items-center">
        <motion.div
          className="max-w-3xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`title-${currentIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">{carouselImages[currentIndex].title}</h1>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`subtitle-${currentIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <p className="text-lg md:text-xl mb-8 text-gray-100">{carouselImages[currentIndex].subtitle}</p>
            </motion.div>
          </AnimatePresence>

          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <motion.button
              className="bg-[#607744]  text-white px-6 py-3 rounded-md font-medium transition-colors"
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

      {/* Controles del carrusel */}
      <div className="absolute bottom-10 left-0 right-0 z-10 flex justify-center items-center gap-4">
        <div className="flex space-x-2">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => handleManualNavigation(() => setCurrentIndex(index))}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex ? "bg-amber-500 w-8" : "bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Botones de navegación */}
      <button
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
        onClick={() => handleManualNavigation(prevSlide)}
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
        onClick={() => handleManualNavigation(nextSlide)}
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Gradiente inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-amber-50 to-transparent"></div>
    </section>
  )
}

export default Hero

