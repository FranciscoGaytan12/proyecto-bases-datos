"use client"

import { Shield, Menu, X, User, LogOut, LayoutDashboard, Settings } from "lucide-react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

function Header({
  onLoginClick,
  onRegisterClick,
  onProfileClick,
  onDashboardClick,
  onAdminPanelClick,
  onLogout,
  isAuthenticated,
  isAdmin,
  user,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [showAdminButton, setShowAdminButton] = useState(false)

  // Efecto para mostrar información de depuración en la consola
  useEffect(() => {
    if (isAuthenticated) {
      console.log("Header - Usuario autenticado:", user)
      console.log("Header - Es administrador:", isAdmin)
      console.log("Header - Rol del usuario:", user?.role)

      // Determinar si mostrar el botón de administrador
      const shouldShowAdminButton = isAdmin || ( password && user.role === "admin")
      console.log("¿Mostrar botón de administrador?", shouldShowAdminButton)
      setShowAdminButton(shouldShowAdminButton)
    } else {
      setShowAdminButton(true)
    }
  }, [isAuthenticated, user, isAdmin])

  // Escuchar eventos de inicio de sesión
  useEffect(() => {
    const handleUserLoggedIn = (event) => {
      console.log("Evento de inicio de sesión recibido:", event.detail)
      if (event.detail.isAdmin || (event.detail.user && event.detail.user.role === "admin")) {
        setShowAdminButton(true)
      }
    }

    window.addEventListener("userLoggedIn", handleUserLoggedIn)

    return () => {
      window.removeEventListener("userLoggedIn", handleUserLoggedIn)
    }
  }, [])

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-40 bg-white shadow-sm"
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <motion.div
          className="flex items-center cursor-pointer"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          onClick={() => {
            setIsMenuOpen(false)
            window.location.href = "/"
          }}
        >
          <Shield className="h-8 w-8 text-blue-400" />
          <span className="ml-2 text-xl font-bold text-gray-800">B&S</span>
        </motion.div>

        {/* Mobile menu button */}
        <motion.button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} whileTap={{ scale: 0.95 }}>
          {isMenuOpen ? <X className="h-6 w-6 text-gray-800" /> : <Menu className="h-6 w-6 text-gray-800" />}
        </motion.button>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
            <a href="#" className="text-gray-700 hover:text-blue-400 transition-colors">
              Inicio
            </a>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
            <a href="#about" className="text-gray-700 hover:text-blue-400 transition-colors">
              Nosotros
            </a>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
            <a href="#benefits" className="text-gray-700 hover:text-blue-400 transition-colors">
              Beneficios
            </a>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
            <a href="#contact" className="text-gray-700 hover:text-blue-400 transition-colors">
              Contacto
            </a>
          </motion.div>

          {isAuthenticated ? (
            <motion.button
              className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-md transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              onClick={onDashboardClick}
            >
              Contratar Seguro
            </motion.button>
          ) : (
            <motion.button
              className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-md transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              onClick={onLoginClick}
            >
              Cotizar Ahora
            </motion.button>
          )}

          {isAuthenticated ? (
            <div className="relative">
              <motion.button
                className="flex items-center border border-blue-500 text-blue-500 hover:bg-blue-50 px-4 py-2 rounded-md transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              >
                <User className="h-4 w-4 mr-2" />
                {user?.name || "Mi Cuenta"}
              </motion.button>

              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false)
                        if (typeof onProfileClick === "function") {
                          onProfileClick()
                        }
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                    >
                      Mi Perfil
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false)
                        if (typeof onDashboardClick === "function") {
                          onDashboardClick()
                        }
                      }}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </button>

                    {/* Mostrar botón de administración solo para usuarios admin */}
                    {showAdminButton && (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false)
                          if (typeof onAdminPanelClick === "function") {
                            onAdminPanelClick()
                          }
                        }}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Panel Admin
                      </button>
                    )}

                    <button
                      onClick={onLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <motion.button
                className="flex items-center border border-blue-400 text-blue-400 hover:bg-blue-50 px-4 py-2 rounded-md transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                onClick={onLoginClick}
              >
                <User className="h-4 w-4 mr-2" />
                Iniciar Sesión
              </motion.button>
              <motion.button
                className="flex items-center bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-md transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                onClick={onRegisterClick}
              >
                Registrarse
              </motion.button>
            </>
          )}
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
                <a
                  href="#"
                  className="text-gray-700 hover:text-blue-400 transition-colors py-2 block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Inicio
                </a>
              </motion.div>
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <a
                  href="#about"
                  className="text-gray-700 hover:text-blue-400 transition-colors py-2 block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Nosotros
                </a>
              </motion.div>
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                <a
                  href="#benefits"
                  className="text-gray-700 hover:text-blue-400 transition-colors py-2 block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Beneficios
                </a>
              </motion.div>
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                <a
                  href="#contact"
                  className="text-gray-700 hover:text-blue-400 transition-colors py-2 block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contacto
                </a>
              </motion.div>

              {isAuthenticated ? (
                <motion.button
                  className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-md transition-colors w-full"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsMenuOpen(false)
                    if (typeof onDashboardClick === "function") {
                      onDashboardClick()
                    }
                  }}
                >
                  Contratar Seguro
                </motion.button>
              ) : (
                <motion.button
                  className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-md transition-colors w-full"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsMenuOpen(false)
                    onLoginClick()
                  }}
                >
                  Cotizar Ahora
                </motion.button>
              )}

              {isAuthenticated ? (
                <>
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="border-t border-gray-200 pt-2"
                  >
                    <p className="text-gray-500 text-sm mb-2">Conectado como: {user?.name || "Usuario"}</p>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false)
                        if (typeof onProfileClick === "function") {
                          onProfileClick()
                        }
                      }}
                      className="text-gray-700 hover:text-blue-400 transition-colors py-2 block"
                    >
                      Mi Perfil
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false)
                        if (typeof onDashboardClick === "function") {
                          onDashboardClick()
                        }
                      }}
                      className="flex items-center text-gray-700 hover:text-blue-400 transition-colors py-2"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </button>

                    {/* Mostrar botón de administración solo para usuarios admin */}
                    {showAdminButton && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false)
                          if (typeof onAdminPanelClick === "function") {
                            onAdminPanelClick()
                          }
                        }}
                        className="flex items-center text-purple-600 hover:text-purple-700 transition-colors py-2"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Panel Admin
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsMenuOpen(false)
                        onLogout()
                      }}
                      className="flex items-center text-red-600 hover:text-red-700 transition-colors py-2"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </button>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.button
                    className="flex items-center justify-center border border-blue-400 text-blue-400 hover:bg-blue-50 px-4 py-2 rounded-md transition-colors w-full"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsMenuOpen(false)
                      onLoginClick()
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Iniciar Sesión
                  </motion.button>
                  <motion.button
                    className="flex items-center justify-center bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-md transition-colors w-full"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsMenuOpen(false)
                      onRegisterClick()
                    }}
                  >
                    Registrarse
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

export default Header
