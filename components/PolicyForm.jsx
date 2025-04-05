"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calendar, DollarSign, Shield, User, Users, Home, Car, AlertCircle } from "lucide-react"

function PolicyForm({ policyType, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    policy_type: policyType,
    start_date: getFormattedDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // Mañana
    end_date: getFormattedDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)), // Un año después
    premium: getPolicyDefaultPremium(policyType),
    coverage_amount: getPolicyDefaultCoverage(policyType),
    beneficiaries: [{ name: "", relationship: "", percentage: 100 }],
    // Campos específicos según el tipo de póliza
    details: getPolicyTypeSpecificFields(policyType),
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name.includes(".")) {
      // Manejar campos anidados (como details.address)
      const [parent, child] = name.split(".")
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      })
    } else {
      setFormData({
        ...formData,
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

  const handleBeneficiaryChange = (index, field, value) => {
    const updatedBeneficiaries = [...formData.beneficiaries]
    updatedBeneficiaries[index] = {
      ...updatedBeneficiaries[index],
      [field]: value,
    }

    setFormData({
      ...formData,
      beneficiaries: updatedBeneficiaries,
    })

    // Limpiar errores
    if (errors[`beneficiaries[${index}].${field}`]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[`beneficiaries[${index}].${field}`]
        return newErrors
      })
    }
  }

  const addBeneficiary = () => {
    // Verificar que no exceda el 100%
    const currentTotal = formData.beneficiaries.reduce((sum, b) => sum + Number(b.percentage || 0), 0)

    setFormData({
      ...formData,
      beneficiaries: [
        ...formData.beneficiaries,
        { name: "", relationship: "", percentage: Math.max(0, 100 - currentTotal) },
      ],
    })
  }

  const removeBeneficiary = (index) => {
    if (formData.beneficiaries.length <= 1) return

    const updatedBeneficiaries = formData.beneficiaries.filter((_, i) => i !== index)

    // Redistribuir el porcentaje
    const removedPercentage = formData.beneficiaries[index].percentage || 0
    const remainingBeneficiaries = updatedBeneficiaries.length

    if (remainingBeneficiaries > 0 && removedPercentage > 0) {
      const additionalPercentage = removedPercentage / remainingBeneficiaries
      updatedBeneficiaries.forEach((b) => {
        b.percentage = Math.min(100, Number(b.percentage || 0) + additionalPercentage)
      })
    }

    setFormData({
      ...formData,
      beneficiaries: updatedBeneficiaries,
    })
  }

  const validateForm = () => {
    const newErrors = {}

    // Validar fechas
    if (!formData.start_date) {
      newErrors.start_date = "La fecha de inicio es requerida"
    }

    if (!formData.end_date) {
      newErrors.end_date = "La fecha de fin es requerida"
    } else if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      newErrors.end_date = "La fecha de fin debe ser posterior a la fecha de inicio"
    }

    // Validar prima y cobertura
    if (!formData.premium) {
      newErrors.premium = "La prima es requerida"
    } else if (isNaN(formData.premium) || Number(formData.premium) <= 0) {
      newErrors.premium = "La prima debe ser un número positivo"
    }

    if (!formData.coverage_amount) {
      newErrors.coverage_amount = "El monto de cobertura es requerido"
    } else if (isNaN(formData.coverage_amount) || Number(formData.coverage_amount) <= 0) {
      newErrors.coverage_amount = "El monto de cobertura debe ser un número positivo"
    }

    // Validar beneficiarios
    if (policyType === "life") {
      let totalPercentage = 0

      formData.beneficiaries.forEach((beneficiary, index) => {
        if (!beneficiary.name) {
          newErrors[`beneficiaries[${index}].name`] = "El nombre del beneficiario es requerido"
        }

        if (!beneficiary.relationship) {
          newErrors[`beneficiaries[${index}].relationship`] = "La relación del beneficiario es requerida"
        }

        if (!beneficiary.percentage) {
          newErrors[`beneficiaries[${index}].percentage`] = "El porcentaje del beneficiario es requerido"
        } else if (
          isNaN(beneficiary.percentage) ||
          Number(beneficiary.percentage) <= 0 ||
          Number(beneficiary.percentage) > 100
        ) {
          newErrors[`beneficiaries[${index}].percentage`] = "El porcentaje debe ser un número entre 1 y 100"
        }

        totalPercentage += Number(beneficiary.percentage || 0)
      })

      if (Math.abs(totalPercentage - 100) > 0.01) {
        newErrors.beneficiaries = "La suma de los porcentajes debe ser exactamente 100%"
      }
    }

    // Validar campos específicos según el tipo de póliza
    if (policyType === "auto") {
      if (!formData.details.make) {
        newErrors["details.make"] = "La marca del vehículo es requerida"
      }
      if (!formData.details.model) {
        newErrors["details.model"] = "El modelo del vehículo es requerido"
      }
      if (!formData.details.year) {
        newErrors["details.year"] = "El año del vehículo es requerido"
      }
      if (!formData.details.license_plate) {
        newErrors["details.license_plate"] = "La matrícula es requerida"
      }
    } else if (policyType === "home") {
      if (!formData.details.address) {
        newErrors["details.address"] = "La dirección es requerida"
      }
      if (!formData.details.square_meters) {
        newErrors["details.square_meters"] = "Los metros cuadrados son requeridos"
      }
      if (!formData.details.construction_year) {
        newErrors["details.construction_year"] = "El año de construcción es requerido"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (validateForm()) {
      try {
        setIsLoading(true)

        // Formatear datos para enviar al servidor
        const formattedData = {
          ...formData,
          premium: Number(formData.premium),
          coverage_amount: Number(formData.coverage_amount),
          beneficiaries:
            policyType === "life"
              ? formData.beneficiaries.map((b) => ({
                  ...b,
                  percentage: Number(b.percentage),
                }))
              : [],
        }

        // Llamar a la función onSubmit pasada como prop
        onSubmit(formattedData)
      } catch (error) {
        console.error("Error al procesar el formulario:", error)
        setErrors({
          form: error.message || "Error al procesar el formulario",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="bg-white rounded-lg">
      <form onSubmit={handleSubmit}>
        {/* Error general del formulario */}
        {errors.form && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-600">{errors.form}</p>
          </div>
        )}

        <div className="grid gap-6 mb-6 md:grid-cols-2">
          {/* Fechas de vigencia */}
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de inicio
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                min={getFormattedDate(new Date())}
                className={`block w-full pl-10 pr-3 py-2 border ${
                  errors.start_date ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
                disabled={isLoading}
              />
            </div>
            {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>}
          </div>

          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de fin
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                min={formData.start_date}
                className={`block w-full pl-10 pr-3 py-2 border ${
                  errors.end_date ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
                disabled={isLoading}
              />
            </div>
            {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>}
          </div>

          {/* Prima y cobertura */}
          <div>
            <label htmlFor="premium" className="block text-sm font-medium text-gray-700 mb-1">
              Prima mensual (€)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                id="premium"
                name="premium"
                value={formData.premium}
                onChange={handleChange}
                min="1"
                step="0.01"
                className={`block w-full pl-10 pr-3 py-2 border ${
                  errors.premium ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
                disabled={isLoading}
              />
            </div>
            {errors.premium && <p className="mt-1 text-sm text-red-600">{errors.premium}</p>}
          </div>

          <div>
            <label htmlFor="coverage_amount" className="block text-sm font-medium text-gray-700 mb-1">
              Monto de cobertura (€)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Shield className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                id="coverage_amount"
                name="coverage_amount"
                value={formData.coverage_amount}
                onChange={handleChange}
                min="1000"
                step="1000"
                className={`block w-full pl-10 pr-3 py-2 border ${
                  errors.coverage_amount ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
                disabled={isLoading}
              />
            </div>
            {errors.coverage_amount && <p className="mt-1 text-sm text-red-600">{errors.coverage_amount}</p>}
          </div>

          {/* Campos específicos según el tipo de póliza */}
          {policyType === "auto" && (
            <>
              <div>
                <label htmlFor="details.make" className="block text-sm font-medium text-gray-700 mb-1">
                  Marca del vehículo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Car className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="details.make"
                    name="details.make"
                    value={formData.details.make}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors["details.make"] ? "border-red-500" : "border-gray-300"
                    } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
                    disabled={isLoading}
                  />
                </div>
                {errors["details.make"] && <p className="mt-1 text-sm text-red-600">{errors["details.make"]}</p>}
              </div>

              <div>
                <label htmlFor="details.model" className="block text-sm font-medium text-gray-700 mb-1">
                  Modelo del vehículo
                </label>
                <input
                  type="text"
                  id="details.model"
                  name="details.model"
                  value={formData.details.model}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 border ${
                    errors["details.model"] ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
                  disabled={isLoading}
                />
                {errors["details.model"] && <p className="mt-1 text-sm text-red-600">{errors["details.model"]}</p>}
              </div>

              <div>
                <label htmlFor="details.year" className="block text-sm font-medium text-gray-700 mb-1">
                  Año del vehículo
                </label>
                <input
                  type="number"
                  id="details.year"
                  name="details.year"
                  value={formData.details.year}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear()}
                  className={`block w-full px-3 py-2 border ${
                    errors["details.year"] ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
                  disabled={isLoading}
                />
                {errors["details.year"] && <p className="mt-1 text-sm text-red-600">{errors["details.year"]}</p>}
              </div>

              <div>
                <label htmlFor="details.license_plate" className="block text-sm font-medium text-gray-700 mb-1">
                  Matrícula
                </label>
                <input
                  type="text"
                  id="details.license_plate"
                  name="details.license_plate"
                  value={formData.details.license_plate}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 border ${
                    errors["details.license_plate"] ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
                  disabled={isLoading}
                />
                {errors["details.license_plate"] && (
                  <p className="mt-1 text-sm text-red-600">{errors["details.license_plate"]}</p>
                )}
              </div>
            </>
          )}

          {policyType === "home" && (
            <>
              <div className="md:col-span-2">
                <label htmlFor="details.address" className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección completa
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Home className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="details.address"
                    name="details.address"
                    value={formData.details.address}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors["details.address"] ? "border-red-500" : "border-gray-300"
                    } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
                    disabled={isLoading}
                  />
                </div>
                {errors["details.address"] && <p className="mt-1 text-sm text-red-600">{errors["details.address"]}</p>}
              </div>

              <div>
                <label htmlFor="details.square_meters" className="block text-sm font-medium text-gray-700 mb-1">
                  Metros cuadrados
                </label>
                <input
                  type="number"
                  id="details.square_meters"
                  name="details.square_meters"
                  value={formData.details.square_meters}
                  onChange={handleChange}
                  min="1"
                  className={`block w-full px-3 py-2 border ${
                    errors["details.square_meters"] ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
                  disabled={isLoading}
                />
                {errors["details.square_meters"] && (
                  <p className="mt-1 text-sm text-red-600">{errors["details.square_meters"]}</p>
                )}
              </div>

              <div>
                <label htmlFor="details.construction_year" className="block text-sm font-medium text-gray-700 mb-1">
                  Año de construcción
                </label>
                <input
                  type="number"
                  id="details.construction_year"
                  name="details.construction_year"
                  value={formData.details.construction_year}
                  onChange={handleChange}
                  min="1800"
                  max={new Date().getFullYear()}
                  className={`block w-full px-3 py-2 border ${
                    errors["details.construction_year"] ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
                  disabled={isLoading}
                />
                {errors["details.construction_year"] && (
                  <p className="mt-1 text-sm text-red-600">{errors["details.construction_year"]}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Beneficiarios (solo para seguro de vida) */}
        {policyType === "life" && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">Beneficiarios</h3>
              <motion.button
                type="button"
                className="text-[#B4C4AE] hover:text-[#a3b39d] text-sm font-medium"
                onClick={addBeneficiary}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isLoading}
              >
                + Añadir beneficiario
              </motion.button>
            </div>

            {errors.beneficiaries && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.beneficiaries}</p>
              </div>
            )}

            {formData.beneficiaries.map((beneficiary, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-medium text-gray-700">Beneficiario {index + 1}</h4>
                  {formData.beneficiaries.length > 1 && (
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700 text-sm"
                      onClick={() => removeBeneficiary(index)}
                      disabled={isLoading}
                    >
                      Eliminar
                    </button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label
                      htmlFor={`beneficiary-name-${index}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Nombre completo
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id={`beneficiary-name-${index}`}
                        value={beneficiary.name}
                        onChange={(e) => handleBeneficiaryChange(index, "name", e.target.value)}
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          errors[`beneficiaries[${index}].name`] ? "border-red-500" : "border-gray-300"
                        } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
                        disabled={isLoading}
                      />
                    </div>
                    {errors[`beneficiaries[${index}].name`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`beneficiaries[${index}].name`]}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor={`beneficiary-relationship-${index}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Parentesco
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Users className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id={`beneficiary-relationship-${index}`}
                        value={beneficiary.relationship}
                        onChange={(e) => handleBeneficiaryChange(index, "relationship", e.target.value)}
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          errors[`beneficiaries[${index}].relationship`] ? "border-red-500" : "border-gray-300"
                        } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
                        disabled={isLoading}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="spouse">Cónyuge</option>
                        <option value="child">Hijo/a</option>
                        <option value="parent">Padre/Madre</option>
                        <option value="sibling">Hermano/a</option>
                        <option value="other">Otro</option>
                      </select>
                    </div>
                    {errors[`beneficiaries[${index}].relationship`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`beneficiaries[${index}].relationship`]}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor={`beneficiary-percentage-${index}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Porcentaje (%)
                    </label>
                    <input
                      type="number"
                      id={`beneficiary-percentage-${index}`}
                      value={beneficiary.percentage}
                      onChange={(e) => handleBeneficiaryChange(index, "percentage", e.target.value)}
                      min="1"
                      max="100"
                      className={`block w-full px-3 py-2 border ${
                        errors[`beneficiaries[${index}].percentage`] ? "border-red-500" : "border-gray-300"
                      } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
                      disabled={isLoading}
                    />
                    {errors[`beneficiaries[${index}].percentage`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`beneficiaries[${index}].percentage`]}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-4 mt-6">
          <motion.button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
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
            {isLoading ? "Procesando..." : "Continuar al pago"}
          </motion.button>
        </div>
      </form>
    </div>
  )
}

// Función auxiliar para formatear fechas en formato YYYY-MM-DD
function getFormattedDate(date) {
  return date.toISOString().split("T")[0]
}

// Función auxiliar para obtener la prima predeterminada según el tipo de póliza
function getPolicyDefaultPremium(policyType) {
  const premiums = {
    auto: 299,
    home: 199,
    life: 149,
    health: 249,
    travel: 99,
    business: 399,
  }
  return premiums[policyType] || 199
}

// Función auxiliar para obtener la cobertura predeterminada según el tipo de póliza
function getPolicyDefaultCoverage(policyType) {
  const coverages = {
    auto: 50000,
    home: 150000,
    life: 100000,
    health: 300000,
    travel: 30000,
    business: 500000,
  }
  return coverages[policyType] || 100000
}

// Función auxiliar para obtener campos específicos según el tipo de póliza
function getPolicyTypeSpecificFields(policyType) {
  switch (policyType) {
    case "auto":
      return {
        make: "",
        model: "",
        year: new Date().getFullYear(),
        license_plate: "",
      }
    case "home":
      return {
        address: "",
        square_meters: 100,
        construction_year: 2000,
      }
    case "life":
      return {
        health_condition: "good",
      }
    case "health":
      return {
        has_preexisting_conditions: false,
      }
    case "travel":
      return {
        destination: "",
        travel_purpose: "tourism",
      }
    case "business":
      return {
        business_type: "",
        employees_count: 1,
      }
    default:
      return {}
  }
}

export default PolicyForm

