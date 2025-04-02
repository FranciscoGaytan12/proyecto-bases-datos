"use client"

import { useScroll, motion } from "framer-motion"
import { useState, useEffect } from "react"
import Header from "./Header"
import Hero from "./Hero"
import About from "./About"
import Benefits from "./Benefits"
import CTA from "./CTA"
import Footer from "./Footer"
import Login from "./Login"
import Register from "./Register"
import { authService } from "./services/api"

function App() {
  const { scrollYProgress } = useScroll()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  // Verificar si el usuario está autenticado al cargar la página
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authService.isAuthenticated()
      setIsAuthenticated(isAuth)

      if (isAuth) {
        setUser(authService.getCurrentUser())
      }
    }

    checkAuth()
  }, [])

  const handleLoginClick = () => {
    setIsRegisterOpen(false)
    setIsLoginOpen(true)
  }

  const handleRegisterClick = () => {
    setIsLoginOpen(false)
    setIsRegisterOpen(true)
  }

  const handleLogout = () => {
    authService.logout()
    setIsAuthenticated(false)
    setUser(null)
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Barra de progreso */}
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-blue-400 z-50" style={{ scaleX: scrollYProgress }} />

      <Header
        onLoginClick={handleLoginClick}
        onRegisterClick={handleRegisterClick}
        onLogout={handleLogout}
        isAuthenticated={isAuthenticated}
        user={user}
      />
      <main>
        <Hero />
        <About />
        <Benefits />
        <CTA />
      </main>
      <Footer />

      {/* Modal de inicio de sesión */}
      <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onRegisterClick={handleRegisterClick} />

      {/* Modal de registro */}
      <Register isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} onLoginClick={handleLoginClick} />
    </div>
  )
}

export default App

