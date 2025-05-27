"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  MapPin,
  DollarSign,
  Phone,
  Info,
  Download,
} from "lucide-react"
import { policyService } from "../services/api"
import { handleApiError } from "../backend/error-handler"

function ClaimDetails({ claimId, onClose, onClaimUpdated }) {
  const [claim, setClaim] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  // Cargar los detalles del siniestro
  useEffect(() => {
    const fetchClaimDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        // Aquí llamaríamos a un endpoint para obtener los detalles del siniestro
        // Por ahora, usaremos datos de ejemplo
        const response = await policyService.getClaimDetails(claimId)
        setClaim(response)
      } catch (err) {
        handleApiError(err, setError, setLoading)
      } finally {
        setLoading(false)
      }
    }

    if (claimId) {
      fetchClaimDetails()
    }
  }, [claimId])

  // Manejar la cancelación de un siniestro
  const handleCancelClaim = async () => {
    try {
      setCancelling(true)

      // Aquí llamaríamos a un endpoint para cancelar el siniestro
      await policyService.cancelClaim(claimId)

      // Actualizar el estado del siniestro localmente
      const updatedClaim = { ...claim, status: "cancelled" }
      setClaim(updatedClaim)

      // Notificar al componente padre
      if (onClaimUpdated) {
        onClaimUpdated(updatedClaim)
      }

      setShowConfirmCancel(false)
    } catch (err) {
      handleApiError(err, setError, setCancelling)
    } finally {
      setCancelling(false)
    }
  }

  // Animaciones para el modal
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
  }

  const modalVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: 0.1,
      },
    },
    exit: {
      opacity: 0,
      y: 50,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={overlayVariants}
        onClick={onClose}
      />

      <motion.div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl relative z-10 max-h-[90vh] overflow-y-auto"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalVariants}
      >
        {/* Botón de cerrar */}
        <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10" onClick={onClose}>
          <X className="h-6 w-6" />
        </button>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando detalles del siniestro...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Error</h3>
            <p className="text-gray-600">{error}</p>
            <button className="mt-4 px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500" onClick={onClose}>
              Cerrar
            </button>
          </div>
        ) : claim ? (
          <div>
            {/* Encabezado */}
            <div className="bg-blue-400 text-white p-6 relative">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-white mr-4">
                  <FileText className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Siniestro #{claim.claim_number}</h2>
                  <p className="text-white opacity-90">
                    Póliza: {claim.policy_number} • Registrado: {formatDate(claim.submission_date)}
                  </p>
                </div>
                <div
                  className={`ml-auto px-4 py-2 rounded-full text-sm font-medium flex items-center ${getStatusClass(claim.status)}`}
                >
                  {getStatusIcon(claim.status)}
                  {getStatusLabel(claim.status)}
                </div>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6">
              {/* Información general */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Información General</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Fecha del incidente:</p>
                      <p className="font-medium">{formatDate(claim.incident_date)}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Ubicación:</p>
                      <p className="font-medium">{claim.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <DollarSign className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Monto estimado:</p>
                      <p className="font-medium">{formatCurrency(claim.estimated_amount)}</p>
                    </div>
                  </div>

                  {claim.contact_phone && (
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600">Teléfono de contacto:</p>
                        <p className="font-medium">{claim.contact_phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Descripción del Incidente</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-line">{claim.description}</p>
                </div>
              </div>

              {/* Información adicional */}
              {claim.additional_info && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Información Adicional</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-line">{claim.additional_info}</p>
                  </div>
                </div>
              )}

              {/* Fotografías */}
              {claim.photos && claim.photos.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Fotografías</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {claim.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <div className="h-40 rounded-md overflow-hidden border border-gray-300">
                          <img
                            src={photo.url || "/placeholder.svg"}
                            alt={`Foto ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                          <button
                            className="p-2 bg-white rounded-full"
                            onClick={() => window.open(photo.url, "_blank")}
                          >
                            <Download className="h-5 w-5 text-gray-700" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historial de actualizaciones */}
              {claim.updates && claim.updates.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                    Historial de Actualizaciones
                  </h3>
                  <div className="space-y-4">
                    {claim.updates.map((update, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-800">{update.title}</h4>
                          <span className="text-sm text-gray-500">{formatDate(update.date)}</span>
                        </div>
                        <p className="text-gray-700">{update.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="mt-8 flex justify-end space-x-4">
                {claim.status === "submitted" && (
                  <button
                    className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50"
                    onClick={() => setShowConfirmCancel(true)}
                  >
                    Cancelar Siniestro
                  </button>
                )}
                <button className="px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500" onClick={onClose}>
                  Cerrar
                </button>
              </div>
            </div>

            {/* Modal de confirmación de cancelación */}
            {showConfirmCancel && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirmar Cancelación</h3>
                  <p className="text-gray-600 mb-6">
                    ¿Estás seguro de que deseas cancelar este siniestro? Esta acción no se puede deshacer.
                  </p>
                  <div className="flex justify-end space-x-4">
                    <button
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      onClick={() => setShowConfirmCancel(false)}
                      disabled={cancelling}
                    >
                      No, Mantener Siniestro
                    </button>
                    <button
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      onClick={handleCancelClaim}
                      disabled={cancelling}
                    >
                      {cancelling ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Cancelando...
                        </span>
                      ) : (
                        "Sí, Cancelar Siniestro"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Siniestro no encontrado</h3>
            <p className="text-gray-600">No se encontraron detalles para este siniestro.</p>
            <button className="mt-4 px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500" onClick={onClose}>
              Cerrar
            </button>
          </div>
        )}
      </motion.div>
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

// Función auxiliar para formatear moneda
function formatCurrency(amount) {
  if (!amount && amount !== 0) return "N/A"
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount)
}

// Función auxiliar para obtener la clase CSS según el estado del siniestro
function getStatusClass(status) {
  const statusClasses = {
    submitted: "bg-blue-100 text-blue-600",
    under_review: "bg-yellow-100 text-yellow-600",
    approved: "bg-green-100 text-green-600",
    rejected: "bg-red-100 text-red-600",
    paid: "bg-purple-100 text-purple-600",
    cancelled: "bg-gray-100 text-gray-600",
  }
  return statusClasses[status] || "bg-gray-100 text-gray-600"
}

// Función auxiliar para obtener el icono según el estado del siniestro
function getStatusIcon(status) {
  switch (status) {
    case "submitted":
      return <FileText className="h-4 w-4 mr-2" />
    case "under_review":
      return <Clock className="h-4 w-4 mr-2" />
    case "approved":
      return <CheckCircle className="h-4 w-4 mr-2" />
    case "rejected":
      return <X className="h-4 w-4 mr-2" />
    case "paid":
      return <DollarSign className="h-4 w-4 mr-2" />
    case "cancelled":
      return <AlertCircle className="h-4 w-4 mr-2" />
    default:
      return <Info className="h-4 w-4 mr-2" />
  }
}

// Función auxiliar para obtener la etiqueta según el estado del siniestro
function getStatusLabel(status) {
  const statusLabels = {
    submitted: "Enviado",
    under_review: "En revisión",
    approved: "Aprobado",
    rejected: "Rechazado",
    paid: "Pagado",
    cancelled: "Cancelado",
  }
  return statusLabels[status] || "Desconocido"
}

export default ClaimDetails
