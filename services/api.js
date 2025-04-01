// Servicio para manejar las peticiones a la API
import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Servicio de autenticación
export const authService = {
  // Iniciar sesión
  login: async (email, password) => {
    try {
      const response = await api.post("/login", { email, password })
      if (response.data.token) {
        localStorage.setItem("token", response.data.token)
        localStorage.setItem("user", JSON.stringify(response.data.user))
      }
      return response.data
    } catch (error) {
      throw error.response?.data || { message: "Error al conectar con el servidor" }
    }
  },

  // Registrar usuario
  register: async (userData) => {
    try {
      const response = await api.post("/register", userData)
      return response.data
    } catch (error) {
      throw error.response?.data || { message: "Error al conectar con el servidor" }
    }
  },

  // Cerrar sesión
  logout: () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  },

  // Obtener usuario actual
  getCurrentUser: () => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      return JSON.parse(userStr)
    }
    return null
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    return !!localStorage.getItem("token")
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

export default api

