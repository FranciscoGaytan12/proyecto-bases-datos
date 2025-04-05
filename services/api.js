// Servicio para manejar las peticiones a la API
import axios from "axios"

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

    // Información detallada del error
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error("Datos del error:", error.response.data)
      console.error("Estado HTTP:", error.response.status)
      console.error("Cabeceras:", error.response.headers)

      // Devolver un mensaje de error más descriptivo
      return Promise.reject({
        message: error.response.data?.message || `Error del servidor: ${error.response.status}`,
        status: error.response.status,
        data: error.response.data,
      })
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error("No se recibió respuesta del servidor:", error.request)

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

// Servicio de autenticación
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
        // No lanzar error aquí, continuar con el intento de login
      }

      const response = await api.post("/login", { email, password })
      console.log("Respuesta de inicio de sesión:", response.data)

      if (response.data.token && typeof window !== "undefined") {
        localStorage.setItem("token", response.data.token)
        localStorage.setItem("user", JSON.stringify(response.data.user))
      }
      return response.data
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
      const response = await api.post("/register", userData)
      console.log("Respuesta de registro:", response.data)
      return response.data
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
      const response = await api.get("/profile")
      return response.data
    } catch (error) {
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
      if (error.message) {
        throw error
      }
      throw { message: "Error al cambiar contraseña" }
    }
  },
}

// Servicio de pólizas
export const policyService = {
  // Obtener todas las pólizas del usuario
  getPolicies: async () => {
    try {
      const response = await api.get("/policies")
      return response.data.policies
    } catch (error) {
      console.error("Error al obtener pólizas:", error)
      // Si el error ya tiene un formato estructurado (de nuestro interceptor), usarlo directamente
      if (error.message) {
        throw error
      }
      throw { message: "Error al obtener pólizas" }
    }
  },

  // Obtener detalles de una póliza específica
  getPolicyDetails: async (policyId) => {
    try {
      const response = await api.get(`/policies/${policyId}`)
      return response.data
    } catch (error) {
      // Si el error ya tiene un formato estructurado (de nuestro interceptor), usarlo directamente
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
      const response = await api.post(`/policies/${policyId}/cancel`)
      return response.data
    } catch (error) {
      // Si el error ya tiene un formato estructurado (de nuestro interceptor), usarlo directamente
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
      // Si el error ya tiene un formato estructurado (de nuestro interceptor), usarlo directamente
      if (error.message) {
        throw error
      }
      throw { message: "Error al obtener usuarios" }
    }
  },
}

export default api

