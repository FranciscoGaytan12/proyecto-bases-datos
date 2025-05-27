"use client"

import { motion } from "framer-motion"
import { Shield, AlertTriangle, CheckCircle, Clock, Trash2 } from "lucide-react"
import { useState } from "react"
import PolicyDetails from "./PolicyDetails"
import { policyService } from "../services/api"

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

// Mapeo de tipos de póliza a nombres legibles
const policyTypeNames = {
  auto: "Automóvil",
  home: "Hogar",
  life: "Vida",
  health: "Salud",
  travel: "Viaje",
  business: "Negocio",
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

function PolicyCard({ policy, onPolicyUpdate, onPolicyDelete }) {
  const [showDetails, setShowDetails] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const status = statusConfig[policy.status] || statusConfig.active
  const StatusIcon = status.icon

  const handlePolicyCancelled = (policyId) => {
    // Actualizar el estado de la póliza localmente
    const updatedPolicy = { ...policyid, status: "cancelled" }

    // Notificar al componente padre
    if (onPolicyUpdate) {
      onPolicyUpdate(updatedPolicy)
    }

    // Cerrar el modal de detalles
    setShowDetails(false)
  }

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true)
      setDeleteError(null)

      // Llamar al servicio para eliminar la póliza
      await policyService.deletePolicy(policy.id)

      // Notificar al componente padre
      if (onPolicyDelete) {
        onPolicyDelete(policy.id)
      }

      // Cerrar el modal de confirmación
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error("Error al eliminar la póliza:", error)
      setDeleteError(error.message || "Error al eliminar la póliza")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setDeleteError(null)
  }

  return (
    <>
      <motion.div
        className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
        whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
        transition={{ duration: 0.2 }}
      >
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-blue-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">{policyTypeNames[policy.policy_type] || "Seguro"}</h3>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${status.color}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Número de póliza:</span>
              <span className="text-gray-800 text-sm font-medium">{policy.policy_number}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Vigencia:</span>
              <span className="text-gray-800 text-sm font-medium">
                {formatDate(policy.start_date)} - {formatDate(policy.end_date)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Prima:</span>
              <span className="text-gray-800 text-sm font-medium">{formatCurrency(policy.premium)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Cobertura:</span>
              <span className="text-gray-800 text-sm font-medium">{formatCurrency(policy.coverage_amount)}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-between">
            <motion.button
              className="text-blue-400 hover:text-blue-500 text-sm font-medium"
              whileHover={{ x: 3 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              onClick={() => setShowDetails(true)}
            >
              Ver detalles
            </motion.button>

            <div className="flex space-x-3">
              {policy.status === "active" && (
                <motion.button
                  className="text-red-500 hover:text-red-600 text-sm font-medium"
                  whileHover={{ x: 3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  onClick={() => setShowDetails(true)}
                >
                  Reportar siniestro
                </motion.button>
              )}

              <motion.button
                className="text-gray-500 hover:text-red-600 text-sm font-medium flex items-center"
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal de detalles de la póliza */}
      {showDetails && (
        <PolicyDetails
          policyId={policy.id}
          onClose={() => setShowDetails(false)}
          onPolicyCancelled={handlePolicyCancelled}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirmar Eliminación</h3>

            {deleteError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">{deleteError}</div>}

            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar esta póliza? Esta acción no se puede deshacer y eliminará todos los
              datos relacionados, incluyendo pagos y reclamaciones.
            </p>

            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                onClick={handleDeleteCancel}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Eliminando...
                  </span>
                ) : (
                  "Sí, Eliminar Póliza"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PolicyCard
