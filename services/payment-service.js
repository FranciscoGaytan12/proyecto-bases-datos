// Servicio para manejar los pagos
import api from "./api"
import { retryApiCall } from "../backend/api-retry"

export const paymentService = {
  // Obtener todos los pagos del usuario
  getPayments: async () => {
    try {
      return await retryApiCall(
        async () => {
          const response = await api.get("/payments")
          return response.data.payments
        },
        {
          maxRetries: 2,
          shouldRetry: (error) => {
            return (
              error.status === 500 ||
              error.isServerError ||
              error.code === "NETWORK_ERROR" ||
              error.code === "ECONNABORTED" ||
              error.code === "NO_RESPONSE"
            )
          },
        },
      )
    } catch (error) {
      console.error("Error al obtener pagos después de reintentos:", error)

      // Si es un error de autenticación, propagar el error
      if (error.isAuthError || error.status === 401 || error.status === 403) {
        throw error
      }

      // Para otros errores, devolver un array vacío
      return []
    }
  },

  // Obtener detalles de un pago específico
  getPaymentDetails: async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}`)
      return response.data.payment
    } catch (error) {
      console.error("Error al obtener detalles del pago:", error)

      // Si es un error de autenticación, propagar el error
      if (error.isAuthError || error.status === 401 || error.status === 403) {
        throw error
      }

      // Para otros errores, propagar el error
      throw error
    }
  },

  // Crear un nuevo pago
  createPayment: async (paymentData) => {
    try {
      console.log("Creando nuevo pago:", paymentData)

      // Asegurarse de que los datos tengan el formato correcto
      const formattedData = {
        policy_id: paymentData.policy_id,
        amount: Number.parseFloat(paymentData.amount),
        payment_date: paymentData.payment_date || new Date().toISOString(),
        payment_method: paymentData.payment_method,
        transaction_id: paymentData.transaction_id || `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        status: paymentData.status || "completed",
        card_info: paymentData.card_info || null,
      }

      console.log("Datos formateados:", formattedData)

      const response = await api.post("/payments", formattedData)
      console.log("Respuesta del servidor:", response.data)
      return response.data
    } catch (error) {
      console.error("Error al crear pago:", error)
      console.error("Detalles del error:", error.response?.data || error.message)

      // Si es un error de autenticación, propagar el error
      if (error.isAuthError || error.status === 401 || error.status === 403) {
        throw error
      }

      // Para otros errores, propagar el error
      throw error
    }
  },

  // Actualizar estado de un pago
  updatePaymentStatus: async (paymentId, status) => {
    try {
      const response = await api.put(`/payments/${paymentId}/status`, { status })
      return response.data
    } catch (error) {
      console.error("Error al actualizar estado del pago:", error)

      // Si es un error de autenticación, propagar el error
      if (error.isAuthError || error.status === 401 || error.status === 403) {
        throw error
      }

      // Para otros errores, propagar el error
      throw error
    }
  },
}

export default paymentService
