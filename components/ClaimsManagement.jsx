"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FileText, AlertCircle, ChevronRight, ArrowLeft, Plus, Search, Filter } from "lucide-react"
import { policyService } from "../services/api"
import ClaimForm from "./ClaimForm"
import ClaimDetails from "./ClaimDetails"

function ClaimsManagement({ onGoBack }) {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [view, setView] = useState("list") // list, new, details
  const [selectedClaimId, setSelectedClaimId] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  // Cargar los siniestros al montar el componente
  useEffect(() => {
    fetchClaims()
  }, [])

  // Actualizar la función fetchClaims para manejar mejor los errores

  // Función para cargar los siniestros
  const fetchClaims = async () => {
    try {
      setLoading(true)
      setError(null)

      // Llamar al servicio para obtener los siniestros
      const response = await policyService.getClaims()

      // Verificar si la respuesta es válida
      if (response && Array.isArray(response)) {
        setClaims(response)
        console.log("Siniestros cargados correctamente:", response)
      } else {
        console.error("Formato de respuesta inesperado:", response)
        setError("Los datos de siniestros tienen un formato inesperado. Por favor, inténtalo de nuevo.")
      }
    } catch (err) {
      console.error("Error al cargar siniestros:", err)

      // Mensaje de error más descriptivo
      let errorMessage = "Error al cargar los siniestros. "

      if (err.status === 404) {
        errorMessage +=
          "No se encontró el recurso solicitado. El endpoint de siniestros podría no estar configurado correctamente."
      } else if (err.isAuthError) {
        errorMessage += "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
      } else if (err.isServerError) {
        errorMessage += "Error en el servidor. Por favor, inténtalo más tarde."
      } else if (err.code === "NETWORK_ERROR") {
        errorMessage += "Error de red. Verifica tu conexión a internet."
      } else {
        errorMessage += err.message || "Por favor, inténtalo de nuevo."
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar siniestros según búsqueda y filtros
  const filteredClaims = claims.filter((claim) => {
    const matchesSearch =
      claim.claim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (claim.policy_number && claim.policy_number.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFilter = filterStatus === "all" || claim.status === filterStatus

    return matchesSearch && matchesFilter
  })

  // Manejar la creación exitosa de un siniestro
  const handleClaimCreated = (newClaim) => {
    setClaims((prev) => [newClaim, ...prev])
    setView("list")
  }

  // Manejar la actualización de un siniestro
  const handleClaimUpdated = (updatedClaim) => {
    setClaims((prev) => prev.map((claim) => (claim.id === updatedClaim.id ? updatedClaim : claim)))
    setView("list")
  }

  // Manejar la visualización de detalles de un siniestro
  const handleViewDetails = (claimId) => {
    setSelectedClaimId(claimId)
    setView("details")
  }

  // Renderizar el contenido según la vista actual
  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando siniestros...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-12 bg-red-50 rounded-lg">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={fetchClaims} className="px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500">
            Reintentar
          </button>
        </div>
      )
    }

    if (view === "new") {
      return <ClaimForm onSubmitSuccess={handleClaimCreated} onCancel={() => setView("list")} />
    }

    if (view === "details" && selectedClaimId) {
      return (
        <ClaimDetails claimId={selectedClaimId} onClose={() => setView("list")} onClaimUpdated={handleClaimUpdated} />
      )
    }

    // Vista de lista por defecto
    return (
      <div>
        {/* Barra de búsqueda y filtros */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por número o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-400 mr-2" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400"
            >
              <option value="all">Todos los estados</option>
              <option value="submitted">Enviados</option>
              <option value="under_review">En revisión</option>
              <option value="approved">Aprobados</option>
              <option value="rejected">Rechazados</option>
              <option value="paid">Pagados</option>
            </select>
          </div>

          <motion.button
            onClick={() => setView("new")}
            className="flex items-center justify-center px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500 md:w-auto"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Siniestro
          </motion.button>
        </div>

        {/* Lista de siniestros */}
        {filteredClaims.length > 0 ? (
          <div className="space-y-4">
            {filteredClaims.map((claim) => (
              <motion.div
                key={claim.id}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                whileHover={{ y: -2 }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${getStatusBgColor(claim.status)}`}>
                      <FileText className={`h-5 w-5 ${getStatusTextColor(claim.status)}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">Siniestro #{claim.claim_number}</h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(claim.submission_date)} • Póliza: {claim.policy_number || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{claim.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center mt-3 md:mt-0">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(claim.status)} mr-3`}>
                      {getStatusLabel(claim.status)}
                    </span>
                    <motion.button
                      onClick={() => handleViewDetails(claim.id)}
                      className="flex items-center text-blue-400 hover:text-blue-500"
                      whileHover={{ x: 3 }}
                    >
                      <span className="text-sm mr-1">Ver detalles</span>
                      <ChevronRight className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No hay siniestros</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== "all"
                ? "No se encontraron siniestros con los filtros aplicados."
                : "Aún no has registrado ningún siniestro."}
            </p>
            {searchTerm || filterStatus !== "all" ? (
              <button
                onClick={() => {
                  setSearchTerm("")
                  setFilterStatus("all")
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Limpiar filtros
              </button>
            ) : (
              <button
                onClick={() => setView("new")}
                className="px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500"
              >
                Registrar Siniestro
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Encabezado */}
        <div className="bg-blue-400 text-white p-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-white text-blue-400 rounded-full p-3 mr-4">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Gestión de Siniestros</h1>
                <p className="text-white opacity-90">Registra y consulta tus siniestros</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <motion.button
                className="flex items-center bg-white text-blue-400 px-4 py-2 rounded-md font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGoBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al dashboard
              </motion.button>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="p-6">
          {/* Navegación entre vistas */}
          {view !== "list" && (
            <div className="mb-6">
              <button
                onClick={() => setView("list")}
                className="flex items-center text-blue-400 hover:text-blue-500 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a la lista de siniestros
              </button>
            </div>
          )}

          {renderContent()}
        </div>
      </div>
    </div>
  )
}

// Función auxiliar para formatear fechas
function formatDate(dateString) {
  if (!dateString) return "Fecha desconocida"
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// Función auxiliar para obtener la clase CSS según el estado del siniestro
function getStatusClass(status) {
  const statusClasses = {
    submitted: "bg-blue-100 text-blue-600",
    under_review: "bg-yellow-100 text-yellow-600",
    approved: "bg-green-100 text-green-600",
    rejected: "bg-red-100 text-red-600",
    paid: "bg-purple-100 text-purple-600",
  }
  return statusClasses[status] || "bg-gray-100 text-gray-600"
}

// Función auxiliar para obtener el color de fondo según el estado
function getStatusBgColor(status) {
  const bgColors = {
    submitted: "bg-blue-100",
    under_review: "bg-yellow-100",
    approved: "bg-green-100",
    rejected: "bg-red-100",
    paid: "bg-purple-100",
  }
  return bgColors[status] || "bg-gray-100"
}

// Función auxiliar para obtener el color de texto según el estado
function getStatusTextColor(status) {
  const textColors = {
    submitted: "text-blue-600",
    under_review: "text-yellow-600",
    approved: "text-green-600",
    rejected: "text-red-600",
    paid: "text-purple-600",
  }
  return textColors[status] || "text-gray-600"
}

// Función auxiliar para obtener la etiqueta según el estado del siniestro
function getStatusLabel(status) {
  const statusLabels = {
    submitted: "Enviado",
    under_review: "En revisión",
    approved: "Aprobado",
    rejected: "Rechazado",
    paid: "Pagado",
  }
  return statusLabels[status] || "Desconocido"
}

export default ClaimsManagement
