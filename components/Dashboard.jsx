"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Shield, AlertCircle, ChevronRight, ArrowLeft } from "lucide-react"
import { authService, policyService } from "../services/api"
import PolicyCard from "./PolicyCard"
import AvailablePolicies from "./AvailablePolicies"
import PolicyForm from "./PolicyForm"
import CheckoutProcess from "./CheckoutProcess"

function Dashboard({ onGoHome }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userPolicies, setUserPolicies] = useState([])
  const [loadingPolicies, setLoadingPolicies] = useState(false)
  const [view, setView] = useState("dashboard") // dashboard, buy, checkout
  const [selectedPolicyType, setSelectedPolicyType] = useState(null)
  const [policyData, setPolicyData] = useState(null)

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
        setUserPolicies(userPolicies || [])
      } catch (err) {
        console.error("Error al cargar pólizas:", err)
        // No mostrar error, simplemente mostrar un array vacío
        setUserPolicies([])
      }
    } finally {
      setLoadingPolicies(false)
    }
  }

  // Manejar selección de tipo de póliza
  const handleSelectPolicyType = (policyType) => {
    setSelectedPolicyType(policyType)
    setView("buy")
  }

  // Manejar envío del formulario de póliza
  const handlePolicyFormSubmit = (formData) => {
    setPolicyData(formData)
    setView("checkout")
  }

  // Manejar finalización de compra
  const handleCheckoutComplete = async (paymentData) => {
    try {
      setLoading(true)

      // Combinar datos de la póliza con datos de pago
      const completeData = {
        ...policyData,
        payment: paymentData,
      }

      // Crear la póliza en el servidor
      await policyService.createPolicy(completeData)

      // Recargar las pólizas del usuario
      await fetchUserPolicies()

      // Volver a la vista del dashboard
      setView("dashboard")

      // Mostrar mensaje de éxito (podrías implementar un sistema de notificaciones)
      alert("¡Póliza contratada con éxito!")
    } catch (error) {
      console.error("Error al completar la compra:", error)
      setError(error.message || "Error al completar la compra")
    } finally {
      setLoading(false)
    }
  }

  // Manejar cancelación de compra
  const handleCancelPurchase = () => {
    setView("dashboard")
    setSelectedPolicyType(null)
    setPolicyData(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B4C4AE] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
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
          {/* Encabezado del dashboard */}
          <div className="bg-blue-400 text-white p-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-white text-blue-400 rounded-full p-3 mr-4">
                  <Shield className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Dashboard de Seguros</h1>
                  <p className="text-amber-50">Bienvenido, {user?.name || "Usuario"}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <motion.button
                  className="flex items-center bg-white text-blue-400 px-4 py-2 rounded-md font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onGoHome}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al inicio
                </motion.button>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="p-6">
            {/* Navegación entre vistas */}
            {view !== "dashboard" && (
              <div className="mb-6">
                <button
                  onClick={handleCancelPurchase}
                  className="flex items-center text-blue-400 hover:text-blue-500 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al dashboard
                </button>
              </div>
            )}

            {/* Vista del dashboard */}
            {view === "dashboard" && (
              <div>
                {/* Sección de pólizas actuales */}
                <div className="mb-10">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Mis Pólizas Actuales</h2>

                  {loadingPolicies ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Cargando pólizas...</p>
                    </div>
                  ) : userPolicies.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {userPolicies.map((policy) => (
                        <PolicyCard key={policy.id} policy={policy} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No tienes pólizas activas</h3>
                      <p className="text-gray-600 mb-4">Contrata tu primera póliza para proteger lo que más valoras.</p>
                    </div>
                  )}
                </div>

                {/* Sección de pólizas disponibles */}
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Pólizas Disponibles</h2>
                    <motion.button
                      className="flex items-center text-blue-400 hover:text-blue-500 font-medium transition-colors"
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <span>Ver todas</span>
                      <ChevronRight className="h-5 w-5 ml-1" />
                    </motion.button>
                  </div>

                  <AvailablePolicies onSelectPolicy={handleSelectPolicyType} />
                </div>
              </div>
            )}

            {/* Vista de formulario de compra */}
            {view === "buy" && selectedPolicyType && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                  Contratar Seguro de {getPolicyTypeName(selectedPolicyType)}
                </h2>
                <PolicyForm
                  policyType={selectedPolicyType}
                  onSubmit={handlePolicyFormSubmit}
                  onCancel={handleCancelPurchase}
                />
              </div>
            )}

            {/* Vista de proceso de checkout */}
            {view === "checkout" && policyData && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Finalizar Compra</h2>
                <CheckoutProcess
                  policyData={policyData}
                  onComplete={handleCheckoutComplete}
                  onCancel={handleCancelPurchase}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Función auxiliar para obtener el nombre legible del tipo de póliza
function getPolicyTypeName(policyType) {
  const policyTypeNames = {
    auto: "Automóvil",
    home: "Hogar",
    life: "Vida",
    health: "Salud",
    travel: "Viaje",
    business: "Negocio",
  }
  return policyTypeNames[policyType] || policyType
}

export default Dashboard

