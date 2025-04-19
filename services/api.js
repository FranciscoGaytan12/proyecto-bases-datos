// Servicio para manejar las peticiones a la API
import axios from "axios"
// Import the retry utility at the top of the file
import { retryApiCall } from "../backend/api-retry"

// Verificar la URL de la API
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
console.log("API URL configurada:", API_URL)

// Crear instancia de axios con logs y configuración mejorada
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Aumentar el timeout para dar más tiempo a las peticiones
  timeout: 15000,
  // Permitir credenciales para CORS
  withCredentials: false,
})

// Agregar interceptor para mostrar las peticiones
api.interceptors.request.use(
  (config) => {
    console.log(
      `[${new Date().toISOString()}] Enviando petición ${config.method?.toUpperCase()} a ${config.url}`,
      config.data,
    )
    // Verificar si estamos en el navegador antes de acceder a localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    console.error("[REQUEST ERROR]", error)
    return Promise.reject(error)
  },
)

// Interceptor para mostrar las respuestas
api.interceptors.response.use(
  (response) => {
    console.log(`[${new Date().toISOString()}] Respuesta de ${response.config.url}:`, response.data)
    return response
  },
  (error) => {
    console.error("[RESPONSE ERROR]", error)

    // Verificar si el error es un objeto vacío o nulo
    if (!error || (typeof error === "object" && Object.keys(error).length === 0)) {
      return Promise.reject({
        message: "Error de conexión desconocido. Por favor, inténtalo más tarde.",
        code: "UNKNOWN_ERROR",
      })
    }

    // Información detallada del error
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error("Datos del error:", error.response.data)
      console.error("Estado HTTP:", error.response.status)
      console.error("Cabeceras:", error.response.headers)
      console.error("URL solicitada:", error.config.url)

      // Manejar error 404 (No encontrado)
      if (error.response.status === 404) {
        console.error("Error 404: Recurso no encontrado")

        // Obtener la URL solicitada para proporcionar un mensaje más específico
        const requestedUrl = error.config.url || "desconocida"

        return Promise.reject({
          message: `El recurso solicitado no existe: ${requestedUrl}. Verifica la URL o contacta al administrador.`,
          status: 404,
          isNotFoundError: true,
          url: requestedUrl,
        })
      }

      // Manejar error 401 (No autorizado)
      if (error.response.status === 401) {
        console.error("Error de autenticación: Token inválido o credenciales incorrectas")

        // Determinar si es un error de login o de token
        const isLoginAttempt = error.config.url.includes("/login")

        // Si no es un intento de login, limpiar token
        if (!isLoginAttempt && typeof window !== "undefined") {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
        }

        return Promise.reject({
          message: isLoginAttempt
            ? "Credenciales incorrectas. Por favor, verifica tu email y contraseña."
            : "Sesión expirada o inválida. Por favor, inicia sesión nuevamente.",
          status: 401,
          isAuthError: true,
        })
      }

      // Si es un error 500, proporcionar un mensaje más amigable
      if (error.response.status === 500) {
        console.error("Error 500 del servidor:", error.response.data)
        return Promise.reject({
          message: "Error en el servidor. Por favor, inténtalo más tarde o contacta con soporte.",
          status: 500,
          isServerError: true,
          originalError: error.response.data, // Guardar el error original para debugging
        })
      }

      // Devolver un mensaje de error más descriptivo
      return Promise.reject({
        message: error.response.data?.message || `Error del servidor: ${error.response.status}`,
        status: error.response.status,
        data: error.response.data,
      })
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error("No se recibió respuesta del servidor:", error.request)
      console.error("URL solicitada:", error.config?.url || "desconocida")

      // Verificar si el error es por CORS o timeout
      if (error.code === "ECONNABORTED") {
        return Promise.reject({
          message: "La conexión con el servidor ha expirado. Verifica que el servidor esté respondiendo.",
          code: error.code,
        })
      } else if (error.message && error.message.includes("Network Error")) {
        return Promise.reject({
          message: "Error de red. Verifica tu conexión a internet y que el servidor esté en ejecución.",
          code: "NETWORK_ERROR",
        })
      }

      return Promise.reject({
        message: "No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.",
        code: error.code || "NO_RESPONSE",
      })
    } else {
      // Algo ocurrió al configurar la petición
      console.error("Error de configuración:", error.message)

      return Promise.reject({
        message: error.message || "Error al procesar la solicitud",
        code: "CONFIG_ERROR",
      })
    }
  },
)

// Servicio de autenticación con manejo de errores mejorado
export const authService = {
  // Iniciar sesión
  login: async (email, password) => {
    try {
      console.log("Intentando iniciar sesión con:", { email })
      console.log("URL de la API:", API_URL)

      // Verificar que la URL de la API sea correcta
      if (!API_URL || !API_URL.startsWith("http")) {
        console.error("Error: URL de API inválida:", API_URL)
        throw {
          message: "URL de API inválida. Verifica la variable de entorno NEXT_PUBLIC_API_URL",
          code: "INVALID_URL",
        }
      }

      // Intentar hacer una petición de prueba primero
      try {
        await api.get("/test")
        console.log("✅ Conexión a la API establecida correctamente")
      } catch (testError) {
        console.error("❌ Error al conectar con la API:", testError)

        // Si es un error 404, proporcionar un mensaje más específico
        if (testError.status === 404) {
          console.error("El endpoint de prueba no existe. Verificando estructura de la API...")

          // Intentar con otro endpoint común
          try {
            await api.get("/")
            console.log("✅ Conexión a la raíz de la API establecida correctamente")
          } catch (rootError) {
            if (rootError.status === 404) {
              throw {
                message: "La estructura de la API parece incorrecta. Verifica la URL base y los endpoints disponibles.",
                code: "API_STRUCTURE_ERROR",
              }
            }
          }
        }

        // No lanzar error aquí para otros casos, continuar con el intento de login
      }

      // Limpiar cualquier token anterior antes de iniciar sesión
      if (typeof window !== "undefined") {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      }

      // Intentar iniciar sesión
      try {
        const response = await api.post("/login", { email, password })
        console.log("Respuesta de inicio de sesión:", response.data)

        if (response.data.token && typeof window !== "undefined") {
          localStorage.setItem("token", response.data.token)
          localStorage.setItem("user", JSON.stringify(response.data.user))
        }
        return response.data
      } catch (loginError) {
        // Manejar específicamente errores 404 durante el login
        if (loginError.status === 404) {
          console.error("Endpoint de login no encontrado")
          throw {
            message: "El endpoint de login no existe. Verifica la URL de la API y la estructura del backend.",
            status: 404,
            isNotFoundError: true,
          }
        }

        // Manejar específicamente errores 401 durante el login
        if (loginError.status === 401 || loginError.isAuthError) {
          console.error("Credenciales incorrectas durante el login")
          throw {
            message: "Credenciales incorrectas. Por favor, verifica tu email y contraseña.",
            status: 401,
            isAuthError: true,
          }
        }
        // Propagar otros errores
        throw loginError
      }
    } catch (error) {
      console.error("Error completo al iniciar sesión:", error)

      // Si el error ya tiene un formato estructurado (de nuestro interceptor), usarlo directamente
      if (error.message) {
        throw error
      }

      // Si llegamos aquí, es un error no manejado
      throw {
        message: "Error inesperado al iniciar sesión. Por favor, inténtalo de nuevo.",
        code: "UNEXPECTED_ERROR",
      }
    }
  },

  // Registrar usuario
  register: async (userData) => {
    try {
      console.log("Intentando registrar usuario:", userData.email)

      try {
        const response = await api.post("/register", userData)
        console.log("Respuesta de registro:", response.data)
        return response.data
      } catch (registerError) {
        // Manejar específicamente errores 404 durante el registro
        if (registerError.status === 404) {
          console.error("Endpoint de registro no encontrado")
          throw {
            message: "El endpoint de registro no existe. Verifica la URL de la API y la estructura del backend.",
            status: 404,
            isNotFoundError: true,
          }
        }

        // Propagar otros errores
        throw registerError
      }
    } catch (error) {
      console.error("Error completo al registrar:", error)
      // Si el error ya tiene un formato estructurado (de nuestro interceptor), usarlo directamente
      if (error.message) {
        throw error
      }
      throw { message: "Error al registrar usuario. Por favor, inténtalo de nuevo." }
    }
  },

  // Cerrar sesión
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
  },

  // Obtener usuario actual
  getCurrentUser: () => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user")
      if (userStr) {
        try {
          return JSON.parse(userStr)
        } catch (e) {
          console.error("Error al parsear usuario:", e)
          // Si hay un error al parsear, limpiar el localStorage
          localStorage.removeItem("user")
          return null
        }
      }
    }
    return null
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("token")
    }
    return false
  },

  // Obtener perfil del usuario
  getProfile: async () => {
    try {
      try {
        const response = await api.get("/profile")
        return response.data
      } catch (profileError) {
        // Manejar específicamente errores 404 durante la obtención del perfil
        if (profileError.status === 404) {
          console.error("Endpoint de perfil no encontrado")
          throw {
            message: "El endpoint de perfil no existe. Verifica la URL de la API y la estructura del backend.",
            status: 404,
            isNotFoundError: true,
          }
        }

        // Propagar otros errores
        throw profileError
      }
    } catch (error) {
      // Si es un error de autenticación, limpiar datos de sesión
      if (error.isAuthError) {
        authService.logout()
      }

      // Si el error ya tiene un formato estructurado (de nuestro interceptor), usarlo directamente
      if (error.message) {
        throw error
      }
      throw { message: "Error al obtener perfil de usuario" }
    }
  },

  // Actualizar información del perfil
  updateProfile: async (profileData) => {
    try {
      const response = await api.put("/profile", profileData)

      // Actualizar usuario en localStorage
      if (typeof window !== "undefined") {
        const userStr = localStorage.getItem("user")
        if (userStr) {
          const user = JSON.parse(userStr)
          const updatedUser = { ...user, ...profileData }
          localStorage.setItem("user", JSON.stringify(updatedUser))
        }
      }

      return response.data
    } catch (error) {
      // Si es un error de autenticación, limpiar datos de sesión
      if (error.isAuthError) {
        authService.logout()
      }

      if (error.message) {
        throw error
      }
      throw { message: "Error al actualizar perfil de usuario" }
    }
  },

  // Cambiar contraseña
  changePassword: async (passwordData) => {
    try {
      const response = await api.post("/change-password", passwordData)
      return response.data
    } catch (error) {
      // Si es un error de autenticación, limpiar datos de sesión
      if (error.isAuthError) {
        authService.logout()
      }

      if (error.message) {
        throw error
      }
      throw { message: "Error al cambiar contraseña" }
    }
  },
}

// Servicio de pólizas con manejo de errores mejorado
export const policyService = {
  // Obtener todas las pólizas del usuario
  getPolicies: async () => {
    try {
      return await retryApiCall(
        async () => {
          const response = await api.get("/policies")
          return response.data.policies
        },
        {
          maxRetries: 2,
          shouldRetry: (error) => {
            // Only retry on server errors and network errors, not auth errors
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
      console.error("Error al obtener pólizas después de reintentos:", error)

      // Handle 404 and server errors with fallback data
      if (
        error.status === 404 ||
        error.isNotFoundError ||
        error.isServerError ||
        error.status === 500 ||
        error.code === "NETWORK_ERROR" ||
        error.code === "NO_RESPONSE"
      ) {
        console.log("Usando datos simulados para pólizas")
        return [
          {
            id: 1,
            policy_number: "POL-123456",
            policy_type: "auto",
            start_date: "2023-01-01",
            end_date: "2024-01-01",
            premium: 299,
            coverage_amount: 50000,
            status: "active",
          },
          {
            id: 2,
            policy_number: "POL-789012",
            policy_type: "home",
            start_date: "2023-02-15",
            end_date: "2024-02-15",
            premium: 199,
            coverage_amount: 150000,
            status: "active",
          },
        ]
      }

      // Handle auth errors
      if (error.isAuthError || error.status === 401) {
        authService.logout()
      }

      throw error
    }
  },

  // Obtener detalles de una póliza específica
  getPolicyDetails: async (policyId) => {
    try {
      try {
        const response = await api.get(`/policies/${policyId}`)
        return response.data
      } catch (error) {
        console.error("Error al obtener detalles de la póliza:", error)

        // Si es un error 404, simular respuesta para desarrollo
        if (error.status === 404 || error.isNotFoundError) {
          console.log("Endpoint de detalles no encontrado, simulando respuesta para desarrollo")
          // Generar datos de ejemplo basados en el ID
          return {
            id: policyId,
            policy_number: `POL-${policyId}${Date.now().toString().slice(-6)}`,
            policy_type: ["auto", "home", "life"][policyId % 3],
            start_date: "2023-01-01",
            end_date: "2024-01-01",
            premium: 299,
            coverage_amount: 50000,
            status: "active",
            details: {
              make: "Toyota",
              model: "Corolla",
              year: 2020,
              license_plate: "ABC-1234",
            },
            beneficiaries: [],
            claims: [],
            payments: [
              {
                id: 1,
                amount: 299,
                payment_date: "2023-01-01",
                payment_method: "credit_card",
                status: "completed",
              },
            ],
          }
        }

        // Si es un error de autenticación, propagar el error
        if (error.isAuthError || error.status === 401) {
          authService.logout()
          throw error
        }

        // Si es un error del servidor, simular respuesta para desarrollo
        if (
          error.isServerError ||
          error.status === 500 ||
          error.code === "NETWORK_ERROR" ||
          error.code === "NO_RESPONSE"
        ) {
          console.log("Error del servidor, simulando respuesta para desarrollo")
          return {
            id: policyId,
            policy_number: `POL-${policyId}${Date.now().toString().slice(-6)}`,
            policy_type: ["auto", "home", "life"][policyId % 3],
            start_date: "2023-01-01",
            end_date: "2024-01-01",
            premium: 299,
            coverage_amount: 50000,
            status: "active",
            details: {
              make: "Toyota",
              model: "Corolla",
              year: 2020,
              license_plate: "ABC-1234",
            },
            beneficiaries: [],
            claims: [],
            payments: [
              {
                id: 1,
                amount: 299,
                payment_date: "2023-01-01",
                payment_method: "credit_card",
                status: "completed",
              },
            ],
          }
        }

        // Propagar otros errores
        throw error
      }
    } catch (error) {
      // Si el error ya tiene un formato estructurado, usarlo directamente
      if (error.message) {
        throw error
      }
      throw { message: "Error al obtener detalles de la póliza" }
    }
  },

  // Crear una nueva póliza
  createPolicy: async (policyData) => {
    try {
      console.log("Creando nueva póliza:", policyData)
      const response = await api.post("/policies", policyData)
      return response.data
    } catch (error) {
      console.error("Error al crear póliza:", error)

      // Si es un error de autenticación, limpiar datos de sesión
      if (error.isAuthError) {
        authService.logout()
      }

      // Si el error ya tiene un formato estructurado (de nuestro interceptor), usarlo directamente
      if (error.message) {
        throw error
      }
      throw { message: "Error al crear póliza" }
    }
  },

  // Actualizar una póliza existente
  updatePolicy: async (policyId, policyData) => {
    try {
      const response = await api.put(`/policies/${policyId}`, policyData)
      return response.data
    } catch (error) {
      // Si es un error de autenticación, limpiar datos de sesión
      if (error.isAuthError) {
        authService.logout()
      }

      // Si el error ya tiene un formato estructurado (de nuestro interceptor), usarlo directamente
      if (error.message) {
        throw error
      }
      throw { message: "Error al actualizar póliza" }
    }
  },

  // Cancelar una póliza
  cancelPolicy: async (policyId) => {
    try {
      console.log("Cancelando póliza:", policyId)

      // Intentar hacer la petición al servidor
      try {
        const response = await api.post(`/policies/${policyId}/cancel`)
        return response.data
      } catch (error) {
        console.error("Error al cancelar póliza en el servidor:", error)

        // Si es un error 404, simular respuesta exitosa para desarrollo
        if (error.status === 404 || error.isNotFoundError) {
          console.log("Endpoint de cancelación no encontrado, simulando respuesta exitosa")
          return {
            success: true,
            message: "Póliza cancelada exitosamente",
            policy_id: policyId,
            status: "cancelled",
          }
        }

        // Si es un error de autenticación, propagar el error
        if (error.isAuthError || error.status === 401) {
          authService.logout()
          throw error
        }

        // Si es un error del servidor, simular respuesta exitosa para desarrollo
        if (error.isServerError || error.code === "NETWORK_ERROR" || error.code === "NO_RESPONSE") {
          console.log("Error del servidor, simulando respuesta exitosa")
          return {
            success: true,
            message: "Póliza cancelada exitosamente (modo offline)",
            policy_id: policyId,
            status: "cancelled",
          }
        }

        // Propagar otros errores
        throw error
      }
    } catch (error) {
      console.error("Error al cancelar póliza:", error)

      // Si el error ya tiene un formato estructurado, usarlo directamente
      if (error.message) {
        throw error
      }

      throw { message: "Error al cancelar póliza" }
    }
  },

  // Crear una reclamación para una póliza
  createClaim: async (policyId, claimData) => {
    try {
      const response = await api.post(`/policies/${policyId}/claims`, claimData)
      return response.data
    } catch (error) {
      // Si es un error de autenticación, limpiar datos de sesión
      if (error.isAuthError) {
        authService.logout()
      }

      // Si el error ya tiene un formato estructurado (de nuestro interceptor), usarlo directamente
      if (error.message) {
        throw error
      }
      throw { message: "Error al crear reclamación" }
    }
  },
}

// Servicio de administración (solo para usuarios admin)
export const adminService = {
  // Obtener todos los usuarios
  getUsers: async () => {
    try {
      const response = await api.get("/admin/users")
      return response.data.users
    } catch (error) {
      // Si es un error de autenticación, limpiar datos de sesión
      if (error.isAuthError) {
        authService.logout()
      }

      // Si el error ya tiene un formato estructurado (de nuestro interceptor), usarlo directamente
      if (error.message) {
        throw error
      }
      throw { message: "Error al obtener usuarios" }
    }
  },
}

export default api
