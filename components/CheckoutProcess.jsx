"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CreditCard, Calendar, Lock, Check, AlertCircle, User } from "lucide-react"
import { paymentService } from "../services/payment-service"

function CheckoutProcess({ policyData, onComplete, onCancel }) {
  const [paymentData, setPaymentData] = useState({
    card_number: "",
    card_holder: "",
    expiry_date: "",
    cvv: "",
    payment_method: "credit_card",
    save_card: false
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Resumen, 2: Pago

  const handleChange = (e) => {
    const { name, value } = e.target

    // Formatear número de tarjeta
    if (name === "card_number") {
      const formattedValue = value
        .replace(/\s/g, "")
        .replace(/\D/g, "")
        .replace(/(\d{4})(?=\d)/g, "$1 ")
        .trim()
        .slice(0, 19) // 16 dígitos + 3 espacios

      setPaymentData({
        ...paymentData,
        [name]: formattedValue,
      })
    }
    // Formatear fecha de expiración
    else if (name === "expiry_date") {
      const formattedValue = value
        .replace(/\s/g, "")
        .replace(/\D/g, "")
        .replace(/(\d{2})(?=\d)/g, "$1/")
        .trim()
        .slice(0, 5) // MM/YY

      setPaymentData({
        ...paymentData,
        [name]: formattedValue,
      })
    }
    // Formatear CVV
    else if (name === "cvv") {
      const formattedValue = value.replace(/\D/g, "").slice(0, 3)

      setPaymentData({
        ...paymentData,
        [name]: formattedValue,
      })
    } else {
      setPaymentData({
        ...paymentData,
        [name]: value,
      })
    }

    // Limpiar errores al escribir
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validatePaymentForm = () => {
    const newErrors = {}

    // Validar número de tarjeta
    if (!paymentData.card_number) {
      newErrors.card_number = "El número de tarjeta es requerido"
    } else if (paymentData.card_number.replace(/\s/g, "").length !== 16) {
      newErrors.card_number = "El número de tarjeta debe tener 16 dígitos"
    }

    // Validar titular de la tarjeta
    if (!paymentData.card_holder) {
      newErrors.card_holder = "El titular de la tarjeta es requerido"
    }

    // Validar fecha de expiración
    if (!paymentData.expiry_date) {
      newErrors.expiry_date = "La fecha de expiración es requerida"
    } else if (!/^\d{2}\/\d{2}$/.test(paymentData.expiry_date)) {
      newErrors.expiry_date = "Formato inválido. Use MM/YY"
    } else {
      const [month, year] = paymentData.expiry_date.split("/")
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear() % 100 // Últimos 2 dígitos
      const currentMonth = currentDate.getMonth() + 1 // 1-12

      if (Number.parseInt(month) < 1 || Number.parseInt(month) > 12) {
        newErrors.expiry_date = "Mes inválido"
      } else if (
        Number.parseInt(year) < currentYear ||
        (Number.parseInt(year) === currentYear && Number.parseInt(month) < currentMonth)
      ) {
        newErrors.expiry_date = "La tarjeta ha expirado"
      }
    }

    // Validar CVV
    if (!paymentData.cvv) {
      newErrors.cvv = "El código de seguridad es requerido"
    } else if (paymentData.cvv.length !== 3) {
      newErrors.cvv = "El código debe tener 3 dígitos"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!policyData || !policyData.id) {
      setErrors({
        form: "Error: No se puede procesar el pago sin los datos de la póliza"
      });
      return;
    }

    if (validatePaymentForm()) {
      try {
        setIsLoading(true)

        // Crear objeto de pago para la base de datos
        const paymentRecord = {
          policy_id: policyData.id,
          amount: policyData.premium * 1.21,
          payment_date: new Date().toISOString(),
          payment_method: paymentData.payment_method,
          transaction_id: `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          status: "completed",
          // Datos adicionales para referencia (estos no se guardan en la tabla payments)
          card_info: {
            last_four: paymentData.card_number.replace(/\s/g, "").slice(-4),
            expiry_date: paymentData.expiry_date,
            card_holder: paymentData.card_holder,
          },
        }

        console.log("Guardando pago en la base de datos:", paymentRecord)

        // Guardar el pago en la base de datos
        let paymentResult;
        try {
          paymentResult = await paymentService.createPayment(paymentRecord)
          if (!paymentResult || !paymentResult.id) {
            throw new Error("No se recibió una confirmación válida del pago")
          }
          console.log("Pago guardado exitosamente:", paymentResult)
        } catch (dbError) {
          console.error("Error al guardar el pago en la base de datos:", dbError)
          setErrors({
            form: "Error al procesar el pago: " + (dbError.message || "No se pudo guardar el pago")
          });
          return;
        }

        // Simular procesamiento de pago (para desarrollo)
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Llamar a la función onComplete pasada como prop
        onComplete({
          ...paymentData,
          // Eliminar espacios del número de tarjeta
          card_number: paymentData.card_number.replace(/\s/g, ""),
          // Añadir timestamp de la transacción
          transaction_date: new Date().toISOString(),
          transaction_id: paymentRecord.transaction_id,
          status: "completed",
        })
      } catch (error) {
        console.error("Error al procesar el pago:", error)
        setErrors({
          form: error.message || "Error al procesar el pago",
        })
      } finally {
        setIsLoading(false)
      }
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

  // Obtener nombre legible del tipo de póliza
  const getPolicyTypeName = (policyType) => {
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

  return (
    <div className="bg-white rounded-lg">
      {/* Pasos del checkout */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 1 ? "bg-blue-400 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              <span>1</span>
            </div>
            <div className="ml-2">
              <button
                onClick={() => setStep(1)}
                className={`text-sm font-medium ${step === 1 ? "text-gray-800" : "text-gray-500"}`}
              >
                Resumen
              </button>
            </div>
          </div>

          <div className="w-16 h-1 bg-gray-200">
            <div className={`h-full ${step >= 2 ? "bg-blue-400" : "bg-gray-200"}`}></div>
          </div>

          <div className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 2 ? "bg-blue-400 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              <span>2</span>
            </div>
            <div className="ml-2">
              <button
                onClick={() => setStep(2)}
                className={`text-sm font-medium ${step === 2 ? "text-gray-800" : "text-gray-500"}`}
              >
                Pago
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Paso 1: Resumen de la póliza */}
      {step === 1 && (
        <div>
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen de la póliza</h3>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Tipo de seguro:</span>
                <span className="font-medium">{getPolicyTypeName(policyData.policy_type)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Vigencia:</span>
                <span className="font-medium">
                  {new Date(policyData.start_date).toLocaleDateString("es-ES")} -{" "}
                  {new Date(policyData.end_date).toLocaleDateString("es-ES")}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Prima mensual:</span>
                <span className="font-medium">{formatCurrency(policyData.premium)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Cobertura:</span>
                <span className="font-medium">{formatCurrency(policyData.coverage_amount)}</span>
              </div>

              {/* Detalles específicos según el tipo de póliza */}
              {policyData.policy_type === "auto" && (
                <>
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="font-medium text-gray-800 mb-2">Detalles del vehículo</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-600">Marca:</span>
                        <p className="font-medium">{policyData.details.make}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Modelo:</span>
                        <p className="font-medium">{policyData.details.model}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Año:</span>
                        <p className="font-medium">{policyData.details.year}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Matrícula:</span>
                        <p className="font-medium">{policyData.details.license_plate}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {policyData.policy_type === "home" && (
                <>
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="font-medium text-gray-800 mb-2">Detalles de la vivienda</h4>
                    <div>
                      <span className="text-gray-600">Dirección:</span>
                      <p className="font-medium">{policyData.details.address}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <span className="text-gray-600">Metros cuadrados:</span>
                        <p className="font-medium">{policyData.details.square_meters} m²</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Año de construcción:</span>
                        <p className="font-medium">{policyData.details.construction_year}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Beneficiarios (solo para seguro de vida) */}
              {policyData.policy_type === "life" && policyData.beneficiaries.length > 0 && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="font-medium text-gray-800 mb-2">Beneficiarios</h4>
                  {policyData.beneficiaries.map((beneficiary, index) => (
                    <div key={index} className="mb-2 last:mb-0">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {beneficiary.name} ({getBeneficiaryRelationship(beneficiary.relationship)}):
                        </span>
                        <span className="font-medium">{beneficiary.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen de pago</h3>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Prima mensual:</span>
                <span className="font-medium">{formatCurrency(policyData.premium)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Impuestos (21%):</span>
                <span className="font-medium">{formatCurrency(policyData.premium * 0.21)}</span>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between">
                  <span className="text-gray-800 font-semibold">Total a pagar:</span>
                  <span className="text-gray-800 font-semibold">{formatCurrency(policyData.premium * 1.21)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <motion.button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCancel}
            >
              Cancelar
            </motion.button>
            <motion.button
              type="button"
              className="px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep(2)}
            >
              Continuar al pago
            </motion.button>
          </div>
        </div>
      )}

      {/* Paso 2: Formulario de pago */}
      {step === 2 && (
        <form onSubmit={handleSubmit}>
          {/* Error general del formulario */}
          {errors.form && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-600">{errors.form}</p>
            </div>
          )}

          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información de pago</h3>

            <div className="grid gap-6 mb-6 md:grid-cols-2">
              {/* Número de tarjeta */}
              <div className="md:col-span-2">
                <label htmlFor="card_number" className="block text-sm font-medium text-gray-700 mb-1">
                  Número de tarjeta
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="card_number"
                    name="card_number"
                    value={paymentData.card_number}
                    onChange={handleChange}
                    placeholder="1234 5678 9012 3456"
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.card_number ? "border-red-500" : "border-gray-300"
                    } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
                    disabled={isLoading}
                  />
                </div>
                {errors.card_number && <p className="mt-1 text-sm text-red-600">{errors.card_number}</p>}
              </div>

              {/* Titular de la tarjeta */}
              <div className="md:col-span-2">
                <label htmlFor="card_holder" className="block text-sm font-medium text-gray-700 mb-1">
                  Titular de la tarjeta
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="card_holder"
                    name="card_holder"
                    value={paymentData.card_holder}
                    onChange={handleChange}
                    placeholder="NOMBRE APELLIDOS"
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.card_holder ? "border-red-500" : "border-gray-300"
                    } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
                    disabled={isLoading}
                  />
                </div>
                {errors.card_holder && <p className="mt-1 text-sm text-red-600">{errors.card_holder}</p>}
              </div>

              {/* Fecha de expiración */}
              <div>
                <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de expiración
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="expiry_date"
                    name="expiry_date"
                    value={paymentData.expiry_date}
                    onChange={handleChange}
                    placeholder="MM/YY"
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.expiry_date ? "border-red-500" : "border-gray-300"
                    } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
                    disabled={isLoading}
                  />
                </div>
                {errors.expiry_date && <p className="mt-1 text-sm text-red-600">{errors.expiry_date}</p>}
              </div>

              {/* CVV */}
              <div>
                <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                  Código de seguridad (CVV)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="cvv"
                    name="cvv"
                    value={paymentData.cvv}
                    onChange={handleChange}
                    placeholder="123"
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.cvv ? "border-red-500" : "border-gray-300"
                    } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
                    disabled={isLoading}
                  />
                </div>
                {errors.cvv && <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>}
              </div>
            </div>

            <div className="flex items-center mt-4">
              <input
                id="save_card"
                name="save_card"
                type="checkbox"
                className="h-4 w-4 text-blue-400 focus:ring-blue-400 border-gray-300 rounded"
              />
              <label htmlFor="save_card" className="ml-2 block text-sm text-gray-700">
                Guardar esta tarjeta para futuros pagos
              </label>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen de pago</h3>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Prima mensual:</span>
                <span className="font-medium">{formatCurrency(policyData.premium)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Impuestos (21%):</span>
                <span className="font-medium">{formatCurrency(policyData.premium * 0.21)}</span>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between">
                  <span className="text-gray-800 font-semibold">Total a pagar:</span>
                  <span className="text-gray-800 font-semibold">{formatCurrency(policyData.premium * 1.21)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <motion.button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep(1)}
              disabled={isLoading}
            >
              Volver
            </motion.button>
            <motion.button
              type="submit"
              className={`px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500 ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </span>
              ) : (
                <span className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  Completar compra
                </span>
              )}
            </motion.button>
          </div>
        </form>
      )}
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

export default CheckoutProcess
