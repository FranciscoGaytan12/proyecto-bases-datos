"use client"

import { motion } from "framer-motion"
import { Shield, AlertTriangle, CheckCircle, Clock } from "lucide-react"

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
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
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

function PolicyCard({ policy }) {
  const status = statusConfig[policy.status] || statusConfig.pending
  const StatusIcon = status.icon

  return (
    <motion.div
      className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
      whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-[#B4C4AE] mr-2" />
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
            className="text-[#B4C4AE] hover:text-[#a3b39d] text-sm font-medium"
            whileHover={{ x: 3 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            Ver detalles
          </motion.button>

          {policy.status === "active" && (
            <motion.button
              className="text-red-500 hover:text-red-600 text-sm font-medium"
              whileHover={{ x: 3 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              Reportar siniestro
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default PolicyCard

