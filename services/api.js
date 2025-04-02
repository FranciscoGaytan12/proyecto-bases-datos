// Servicio para manejar las peticiones a la API
import axios from "axios"

// Verificar la URL de la API
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
console.log("API URL configurada:", API_URL)

// Crear instancia de axios con logs
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Agregar interceptor para mostrar las peticiones
api.interceptors.request.use(
  (config) => {
    console.log(`Enviando petición ${config.method.toUpperCase()} a ${config.url}`, config.data)
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
    console.error("Error en la petición:", error)
    return Promise.reject(error)
  },
)

// Interceptor para mostrar las respuestas
api.interceptors.response.use(
  (response) => {
    console.log(`Respuesta de ${response.config.url}:`, response.data)
    return response
  },
  (error) => {
    console.error("Error en la respuesta:", error)
    if (error.response) {
      console.error("Datos del error:", error.response.data)
      console.error("Estado HTTP:", error.response.status)
    }
    // Manejar errores de autenticación (token expirado, etc.)
    if (error.response && error.response.status === 401 && typeof window !== "undefined") {
      // Limpiar datos de sesión
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
    return Promise.reject(error)
  },
)

// Agregar logs para depuraci��n
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
        throw new Error("URL de API inválida. Verifica la variable de entorno NEXT_PUBLIC_API_URL")
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

      // Mostrar información detallada del error
      if (error.response) {
        console.error("Datos del error:", error.response.data)
        console.error("Estado HTTP:", error.response.status)
        console.error("Cabeceras:", error.response.headers)
        throw error.response.data || { message: "Error en la respuesta del servidor" }
      } else if (error.request) {
        console.error("No se recibió respuesta:", error.request)
        throw { message: "No se pudo conectar con el servidor. Verifica que el backend esté en ejecución." }
      } else {
        console.error("Error de configuración:", error.message)
        throw { message: "Error al configurar la solicitud: " + error.message }
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
      if (error.response) {
        console.error("Datos del error:", error.response.data)
        console.error("Estado HTTP:", error.response.status)
      }
      throw error.response?.data || { message: "Error al conectar con el servidor" }
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
        return JSON.parse(userStr)
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
      throw error.response?.data || { message: "Error al conectar con el servidor" }
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
      throw error.response?.data || { message: "Error al obtener pólizas" }
    }
  },

  // Obtener detalles de una póliza específica
  getPolicyDetails: async (policyId) => {
    try {
      const response = await api.get(`/policies/${policyId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { message: "Error al obtener detalles de la póliza" }
    }
  },

  // Crear una nueva póliza
  createPolicy: async (policyData) => {
    try {
      const response = await api.post("/policies", policyData)
      return response.data
    } catch (error) {
      throw error.response?.data || { message: "Error al crear póliza" }
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
      throw error.response?.data || { message: "Error al obtener usuarios" }
    }
  },
}

export default api

