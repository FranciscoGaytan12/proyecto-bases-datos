"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react"
import { authService } from "./services/api"

function Register({ isOpen, onClose, onLoginClick }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState("")
  const [success, setSuccess] = useState(false)

  const validateForm = () => {
    const newErrors = {}

    if (!name.trim()) {
      newErrors.name = "El nombre es requerido"
    }

    if (!email) {
      newErrors.email = "El correo electrónico es requerido"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "El correo electrónico no es válido"
    }

    if (!password) {
      newErrors.password = "La contraseña es requerida"
    } else if (password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres"
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Limpiar errores previos
    setApiError("")
    setSuccess(false)

    if (validateForm()) {
      setIsLoading(true)

      try {
        // Llamar al servicio de registro
        const response = await authService.register({
          name,
          email,
          password,
        })

        console.log("Registro exitoso:", response)

        // Mostrar mensaje de éxito
        setSuccess(true)

        // Limpiar formulario
        setName("")
        setEmail("")
        setPassword("")
        setConfirmPassword("")

        // Después de 3 segundos, cerrar el modal de registro y abrir el de login
        setTimeout(() => {
          onClose()
          if (onLoginClick) onLoginClick()
        }, 3000)
      } catch (error) {
        console.error("Error al registrar:", error)

        // Mostrar detalles completos del error
        if (error.response) {
          // El servidor respondió con un código de estado fuera del rango 2xx
          console.error("Datos del error:", error.response.data)
          console.error("Estado HTTP:", error.response.status)
          console.error("Cabeceras:", error.response.headers)
          setApiError(
            error.response.data.message || error.response.data.error || "Error al registrar. Inténtalo de nuevo.",
          )
        } else if (error.request) {
          // La petición fue hecha pero no se recibió respuesta
          console.error("No se recibió respuesta del servidor:", error.request)
          setApiError("No se pudo conectar con el servidor. Verifica tu conexión a internet.")
        } else {
          // Algo ocurrió al configurar la petición
          console.error("Error de configuración:", error.message)
          setApiError("Error al procesar la solicitud: " + error.message)
        }
      } finally {
        setIsLoading(false)
      }
    }
  }

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
  }

  const modalVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: 0.1,
      },
    },
    exit: {
      opacity: 0,
      y: 50,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={overlayVariants}
        onClick={onClose}
      />

      <motion.div
        className="bg-white rounded-lg shadow-xl w-full max-w-md relative z-10 overflow-hidden"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalVariants}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Crear Cuenta</h2>
            <motion.button
              className="text-gray-500 hover:text-gray-700"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </motion.button>
          </div>

          {apiError && (
            <motion.div
              className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md flex items-start"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-600">{apiError}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-sm text-green-600">
                ¡Registro exitoso! Serás redirigido al inicio de sesión en unos segundos...
              </p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border ${errors.name ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:ring-[#B4C4AE] focus:border-[#B4C4AE]`}
                  placeholder="Juan Pérez"
                  disabled={isLoading || success}
                />
              </div>
              {errors.name && (
                <motion.p
                  className="mt-1 text-sm text-red-600"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errors.name}
                </motion.p>
              )}
            </div>

            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:ring-[#B4C4AE] focus:border-[#B4C4AE]`}
                  placeholder="tu@email.com"
                  disabled={isLoading || success}
                />
              </div>
              {errors.email && (
                <motion.p
                  className="mt-1 text-sm text-red-600"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errors.email}
                </motion.p>
              )}
            </div>

            <div>
              <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-10 pr-10 py-2 border ${errors.password ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:ring-[#B4C4AE] focus:border-[#B4C4AE]`}
                  placeholder="••••••••"
                  disabled={isLoading || success}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-500"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    disabled={isLoading || success}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </motion.button>
                </div>
              </div>
              {errors.password && (
                <motion.p
                  className="mt-1 text-sm text-red-600"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errors.password}
                </motion.p>
              )}
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border ${errors.confirmPassword ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:ring-[#B4C4AE] focus:border-[#B4C4AE]`}
                  placeholder="••••••••"
                  disabled={isLoading || success}
                />
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

            <div className="pt-2">
              <motion.button
                type="submit"
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoading || success ? "bg-[#cad6c5] cursor-not-allowed" : "bg-[#B4C4AE] hover:bg-[#a3b39d]"} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B4C4AE]`}
                whileHover={!isLoading && !success ? { scale: 1.02 } : {}}
                whileTap={!isLoading && !success ? { scale: 0.98 } : {}}
                disabled={isLoading || success}
              >
                {isLoading ? "Registrando..." : success ? "Registro Exitoso" : "Crear Cuenta"}
              </motion.button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">¿Ya tienes una cuenta?</span>
              </div>
            </div>

            <div className="mt-6">
              <motion.button
                type="button"
                className="w-full flex justify-center py-2 px-4 border border-[#B4C4AE] rounded-md shadow-sm text-sm font-medium text-[#B4C4AE] bg-white hover:bg-[#f0f4ee] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B4C4AE]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onClose()
                  if (onLoginClick) onLoginClick()
                }}
                disabled={isLoading}
              >
                Iniciar Sesión
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Register

