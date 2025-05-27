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

      // Validar datos requeridos
      if (!paymentData.policy_id) {
        throw new Error("El ID de la póliza es requerido")
      }
      if (!paymentData.amount || isNaN(paymentData.amount) || paymentData.amount <= 0) {
        throw new Error("El monto del pago es inválido")
      }
      if (!paymentData.payment_method) {
        throw new Error("El método de pago es requerido")
      }

      // Normalizar el método de pago
      const normalizePaymentMethod = (method) => {
        const methodMap = {
          credit_card: "credit_card",
          creditcard: "credit_card",
          "credit-card": "credit_card",
          tarjeta_credito: "credit_card",
          debit_card: "debit_card",
          debitcard: "debit_card",
          "debit-card": "debit_card",
          tarjeta_debito: "debit_card",
          bank_transfer: "bank_transfer",
          transfer: "bank_transfer",
          transferencia: "bank_transfer",
          cash: "cash",
          efectivo: "cash",
          paypal: "paypal",
          stripe: "stripe",
          mercado_pago: "mercado_pago",
        }

        const normalized = methodMap[method?.toLowerCase()] || "credit_card"
        console.log(`Método de pago normalizado: "${method}" -> "${normalized}"`)
        return normalized
      }

      // Asegurarse de que los datos tengan el formato correcto
      const formattedData = {
        policy_id: paymentData.policy_id,
        amount: Number.parseFloat(paymentData.amount),
        payment_date: paymentData.payment_date || new Date().toISOString(),
        payment_method: normalizePaymentMethod(paymentData.payment_method),
        transaction_id: paymentData.transaction_id || `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        status: paymentData.status || "completed",
        card_info: paymentData.card_info || null,
      }

      console.log("Datos formateados:", formattedData)

      // Intentar realizar el pago con reintentos
      const result = await retryApiCall(
        async () => {
          const response = await api.post("/payments", formattedData)

          // Validar la respuesta del backend
          if (!response.data || !response.data.payment || !response.data.payment.id) {
            throw new Error("La respuesta del servidor es inválida")
          }

          return response.data.payment
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
        }
      )

      console.log("Pago creado exitosamente:", result)
      return result
    } catch (error) {
      console.error("Error al crear el pago:", error)

      // Propagar errores específicos
      if (error.isAuthError || error.status === 401 || error.status === 403) {
        throw new Error("No tienes permiso para realizar esta operación")
      } else if (error.status === 404) {
        throw new Error("La póliza especificada no existe")
      } else if (error.status === 409) {
        throw new Error("El pago ya existe en el sistema")
      } else if (error.status === 422) {
        throw new Error("Los datos del pago son inválidos: " + (error.message || "Error de validación"))
      } else {
        throw new Error("Error al procesar el pago: " + (error.message || "Error del servidor"))
      }
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
