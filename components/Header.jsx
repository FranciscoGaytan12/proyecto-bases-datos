"use client"

import { Shield, Menu, X } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
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
          <Shield className="h-8 w-8 text-[#656839]" />
          <span className="ml-2 text-xl font-bold text-gray-800">B&S</span>
        </motion.div>

        {/* Mobile menu button */}
        <motion.button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} whileTap={{ scale: 0.95 }}>
          {isMenuOpen ? <X className="h-6 w-6 text-gray-800" /> : <Menu className="h-6 w-6 text-gray-800" />}
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
            <Link href="#benefits" className="text-gray-700 hover:text-green transition-colors">
              Beneficios
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
            <Link href="#contact" className="text-gray-700 hover:text-amber-600 transition-colors">
              Contacto
            </Link>
          </motion.div>
          <motion.button
            className="bg-[#656839]  text-white px-4 py-2 rounded-md transition-colors"
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
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                <Link
                  href="#"
                  className="text-gray-700 hover:text-amber-600 transition-colors py-2 block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Inicio
                </Link>
              </motion.div>
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <Link
                  href="#about"
                  className="text-gray-700 hover:text-amber-600 transition-colors py-2 block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Nosotros
                </Link>
              </motion.div>
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                <Link
                  href="#benefits"
                  className="text-gray-700 hover:text-amber-600 transition-colors py-2 block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Beneficios
                </Link>
              </motion.div>
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                <Link
                  href="#contact"
                  className="text-gray-700 hover:text-amber-600 transition-colors py-2 block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contacto
                </Link>
              </motion.div>
              <motion.button
                className="bg-amber-500 hover:bg-amber-700 text-white px-4 py-2 rounded-md transition-colors w-full"
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
  )
}

export default Header

