"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Mail, Lock, Eye, EyeOff, AlertCircle, AlertTriangle, Loader } from "lucide-react"
import { authService } from "../services/api"
import api from "../services/api"

function Login({ isOpen, onClose, onRegisterClick, onLoginSuccess }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState("")
  const [apiErrorType, setApiErrorType] = useState("")
  const [loginAttempts, setLoginAttempts] = useState(0)

  // Limpiar errores cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setApiError("")
      setApiErrorType("")
      setErrors({})
    }
  }, [isOpen])

  const validateForm = () => {
    const newErrors = {}

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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Limpiar errores previos
    setApiError("")
    setApiErrorType("")

    if (validateForm()) {
      setIsLoading(true)

      try {
        // Incrementar contador de intentos
        setLoginAttempts((prev) => prev + 1)

        // Limpiar cualquier token anterior
        authService.logout()

        // Llamar al servicio de autenticación
        const response = await authService.login(email, password)
        console.log("Inicio de sesión exitoso:", response)

        // Verificar explícitamente si el usuario es administrador
        let isAdmin = false
        try {
          const adminCheckResponse = await api.get("/diagnostic/check-admin", {
            headers: {
              Authorization: `Bearer ${response.token}`,
            },
          })
          console.log("Verificación de admin después de login:", adminCheckResponse.data)
          isAdmin = adminCheckResponse.data.isAdmin

          // Si el usuario es admin pero no tiene el rol en el objeto user, actualizarlo
          if (isAdmin && response.user && response.user.role !== "admin") {
            response.user.role = "admin"
            // Actualizar en localStorage
            localStorage.setItem("user", JSON.stringify(response.user))
            console.log("Usuario actualizado como admin en localStorage después de login")
          }
        } catch (adminError) {
          console.error("Error al verificar si es admin después de login:", adminError)
        }

        // Si se seleccionó "Recordarme", podríamos guardar alguna preferencia aquí

        // Llamar al callback de éxito si existe
        if (typeof onLoginSuccess === "function") {
          onLoginSuccess({
            ...response,
            user: {
              ...response.user,
              role: isAdmin ? "admin" : response.user.role || "user",
            },
          })
        }

        // Cerrar el modal
        onClose()

        // Disparar un evento personalizado para notificar que el usuario ha iniciado sesión
        const event = new CustomEvent("userLoggedIn", {
          detail: {
            user: response.user,
            isAdmin: isAdmin,
          },
        })
        window.dispatchEvent(event)

        // Recargar la página o redirigir al usuario
        // Usamos setTimeout para evitar problemas con la actualización del estado
        setTimeout(() => {
          window.location.href = "/"
        }, 500)
      } catch (error) {
        console.error("Error al iniciar sesión:", error)

        // Mostrar mensaje de error detallado
        let errorMessage = "Error al iniciar sesión. Inténtalo de nuevo."
        let errorType = "general"

        if (error && typeof error === "object") {
          if (error.message) {
            errorMessage = error.message
          }

          // Determinar el tipo de error
          if (error.status === 404 || error.isNotFoundError) {
            errorType = "notFound"
            errorMessage = "El servicio de inicio de sesión no está disponible. Verifica la configuración del servidor."
          } else if (error.status === 401 || error.isAuthError) {
            errorType = "auth"
            errorMessage = "Credenciales incorrectas. Por favor, verifica tu email y contraseña."
          } else if (error.code) {
            // Mensajes específicos según el código de error
            switch (error.code) {
              case "ECONNABORTED":
                errorType = "connection"
                errorMessage = "La conexión con el servidor ha expirado. Verifica que el servidor esté respondiendo."
                break
              case "NETWORK_ERROR":
                errorType = "connection"
                errorMessage = "Error de red. Verifica tu conexión a internet."
                break
              case "NO_RESPONSE":
                errorType = "connection"
                errorMessage = "No se recibió respuesta del servidor. Verifica que el backend esté en ejecución."
                break
              case "INVALID_URL":
                errorType = "config"
                errorMessage = "La URL de la API es inválida. Contacta al administrador."
                break
              case "API_STRUCTURE_ERROR":
                errorType = "config"
                errorMessage = "La estructura de la API es incorrecta. Verifica la configuración del servidor."
                break
              default:
                errorType = "general"
                errorMessage = `Error: ${error.code || "desconocido"}`
            }
          }
        } else if (typeof error === "string") {
          errorMessage = error
        }

        // Si hay muchos intentos fallidos, sugerir verificar la URL de la API
        if (loginAttempts >= 3) {
          if (errorType === "notFound" || errorType === "connection" || errorType === "config") {
            errorMessage += " Parece que hay un problema con la configuración del servidor. Contacta al administrador."
          }
        }

        setApiError(errorMessage)
        setApiErrorType(errorType)
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

  // Función para renderizar el icono de error según el tipo
  const renderErrorIcon = () => {
    switch (apiErrorType) {
      case "notFound":
      case "connection":
      case "config":
        return <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
      case "auth":
      default:
        return <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
    }
  }

  // Función para obtener la clase de color según el tipo de error
  const getErrorClass = () => {
    switch (apiErrorType) {
      case "notFound":
      case "connection":
      case "config":
        return "bg-amber-50 border-amber-200 text-amber-700"
      case "auth":
      default:
        return "bg-red-50 border-red-200 text-red-600"
    }
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
            <h2 className="text-2xl font-bold text-gray-800">Iniciar Sesión</h2>
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
              className={`mb-6 p-3 border rounded-md flex items-start ${getErrorClass()}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {renderErrorIcon()}
              <p className="text-sm">{apiError}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
                  placeholder="tu@email.com"
                  disabled={isLoading}
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-10 pr-10 py-2 border ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-500"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    disabled={isLoading}
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

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-400 focus:ring-blue-400 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Recordarme
                </label>
              </div>

              <motion.a
                href="#"
                className="text-sm font-medium text-blue-400 hover:text-blue-500"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ¿Olvidaste tu contraseña?
              </motion.a>
            </div>

            <div>
              <motion.button
                type="submit"
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-400 hover:bg-blue-500"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400`}
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                    <span>Iniciando sesión...</span>
                  </div>
                ) : (
                  "Iniciar Sesión"
                )}
              </motion.button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">¿No tienes una cuenta?</span>
              </div>
            </div>

            <div className="mt-6">
              <motion.button
                type="button"
                className="w-full flex justify-center py-2 px-4 border border-blue-400 rounded-md shadow-sm text-sm font-medium text-blue-400 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
                onClick={() => {
                  onClose()
                  if (onRegisterClick) onRegisterClick()
                }}
              >
                Crear una cuenta
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
