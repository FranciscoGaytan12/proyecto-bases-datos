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
import api from "../services/api"
// Importar los componentes de perfil y dashboard
import ProfilePage from "./profile-page"
import Dashboard from "./Dashboard"
// Importar el componente AdminPanel
import AdminPanel from "./AdminPanel"
import Coments from "./Coments"

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
  // Variable para controlar si el usuario es administrador
  const [isAdmin, setIsAdmin] = useState(false)

  // Función para verificar si el usuario es administrador
  const checkAdminStatus = async () => {
    try {
      console.log("Verificando si el usuario es administrador...")

      // Verificar primero si hay un token válido
      const token = localStorage.getItem("token")
      if (!token) {
        console.log("No hay token disponible")
        return false
      }

      // Verificar si el usuario ya tiene rol de admin en localStorage
      const userStr = localStorage.getItem("user")
      if (userStr) {
        try {
          const userData = JSON.parse(userStr)
          if (userData && userData.role === "admin") {
            console.log("Usuario ya tiene rol admin en localStorage")
            setIsAdmin(true)
            return true
          }
        } catch (e) {
          console.error("Error al parsear usuario de localStorage:", e)
        }
      }

      // Si llegamos aquí, intentamos verificar con el backend
      try {
        // Verificar primero si la ruta existe
        const testResponse = await api.get("/")
        console.log("Conexión básica al API exitosa:", testResponse.status)

        // Ahora intentar la ruta específica
        const response = await api.get("/diagnostic/check-admin")
        console.log("Respuesta de verificación de admin:", response.data)

        if (response.data && response.data.isAdmin) {
          console.log("✅ El usuario es administrador según el backend")
          setIsAdmin(true)

          // Actualizar el usuario en localStorage con el rol correcto
          if (userStr) {
            try {
              const userData = JSON.parse(userStr)
              const updatedUser = { ...userData, role: "admin" }
              localStorage.setItem("user", JSON.stringify(updatedUser))
              setUser(updatedUser)
            } catch (e) {
              console.error("Error al actualizar usuario en localStorage:", e)
            }
          }

          return true
        } else {
          console.log("❌ El usuario no es administrador según el backend")
          setIsAdmin(false)
          return false
        }
      } catch (apiError) {
        console.error("Error al verificar con el endpoint:", apiError)

        // Verificar si es un error 404 (ruta no encontrada)
        if (apiError.status === 404 || (apiError.response && apiError.response.status === 404)) {
          console.log("⚠️ La ruta /diagnostic/check-admin no existe en el backend")

          // Verificación alternativa: verificar directamente en la base de datos
          try {
            // Intentar verificar con un endpoint alternativo
            const profileResponse = await api.get("/profile")
            console.log("Respuesta de perfil:", profileResponse.data)

            // Si el perfil tiene rol admin, establecer isAdmin a true
            if (profileResponse.data && profileResponse.data.role === "admin") {
              console.log("✅ El usuario es administrador según el perfil")
              setIsAdmin(true)

              // Actualizar el usuario en localStorage
              if (userStr) {
                try {
                  const userData = JSON.parse(userStr)
                  const updatedUser = { ...userData, role: "admin" }
                  localStorage.setItem("user", JSON.stringify(updatedUser))
                  setUser(updatedUser)
                } catch (e) {
                  console.error("Error al actualizar usuario en localStorage:", e)
                }
              }

              return true
            }
          } catch (profileError) {
            console.error("Error al verificar perfil:", profileError)
          }
        }

        // Para desarrollo, establecer como admin para pruebas
        // SOLO PARA DESARROLLO - QUITAR EN PRODUCCIÓN
        console.log("⚠️ Usando verificación alternativa para desarrollo")
        setIsAdmin(true)

        // Actualizar el usuario en localStorage para pruebas
        if (userStr) {
          try {
            const userData = JSON.parse(userStr)
            const updatedUser = { ...userData, role: "admin" }
            localStorage.setItem("user", JSON.stringify(updatedUser))
            setUser(updatedUser)
          } catch (e) {
            console.error("Error al actualizar usuario en localStorage:", e)
          }
        }

        return true
      }
    } catch (error) {
      console.error("Error al verificar si el usuario es administrador:", error)

      // En caso de error, establecemos isAdmin a true para permitir pruebas
      // SOLO PARA DESARROLLO - QUITAR EN PRODUCCIÓN
      console.log("⚠️ Error general, estableciendo admin=true para desarrollo")
      setIsAdmin(true)

      // Actualizar el usuario en localStorage para pruebas
      const userStr = localStorage.getItem("user")
      if (userStr) {
        try {
          const userData = JSON.parse(userStr)
          const updatedUser = { ...userData, role: "admin" }
          localStorage.setItem("user", JSON.stringify(updatedUser))
          setUser(updatedUser)
        } catch (e) {
          console.error("Error al actualizar usuario en localStorage:", e)
        }
      }

      return true
    }
  }

  // Verificar si el usuario está autenticado al cargar la página
  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = authService.isAuthenticated()
      setIsAuthenticated(isAuth)

      if (isAuth) {
        const currentUser = authService.getCurrentUser()
        setUser(currentUser)

        // Si el usuario tiene rol de admin en localStorage, establecer isAdmin a true
        if (currentUser && currentUser.role === "admin") {
          console.log("Usuario con rol admin encontrado en localStorage")
          setIsAdmin(true)
        } else {
          // Verificar el estado de administrador en el servidor
          await checkAdminStatus()
        }
      }
    }

    checkAuth()

    // Escuchar el evento personalizado para actualización de rol
    const handleRoleUpdate = (event) => {
      console.log("Evento de actualización de rol recibido:", event.detail)
      if (event.detail && event.detail.role === "admin") {
        setIsAdmin(true)
        // Actualizar el usuario si es necesario
        const currentUser = authService.getCurrentUser()
        if (currentUser && currentUser.role !== "admin") {
          setUser({ ...currentUser, role: "admin" })
        }
      }
    }

    window.addEventListener("userRoleUpdated", handleRoleUpdate)

    // Limpiar el event listener
    return () => {
      window.removeEventListener("userRoleUpdated", handleRoleUpdate)
    }
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
    setShowAdminPanel(false)
    setIsLoginOpen(false)
    setIsRegisterOpen(false)
  }

  // Función para manejar la navegación al dashboard
  const handleDashboardClick = () => {
    setShowDashboard(true)
    setShowProfile(false)
    setShowAdminPanel(false)
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
    setIsAdmin(false)
    setShowProfile(false)
    setShowDashboard(false)
    setShowAdminPanel(false)
  }

  // Función para manejar el inicio de sesión exitoso
  const handleLoginSuccess = async (userData) => {
    setIsAuthenticated(true)
    setUser(userData.user)
    setIsLoginOpen(false)

    // Verificar si el usuario es administrador
    if (userData.user && userData.user.role === "admin") {
      console.log("Usuario con rol admin detectado en login")
      setIsAdmin(true)
    } else {
      // Verificar en el servidor
      await checkAdminStatus()
    }
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
        isAdmin={isAdmin}
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
      <Login
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onRegisterClick={handleRegisterClick}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Modal de registro */}
      <Register isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} onLoginClick={handleLoginClick} />

      {/* Botón de depuración (solo visible en desarrollo) */}
      {process.env.NODE_ENV !== "production" && isAuthenticated && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={checkAdminStatus}
            className="bg-purple-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-purple-700 transition-colors"
          >
            Verificar Admin
          </button>
        </div>
      )}
    </div>
  )
}

export default App
