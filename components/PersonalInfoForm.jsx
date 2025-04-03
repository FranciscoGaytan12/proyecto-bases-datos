"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { User, Mail, Phone, MapPin, Calendar, Briefcase } from "lucide-react"

function PersonalInfoForm({ user, onSubmit }) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    birthdate: user?.birthdate || "",
    occupation: user?.occupation || "",
  })

  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setIsLoading(true)
      await onSubmit(formData)
      setIsEditing(false)
    } catch (error) {
      console.error("Error al actualizar información:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // Restaurar datos originales
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      birthdate: user?.birthdate || "",
      occupation: user?.occupation || "",
    })
    setIsEditing(false)
  }

  return (
    <div className="bg-white rounded-lg">
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 mb-6 md:grid-cols-2">
          {/* Nombre */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing || isLoading}
                className={`block w-full pl-10 pr-3 py-2 border ${
                  isEditing ? "border-[#B4C4AE]" : "border-gray-200 bg-gray-50"
                } rounded-md shadow-sm focus:ring-[#B4C4AE] focus:border-[#B4C4AE]`}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={true} // Email no se puede editar
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 bg-gray-50 rounded-md shadow-sm"
              />
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing || isLoading}
                className={`block w-full pl-10 pr-3 py-2 border ${
                  isEditing ? "border-[#B4C4AE]" : "border-gray-200 bg-gray-50"
                } rounded-md shadow-sm focus:ring-[#B4C4AE] focus:border-[#B4C4AE]`}
              />
            </div>
          </div>

          {/* Fecha de nacimiento */}
          <div>
            <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Nacimiento
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                id="birthdate"
                name="birthdate"
                value={formData.birthdate}
                onChange={handleChange}
                disabled={!isEditing || isLoading}
                className={`block w-full pl-10 pr-3 py-2 border ${
                  isEditing ? "border-[#B4C4AE]" : "border-gray-200 bg-gray-50"
                } rounded-md shadow-sm focus:ring-[#B4C4AE] focus:border-[#B4C4AE]`}
              />
            </div>
          </div>

          {/* Ocupación */}
          <div>
            <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">
              Ocupación
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Briefcase className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="occupation"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                disabled={!isEditing || isLoading}
                className={`block w-full pl-10 pr-3 py-2 border ${
                  isEditing ? "border-[#B4C4AE]" : "border-gray-200 bg-gray-50"
                } rounded-md shadow-sm focus:ring-[#B4C4AE] focus:border-[#B4C4AE]`}
              />
            </div>
          </div>

          {/* Dirección - ocupa todo el ancho */}
          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEditing || isLoading}
                className={`block w-full pl-10 pr-3 py-2 border ${
                  isEditing ? "border-blue-400" : "border-gray-200 bg-gray-50"
                } rounded-md shadow-sm focus:ring-[#B4C4AE] focus:border-[#B4C4AE]`}
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-4 mt-6">
          {isEditing ? (
            <>
              <motion.button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancelar
              </motion.button>
              <motion.button
                type="submit"
                className={`px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-700 ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                disabled={isLoading}
              >
                {isLoading ? "Guardando..." : "Guardar Cambios"}
              </motion.button>
            </>
          ) : (
            <motion.button
              type="button"
              className="px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-700"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsEditing(true)}
            >
              Editar Información
            </motion.button>
          )}
        </div>
      </form>
    </div>
  )
}

export default PersonalInfoForm

