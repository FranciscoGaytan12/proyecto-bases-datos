"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Calendar, FileText, AlertCircle, Camera, X, Check } from "lucide-react"
import { policyService } from "../services/api"
import { handleApiError } from "../backend/error-handler"

const ClaimForm = ({ onSubmitSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    policy_id: "",
    incident_date: getFormattedDate(new Date()),
    description: "",
    incident_type: "accident",
    location: "",
    estimated_amount: "",
    contact_phone: "",
    additional_info: "",
  })

  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [photos, setPhotos] = useState([])
  const [validationErrors, setValidationErrors] = useState({})

  // Cargar las pólizas del usuario
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoading(true)
        setError(null)
        const userPolicies = await policyService.getPolicies()

        // Filtrar solo pólizas activas
        const activePolicies = userPolicies.filter((policy) => policy.status === "active")

        setPolicies(activePolicies)

        // Seleccionar la primera póliza por defecto si existe
        if (activePolicies.length > 0) {
          setFormData((prev) => ({
            ...prev,
            policy_id: activePolicies[0].id.toString(),
          }))
        }
      } catch (err) {
        handleApiError(err, setError, setLoading)
      } finally {
        setLoading(false)
      }
    }

    fetchPolicies()
  }, [])

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Limpiar error de validación cuando el usuario escribe
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: null,
      }))
    }
  }

  // Manejar subida de fotos
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files)

    // Validar que sean imágenes y no excedan 5MB
    const validFiles = files.filter((file) => {
      const isValid = file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024
      return isValid
    })

    if (validFiles.length < files.length) {
      setError("Algunas imágenes fueron ignoradas. Asegúrate de que sean archivos de imagen y no excedan 5MB.")
    }

    // Convertir a objetos URL para previsualización
    const newPhotos = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }))

    setPhotos((prev) => [...prev, ...newPhotos])
  }

  // Eliminar una foto
  const handleRemovePhoto = (index) => {
    setPhotos((prev) => {
      const newPhotos = [...prev]
      // Liberar URL de objeto para evitar fugas de memoria
      URL.revokeObjectURL(newPhotos[index].preview)
      newPhotos.splice(index, 1)
      return newPhotos
    })
  }

  // Validar el formulario
  const validateForm = () => {
    const errors = {}

    if (!formData.policy_id) {
      errors.policy_id = "Debes seleccionar una póliza"
    }

    if (!formData.incident_date) {
      errors.incident_date = "La fecha del incidente es requerida"
    } else {
      const incidentDate = new Date(formData.incident_date)
      const today = new Date()

      if (incidentDate > today) {
        errors.incident_date = "La fecha del incidente no puede ser en el futuro"
      }
    }

    if (!formData.description.trim()) {
      errors.description = "La descripción del incidente es requerida"
    } else if (formData.description.length < 20) {
      errors.description = "La descripción debe tener al menos 20 caracteres"
    }

    if (!formData.incident_type) {
      errors.incident_type = "El tipo de incidente es requerido"
    }

    if (!formData.location.trim()) {
      errors.location = "La ubicación del incidente es requerida"
    }

    if (!formData.estimated_amount) {
      errors.estimated_amount = "El monto estimado es requerido"
    } else if (isNaN(formData.estimated_amount) || Number(formData.estimated_amount) <= 0) {
      errors.estimated_amount = "El monto debe ser un número positivo"
    }

    if (formData.contact_phone && !/^\+?[0-9]{8,15}$/.test(formData.contact_phone)) {
      errors.contact_phone = "Ingresa un número de teléfono válido"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      // Desplazar a la primera sección con error
      const firstErrorField = Object.keys(validationErrors)[0]
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`)
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      // Preparar datos para enviar
      const claimData = {
        ...formData,
        policy_id: Number.parseInt(formData.policy_id),
        estimated_amount: Number.parseFloat(formData.estimated_amount),
        incident_date: formData.incident_date,
      }

      // Si hay fotos, prepararlas para envío
      if (photos.length > 0) {
        // En un entorno real, aquí se implementaría la lógica para subir las fotos
        // Por ahora, solo agregamos los nombres de archivo
        claimData.photos = photos.map((photo) => photo.name)
      }

      // Enviar datos al servidor
      const response = await policyService.createClaim(claimData.policy_id, claimData)

      console.log("Siniestro registrado:", response)
      setSuccess(true)

      // Limpiar formulario después de envío exitoso
      setTimeout(() => {
        if (onSubmitSuccess) {
          onSubmitSuccess(response)
        }
      }, 2000)
    } catch (err) {
      handleApiError(err, setError, setSubmitting)
      console.error("Error al registrar siniestro:", err)
    } finally {
      setSubmitting(false)
    }
  }

  // Si el formulario se envió con éxito
  if (success) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Siniestro Registrado!</h2>
          <p className="text-gray-600 mb-6">
            Tu siniestro ha sido registrado exitosamente. Nos pondremos en contacto contigo pronto para continuar con el
            proceso.
          </p>
          <motion.button
            onClick={onSubmitSuccess}
            className="px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Volver al Dashboard
          </motion.button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Registrar Nuevo Siniestro</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Selección de póliza */}
          <div className="mb-6">
            <label htmlFor="policy_id" className="block text-sm font-medium text-gray-700 mb-1">
              Póliza asociada <span className="text-red-500">*</span>
            </label>
            {policies.length > 0 ? (
              <select
                id="policy_id"
                name="policy_id"
                value={formData.policy_id}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${
                  validationErrors.policy_id ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
                disabled={submitting}
              >
                <option value="">Selecciona una póliza</option>
                {policies.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    {policy.policy_number} - {getPolicyTypeName(policy.policy_type)}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-700">
                  No tienes pólizas activas. Debes tener al menos una póliza activa para registrar un siniestro.
                </p>
              </div>
            )}
            {validationErrors.policy_id && <p className="mt-1 text-sm text-red-600">{validationErrors.policy_id}</p>}
          </div>

          {/* Fecha del incidente */}
          <div className="mb-6">
            <label htmlFor="incident_date" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha del incidente <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                id="incident_date"
                name="incident_date"
                value={formData.incident_date}
                onChange={handleChange}
                max={getFormattedDate(new Date())}
                className={`block w-full pl-10 pr-3 py-2 border ${
                  validationErrors.incident_date ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
                disabled={submitting}
              />
            </div>
            {validationErrors.incident_date && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.incident_date}</p>
            )}
          </div>

          {/* Tipo de incidente */}
          <div className="mb-6">
            <label htmlFor="incident_type" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de incidente <span className="text-red-500">*</span>
            </label>
            <select
              id="incident_type"
              name="incident_type"
              value={formData.incident_type}
              onChange={handleChange}
              className={`block w-full px-3 py-2 border ${
                validationErrors.incident_type ? "border-red-500" : "border-gray-300"
              } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
              disabled={submitting}
            >
              <option value="accident">Accidente</option>
              <option value="theft">Robo</option>
              <option value="damage">Daño material</option>
              <option value="fire">Incendio</option>
              <option value="flood">Inundación</option>
              <option value="health">Problema de salud</option>
              <option value="other">Otro</option>
            </select>
            {validationErrors.incident_type && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.incident_type}</p>
            )}
          </div>

          {/* Descripción del incidente */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción detallada <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe con detalle lo ocurrido..."
              className={`block w-full px-3 py-2 border ${
                validationErrors.description ? "border-red-500" : "border-gray-300"
              } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
              disabled={submitting}
            ></textarea>
            {validationErrors.description ? (
              <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Mínimo 20 caracteres. Incluye todos los detalles relevantes del incidente.
              </p>
            )}
          </div>

          {/* Ubicación */}
          <div className="mb-6">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación del incidente <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Dirección o lugar donde ocurrió"
              className={`block w-full px-3 py-2 border ${
                validationErrors.location ? "border-red-500" : "border-gray-300"
              } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
              disabled={submitting}
            />
            {validationErrors.location && <p className="mt-1 text-sm text-red-600">{validationErrors.location}</p>}
          </div>

          {/* Monto estimado */}
          <div className="mb-6">
            <label htmlFor="estimated_amount" className="block text-sm font-medium text-gray-700 mb-1">
              Monto estimado (€) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="estimated_amount"
              name="estimated_amount"
              value={formData.estimated_amount}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              className={`block w-full px-3 py-2 border ${
                validationErrors.estimated_amount ? "border-red-500" : "border-gray-300"
              } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
              disabled={submitting}
            />
            {validationErrors.estimated_amount && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.estimated_amount}</p>
            )}
          </div>

          {/* Teléfono de contacto */}
          <div className="mb-6">
            <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono de contacto
            </label>
            <input
              type="tel"
              id="contact_phone"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleChange}
              placeholder="+34 600 000 000"
              className={`block w-full px-3 py-2 border ${
                validationErrors.contact_phone ? "border-red-500" : "border-gray-300"
              } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
              disabled={submitting}
            />
            {validationErrors.contact_phone ? (
              <p className="mt-1 text-sm text-red-600">{validationErrors.contact_phone}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Número donde podamos contactarte para solicitar más información.
              </p>
            )}
          </div>

          {/* Información adicional */}
          <div className="mb-6">
            <label htmlFor="additional_info" className="block text-sm font-medium text-gray-700 mb-1">
              Información adicional
            </label>
            <textarea
              id="additional_info"
              name="additional_info"
              value={formData.additional_info}
              onChange={handleChange}
              rows={3}
              placeholder="Cualquier otra información relevante..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400"
              disabled={submitting}
            ></textarea>
          </div>

          {/* Subida de fotos */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Fotografías del incidente</label>

            <div className="mt-2 flex flex-wrap gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative">
                  <div className="h-24 w-24 rounded-md overflow-hidden border border-gray-300">
                    <img
                      src={photo.preview || "/placeholder.svg"}
                      alt={`Foto ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                    disabled={submitting}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {photos.length < 5 && (
                <label className="h-24 w-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Camera className="h-8 w-8 text-gray-400 mb-1" />
                    <p className="text-xs text-gray-500">Añadir</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={submitting}
                    multiple={photos.length < 4}
                  />
                </label>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">Puedes subir hasta 5 fotos (máx. 5MB cada una)</p>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4 mt-8">
            <motion.button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCancel}
              disabled={submitting}
            >
              Cancelar
            </motion.button>
            <motion.button
              type="submit"
              className={`px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500 flex items-center ${
                submitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: submitting ? 1 : 0.98 }}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Registrar Siniestro
                </>
              )}
            </motion.button>
          </div>
        </form>
      )}
    </div>
  )
}

// Función auxiliar para formatear fechas en formato YYYY-MM-DD
function getFormattedDate(date) {
  return date.toISOString().split("T")[0]
}

// Función auxiliar para obtener el nombre legible del tipo de póliza
function getPolicyTypeName(policyType) {
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

export default ClaimForm
