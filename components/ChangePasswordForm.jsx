"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react"

function ChangePasswordForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Limpiar errores al escribir
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.currentPassword) {
      newErrors.currentPassword = "La contraseña actual es requerida"
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "La nueva contraseña es requerida"
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "La contraseña debe tener al menos 6 caracteres"
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (validateForm()) {
      try {
        setIsLoading(true)
        await onSubmit(formData)

        // Limpiar formulario después de éxito
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } catch (error) {
        console.error("Error al cambiar contraseña:", error)

        // Mostrar error específico si viene del servidor
        if (error.message) {
          setErrors((prev) => ({
            ...prev,
            server: error.message,
          }))
        }
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="bg-white rounded-lg">
      <form onSubmit={handleSubmit}>
        {/* Error del servidor */}
        {errors.server && (
          <motion.div
            className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md flex items-start"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-600">{errors.server}</p>
          </motion.div>
        )}

        <div className="space-y-6">
          {/* Contraseña actual */}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña Actual
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPasswords.currentPassword ? "text" : "password"}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                disabled={isLoading}
                className={`block w-full pl-10 pr-10 py-2 border ${
                  errors.currentPassword ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:ring-[#B4C4AE] focus:border-[#B4C4AE]`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <motion.button
                  type="button"
                  onClick={() => togglePasswordVisibility("currentPassword")}
                  className="text-gray-400 hover:text-gray-500"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={isLoading}
                >
                  {showPasswords.currentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </motion.button>
              </div>
            </div>
            {errors.currentPassword && (
              <motion.p
                className="mt-1 text-sm text-red-600"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errors.currentPassword}
              </motion.p>
            )}
          </div>

          {/* Nueva contraseña */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Nueva Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPasswords.newPassword ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                disabled={isLoading}
                className={`block w-full pl-10 pr-10 py-2 border ${
                  errors.newPassword ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:ring-[#B4C4AE] focus:border-[#B4C4AE]`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <motion.button
                  type="button"
                  onClick={() => togglePasswordVisibility("newPassword")}
                  className="text-gray-400 hover:text-gray-500"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={isLoading}
                >
                  {showPasswords.newPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </motion.button>
              </div>
            </div>
            {errors.newPassword && (
              <motion.p
                className="mt-1 text-sm text-red-600"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errors.newPassword}
              </motion.p>
            )}
          </div>

          {/* Confirmar nueva contraseña */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPasswords.confirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                className={`block w-full pl-10 pr-10 py-2 border ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:ring-[#B4C4AE] focus:border-[#B4C4AE]`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <motion.button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirmPassword")}
                  className="text-gray-400 hover:text-gray-500"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={isLoading}
                >
                  {showPasswords.confirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </motion.button>
              </div>
            </div>
            {errors.confirmPassword && (
              <motion.p
                className="mt-1 text-sm text-red-600"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errors.confirmPassword}
              </motion.p>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end mt-6">
          <motion.button
            type="submit"
            className={`px-4 py-2 bg-[#B4C4AE] text-white rounded-md hover:bg-[#a3b39d] ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            disabled={isLoading}
          >
            {isLoading ? "Cambiando..." : "Cambiar Contraseña"}
          </motion.button>
        </div>
      </form>
    </div>
  )
}

export default ChangePasswordForm

