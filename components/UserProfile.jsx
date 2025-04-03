"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Shield, LogOut, AlertCircle, Check } from "lucide-react"
import { authService, policyService } from "../services/api"
import ProfileSidebar from "./ProfileSidebar"
import PersonalInfoForm from "./PersonalInfoForm"
import ChangePasswordForm from "./ChangePasswordForm"
import PolicyCard from "./PolicyCard"

function UserProfile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("personal-info")
  const [policies, setPolicies] = useState([])
  const [loadingPolicies, setLoadingPolicies] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Cargar datos del usuario
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Obtener usuario del localStorage
        const currentUser = authService.getCurrentUser()

        if (!currentUser) {
          throw new Error("No se encontró información del usuario")
        }

        // Usar el usuario del localStorage mientras se carga el perfil
        setUser(currentUser)

        try {
          // Obtener perfil actualizado desde el servidor
          const profileData = await authService.getProfile()
          setUser(profileData.user)
        } catch (profileError) {
          console.error("Error al cargar perfil desde el servidor:", profileError)
          // No establecer error aquí, ya que tenemos el usuario del localStorage
        }

        // Cargar pólizas del usuario
        await fetchUserPolicies()
      } catch (err) {
        console.error("Error al cargar datos del usuario:", err)
        setError(err.message || "Error al cargar datos del usuario")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  // Cargar pólizas del usuario
  const fetchUserPolicies = async () => {
    try {
      setLoadingPolicies(true)
      try {
        const userPolicies = await policyService.getPolicies()
        setPolicies(userPolicies || [])
      } catch (err) {
        console.error("Error al cargar pólizas:", err)
        // No mostrar error, simplemente mostrar un array vacío
        setPolicies([])
      }
    } finally {
      setLoadingPolicies(false)
    }
  }

  // Manejar actualización de información personal
  const handleUpdatePersonalInfo = async (updatedInfo) => {
    try {
      // Aquí iría la llamada a la API para actualizar la información
      // Por ahora, solo actualizamos el estado local
      setUser({ ...user, ...updatedInfo })
      showSuccessMessage("Información personal actualizada correctamente")
    } catch (err) {
      setError(err.message || "Error al actualizar información personal")
    }
  }

  // Manejar cambio de contraseña
  const handleChangePassword = async (passwordData) => {
    try {
      // Aquí iría la llamada a la API para cambiar la contraseña
      showSuccessMessage("Contraseña actualizada correctamente")
    } catch (err) {
      setError(err.message || "Error al cambiar la contraseña")
    }
  }

  // Mostrar mensaje de éxito temporalmente
  const showSuccessMessage = (message) => {
    setSuccessMessage(message)
    setTimeout(() => {
      setSuccessMessage("")
    }, 5000)
  }

  // Manejar cierre de sesión
  const handleLogout = () => {
    authService.logout()
    window.location.href = "/"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B4C4AE] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="flex items-center text-red-500 mb-4">
            <AlertCircle className="h-6 w-6 mr-2" />
            <h2 className="text-xl font-semibold">Error</h2>
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-[#B4C4AE] hover:bg-[#a3b39d] text-white py-2 rounded-md transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Encabezado del perfil */}
          <div className="bg-[#B4C4AE] text-white p-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-white text-[#B4C4AE] rounded-full p-3 mr-4">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{user?.name || "Usuario"}</h1>
                  <p className="text-amber-50">{user?.email}</p>
                </div>
              </div>
              <motion.button
                className="flex items-center bg-white text-[#B4C4AE] px-4 py-2 rounded-md font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </motion.button>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex flex-col md:flex-row">
            {/* Barra lateral */}
            <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Contenido principal */}
            <div className="flex-1 p-6">
              {/* Mensajes de éxito */}
              {successMessage && (
                <motion.div
                  className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md flex items-start"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Check className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-green-600">{successMessage}</p>
                </motion.div>
              )}

              {/* Información personal */}
              {activeTab === "personal-info" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Información Personal</h2>
                  <PersonalInfoForm user={user} onSubmit={handleUpdatePersonalInfo} />
                </div>
              )}

              {/* Pólizas */}
              {activeTab === "policies" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Mis Pólizas</h2>

                  {loadingPolicies ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B4C4AE] mx-auto"></div>
                      <p className="mt-4 text-gray-600">Cargando pólizas...</p>
                    </div>
                  ) : policies.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                      {policies.map((policy) => (
                        <PolicyCard key={policy.id} policy={policy} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No tienes pólizas activas</h3>
                      <p className="text-gray-600 mb-4">Contrata tu primera póliza para proteger lo que más valoras.</p>
                      <motion.button
                        className="bg-[#B4C4AE] hover:bg-[#a3b39d] text-white px-4 py-2 rounded-md transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Cotizar Ahora
                      </motion.button>
                    </div>
                  )}
                </div>
              )}

              {/* Seguridad */}
              {activeTab === "security" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Seguridad</h2>
                  <ChangePasswordForm onSubmit={handleChangePassword} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile

