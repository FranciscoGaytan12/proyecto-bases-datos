"use client"

import { useState, useEffect } from "react"
import { paymentService } from "../services/payment-service"
import { CreditCard, Download, AlertCircle, RefreshCw } from "lucide-react"

function PaymentHistory() {
  const [payments, setPayments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await paymentService.getPayments()
      setPayments(data)
    } catch (error) {
      console.error("Error al cargar pagos:", error)
      setError(error.message || "Error al cargar el historial de pagos")
    } finally {
      setIsLoading(false)
    }
  }

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Formatear fecha
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
    return new Date(dateString).toLocaleDateString("es-ES", options)
  }

  // Obtener clase de color según el estado del pago
  const getStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "refunded":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Obtener texto según el estado del pago
  const getStatusText = (status) => {
    const statusTexts = {
      completed: "Completado",
      pending: "Pendiente",
      failed: "Fallido",
      refunded: "Reembolsado",
    }
    return statusTexts[status] || status
  }

  // Obtener texto según el método de pago
  const getPaymentMethodText = (method) => {
    const methodTexts = {
      credit_card: "Tarjeta de crédito",
      debit_card: "Tarjeta de débito",
      bank_transfer: "Transferencia bancaria",
      cash: "Efectivo",
    }
    return methodTexts[method] || method
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Historial de pagos</h2>
          <button
            onClick={loadPayments}
            className="flex items-center text-sm text-blue-500 hover:text-blue-600"
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualizar
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 flex justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <p className="mt-2 text-gray-500">Cargando pagos...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 flex justify-center">
          <div className="bg-red-50 p-4 rounded-md flex items-start max-w-md">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-600">{error}</p>
              <button onClick={loadPayments} className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium">
                Reintentar
              </button>
            </div>
          </div>
        </div>
      ) : payments.length === 0 ? (
        <div className="p-8 text-center">
          <CreditCard className="h-12 w-12 mx-auto text-gray-300" />
          <p className="mt-2 text-gray-500">No hay pagos registrados</p>
        </div>
      ) : (
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
                  Póliza
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Monto
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
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(payment.payment_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{payment.policy_number}</div>
                    <div className="text-sm text-gray-500">{payment.policy_type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {getPaymentMethodText(payment.payment_method)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                        payment.status,
                      )}`}
                    >
                      {getStatusText(payment.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      className="text-blue-500 hover:text-blue-700 flex items-center"
                      onClick={() => {
                        // Aquí iría la lógica para descargar el recibo
                        alert(`Descargando recibo para el pago #${payment.id}`)
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Recibo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default PaymentHistory
