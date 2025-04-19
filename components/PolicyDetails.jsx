"use client"

import React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Shield, Calendar, AlertTriangle, CheckCircle, Clock, X, FileText, User, Home, Car, Heart } from "lucide-react"
import { policyService } from "../services/api"

import { handleApiError } from "../backend/error-handler"



// Función para formatear fechas
const formatDate = (dateString) => {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// Función para formatear moneda
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "N/A"
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount)
}

// Mapeo de tipos de póliza a nombres legibles e iconos
const policyTypeConfig = {
  auto: {
    name: "Automóvil",
    icon: Car,
    color: "text-blue-500",
    bgColor: "bg-blue-100",
  },
  home: {
    name: "Hogar",
    icon: Home,
    color: "text-green-500",
    bgColor: "bg-green-100",
  },
  life: {
    name: "Vida",
    icon: Heart,
    color: "text-red-500",
    bgColor: "bg-red-100",
  },
  health: {
    name: "Salud",
    icon: User,
    color: "text-purple-500",
    bgColor: "bg-purple-100",
  },
  travel: {
    name: "Viaje",
    icon: Calendar,
    color: "text-yellow-500",
    bgColor: "bg-yellow-100",
  },
  business: {
    name: "Negocio",
    icon: FileText,
    color: "text-gray-500",
    bgColor: "bg-gray-100",
  },
}

// Mapeo de estados a colores y nombres
const statusConfig = {
  active: {
    color: "text-green-600 bg-green-50 border-green-200",
    icon: CheckCircle,
    label: "Activa",
  },
  pending: {
    color: "text-yellow-600 bg-yellow-50 border-yellow-200",
    icon: Clock,
    label: "Pendiente",
  },
  expired: {
    color: "text-red-600 bg-red-50 border-red-200",
    icon: AlertTriangle,
    label: "Expirada",
  },
  cancelled: {
    color: "text-gray-600 bg-gray-50 border-gray-200",
    icon: AlertTriangle,
    label: "Cancelada",
  },
}

function PolicyDetails({ policyId, onClose, onPolicyCancelled }) {
  const [policy, setPolicy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelSuccess, setCancelSuccess] = useState(false)

  // In the useEffect for fetching policy details, update the catch block:
  useEffect(() => {
    const fetchPolicyDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        // Obtener detalles de la póliza
        const policyDetails = await policyService.getPolicyDetails(policyId)
        setPolicy(policyDetails)
      } catch (err) {
        console.error("Error al cargar detalles de la póliza:", err)

        // Use our error handler utility
        handleApiError(err, setError, setLoading, false)

        // For 500 errors or network errors, use fallback data in development
        if (err.isServerError || err.status === 500 || err.code === "NETWORK_ERROR" || err.code === "NO_RESPONSE") {
          console.log("Usando datos de respaldo para detalles de póliza")
          setPolicy(createFallbackResponse("policy"))
        }
      } finally {
        setLoading(false)
      }
    }

    if (policyId) {
      fetchPolicyDetails()
    }
  }, [policyId])

  // Also update the handleCancelPolicy function:
  const handleCancelPolicy = async () => {
    try {
      setCancelling(true)

      // Llamar al servicio para cancelar la póliza
      await policyService.cancelPolicy(policyId)

      // Mostrar mensaje de éxito
      setCancelSuccess(true)

      // Notificar al componente padre que la póliza fue cancelada
      if (onPolicyCancelled) {
        setTimeout(() => {
          onPolicyCancelled(policyId)
        }, 2000)
      }
    } catch (err) {
      console.error("Error al cancelar la póliza:", err)

      // Use our error handler utility
      handleApiError(err, setError, setCancelling, false)
    } finally {
      setCancelling(false)
    }
  }

  // Obtener la configuración del tipo de póliza
  const getPolicyTypeConfig = (type) => {
    return (
      policyTypeConfig[type] || {
        name: "Desconocido",
        icon: Shield,
        color: "text-gray-500",
        bgColor: "bg-gray-100",
      }
    )
  }

  // Obtener la configuración del estado
  const getStatusConfig = (status) => {
    return statusConfig[status] || statusConfig.pending
  }

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
            <p className="mt-4 text-gray-600">Cargando detalles de la póliza...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Error</h3>
            <p className="text-gray-600">{error}</p>
            <button className="mt-4 px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500" onClick={onClose}>
              Cerrar
            </button>
          </div>
        ) : cancelSuccess ? (
          <div className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Póliza Cancelada</h3>
            <p className="text-gray-600">La póliza ha sido cancelada exitosamente.</p>
            <button className="mt-4 px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500" onClick={onClose}>
              Cerrar
            </button>
          </div>
        ) : policy ? (
          <div>
            {/* Encabezado */}
            <div className="bg-blue-400 text-white p-6 relative">
              <div className="flex items-center">
                {policy.policy_type && (
                  <div className={`p-3 rounded-full ${getPolicyTypeConfig(policy.policy_type).bgColor} mr-4`}>
                    {React.createElement(getPolicyTypeConfig(policy.policy_type).icon, {
                      className: `h-8 w-8 ${getPolicyTypeConfig(policy.policy_type).color}`,
                    })}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold">Póliza de {getPolicyTypeConfig(policy.policy_type).name}</h2>
                  <p className="text-white opacity-90">Número: {policy.policy_number}</p>
                </div>
                {policy.status && (
                  <div
                    className={`ml-auto px-4 py-2 rounded-full text-sm font-medium flex items-center ${getStatusConfig(policy.status).color}`}
                  >
                    {React.createElement(getStatusConfig(policy.status).icon, {
                      className: "h-4 w-4 mr-2",
                    })}
                    {getStatusConfig(policy.status).label}
                  </div>
                )}
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6">
              {/* Información general */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Información General</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">Fecha de inicio:</p>
                    <p className="font-medium">{formatDate(policy.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Fecha de fin:</p>
                    <p className="font-medium">{formatDate(policy.end_date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Prima mensual:</p>
                    <p className="font-medium">{formatCurrency(policy.premium)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Cobertura:</p>
                    <p className="font-medium">{formatCurrency(policy.coverage_amount)}</p>
                  </div>
                </div>
              </div>

              {/* Detalles específicos según el tipo de póliza */}
              {policy.policy_type === "auto" && policy.details && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Detalles del Vehículo</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600 text-sm">Marca:</p>
                      <p className="font-medium">{policy.details.make}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Modelo:</p>
                      <p className="font-medium">{policy.details.model}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Año:</p>
                      <p className="font-medium">{policy.details.year}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Matrícula:</p>
                      <p className="font-medium">{policy.details.license_plate}</p>
                    </div>
                  </div>
                </div>
              )}

              {policy.policy_type === "home" && policy.details && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Detalles de la Vivienda</h3>
                  <div className="mb-4">
                    <p className="text-gray-600 text-sm">Dirección:</p>
                    <p className="font-medium">{policy.details.address}</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600 text-sm">Metros cuadrados:</p>
                      <p className="font-medium">{policy.details.square_meters} m²</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Año de construcción:</p>
                      <p className="font-medium">{policy.details.construction_year}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Beneficiarios (solo para seguro de vida) */}
              {policy.policy_type === "life" && policy.beneficiaries && policy.beneficiaries.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Beneficiarios</h3>
                  <div className="space-y-4">
                    {policy.beneficiaries.map((beneficiary, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-800">{beneficiary.name}</h4>
                          <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                            {beneficiary.percentage}%
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">
                          Relación: {getBeneficiaryRelationship(beneficiary.relationship)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reclamaciones */}
              {policy.claims && policy.claims.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Reclamaciones</h3>
                  <div className="space-y-4">
                    {policy.claims.map((claim, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-800">Reclamación #{claim.claim_number}</h4>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getClaimStatusClass(claim.status)}`}
                          >
                            {getClaimStatusLabel(claim.status)}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{claim.description}</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Fecha: {formatDate(claim.submission_date)}</span>
                          <span className="font-medium">{formatCurrency(claim.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pagos */}
              {policy.payments && policy.payments.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Historial de Pagos</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Fecha
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Método
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Estado
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Monto
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {policy.payments.map((payment, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(payment.payment_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {getPaymentMethodLabel(payment.payment_method)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusClass(payment.status)}`}
                              >
                                {getPaymentStatusLabel(payment.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                              {formatCurrency(payment.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="mt-8 flex justify-end space-x-4">
                {policy.status === "active" && (
                  <button
                    className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50"
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    Cancelar Póliza
                  </button>
                )}
                <button className="px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500" onClick={onClose}>
                  Cerrar
                </button>
              </div>
            </div>

            {/* Modal de confirmación de cancelación */}
            {showCancelConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirmar Cancelación</h3>
                  <p className="text-gray-600 mb-6">
                    ¿Estás seguro de que deseas cancelar esta póliza? Esta acción no se puede deshacer.
                  </p>
                  <div className="flex justify-end space-x-4">
                    <button
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      onClick={() => setShowCancelConfirm(false)}
                      disabled={cancelling}
                    >
                      No, Mantener Póliza
                    </button>
                    <button
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      onClick={handleCancelPolicy}
                      disabled={cancelling}
                    >
                      {cancelling ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Cancelando...
                        </span>
                      ) : (
                        "Sí, Cancelar Póliza"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Póliza no encontrada</h3>
            <p className="text-gray-600">No se encontraron detalles para esta póliza.</p>
            <button className="mt-4 px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500" onClick={onClose}>
              Cerrar
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// Función auxiliar para obtener el nombre legible de la relación del beneficiario
function getBeneficiaryRelationship(relationship) {
  const relationshipNames = {
    spouse: "Cónyuge",
    child: "Hijo/a",
    parent: "Padre/Madre",
    sibling: "Hermano/a",
    other: "Otro",
  }
  return relationshipNames[relationship] || relationship
}

// Función auxiliar para obtener la clase CSS según el estado de la reclamación
function getClaimStatusClass(status) {
  const statusClasses = {
    submitted: "bg-blue-100 text-blue-600",
    under_review: "bg-yellow-100 text-yellow-600",
    approved: "bg-green-100 text-green-600",
    rejected: "bg-red-100 text-red-600",
    paid: "bg-purple-100 text-purple-600",
  }
  return statusClasses[status] || "bg-gray-100 text-gray-600"
}

// Función auxiliar para obtener la etiqueta según el estado de la reclamación
function getClaimStatusLabel(status) {
  const statusLabels = {
    submitted: "Enviada",
    under_review: "En revisión",
    approved: "Aprobada",
    rejected: "Rechazada",
    paid: "Pagada",
  }
  return statusLabels[status] || "Desconocido"
}

// Función auxiliar para obtener la etiqueta según el método de pago
function getPaymentMethodLabel(method) {
  const methodLabels = {
    credit_card: "Tarjeta de crédito",
    debit_card: "Tarjeta de débito",
    bank_transfer: "Transferencia bancaria",
    cash: "Efectivo",
  }
  return methodLabels[method] || "Desconocido"
}

// Función auxiliar para obtener la clase CSS según el estado del pago
function getPaymentStatusClass(status) {
  const statusClasses = {
    pending: "bg-yellow-100 text-yellow-600",
    completed: "bg-green-100 text-green-600",
    failed: "bg-red-100 text-red-600",
    refunded: "bg-purple-100 text-purple-600",
  }
  return statusClasses[status] || "bg-gray-100 text-gray-600"
}

// Función auxiliar para obtener la etiqueta según el estado del pago
function getPaymentStatusLabel(status) {
  const statusLabels = {
    pending: "Pendiente",
    completed: "Completado",
    failed: "Fallido",
    refunded: "Reembolsado",
  }
  return statusLabels[status] || "Desconocido"
}

export default PolicyDetails
