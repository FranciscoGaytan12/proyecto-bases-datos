"use client"

import { useScroll, motion } from "framer-motion"
import { useState, useEffect } from "react"
import Header from "./Header"
import Hero from "./Hero"
// import HeroWithSingleImage from "./HeroWithSingleImage" // Alternativa con una sola imagen
import About from "./About"
import Benefits from "./Benefits"
import CTA from "./CTA"
import Footer from "./Footer"
import Login from "./Login"
import Register from "../Register"
import { authService } from "../services/api"
// Importar los componentes de perfil y dashboard
import ProfilePage from "./profile-page"
import Dashboard from "./Dashboard"
// Importar el componente AdminPanel
import AdminPanel from "./AdminPanel"

function App() {
  const { scrollYProgress } = useScroll()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  // Variables de estado para controlar la visualización
  const [showProfile, setShowProfile] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  // Variable de estado para controlar la visualización del panel de administración
  const [showAdminPanel, setShowAdminPanel] = useState(false)

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

  // Función para manejar la navegación al perfil
  const handleProfileClick = () => {
    setShowProfile(true)
    setShowDashboard(false)
    setIsLoginOpen(false)
    setIsRegisterOpen(false)
  }

  // Función para manejar la navegación al dashboard
  const handleDashboardClick = () => {
    setShowDashboard(true)
    setShowProfile(false)
    setIsLoginOpen(false)
    setIsRegisterOpen(false)
  }

  // Función para manejar la navegación al panel de administración
  const handleAdminPanelClick = () => {
    setShowAdminPanel(true)
    setShowProfile(false)
    setShowDashboard(false)
    setIsLoginOpen(false)
    setIsRegisterOpen(false)
  }

  // Función para manejar el regreso a la página principal
  const handleGoHome = () => {
    setShowProfile(false)
    setShowDashboard(false)
    setShowAdminPanel(false)
  }

  const handleLogout = () => {
    authService.logout()
    setIsAuthenticated(false)
    setUser(null)
    setShowProfile(false)
    setShowDashboard(false)
    setShowAdminPanel(false)
  }

  // Modificar el return para incluir el AdminPanel
  return (
    <div className="min-h-screen bg-amber-50">
      {/* Barra de progreso */}
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-amber-600 z-50" style={{ scaleX: scrollYProgress }} />

      <Header
        onLoginClick={handleLoginClick}
        onRegisterClick={handleRegisterClick}
        onProfileClick={handleProfileClick}
        onDashboardClick={handleDashboardClick}
        onAdminPanelClick={handleAdminPanelClick}
        onLogout={handleLogout}
        isAuthenticated={isAuthenticated}
        user={user}
      />

      {showProfile ? (
        <ProfilePage onGoHome={handleGoHome} />
      ) : showDashboard ? (
        <Dashboard onGoHome={handleGoHome} />
      ) : showAdminPanel ? (
        <AdminPanel onGoBack={handleGoHome} />
      ) : (
        <main>
          <Hero />
          {/* <HeroWithSingleImage /> */} {/* Alternativa con una sola imagen */}
          <About />
          <Benefits />
          <CTA />
        </main>
      )}

      <Footer />

      {/* Modal de inicio de sesión */}
      <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onRegisterClick={handleRegisterClick} />

      {/* Modal de registro */}
      <Register isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} onLoginClick={handleLoginClick} />
    </div>
  )
}

export default App
