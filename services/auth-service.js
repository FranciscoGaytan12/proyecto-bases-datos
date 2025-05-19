// Servicio de autenticación
const axios = require("axios")
const jwtDecode = require("jwt-decode")

// URL base de la API
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

// Clase para manejar la autenticación
class AuthService {
  // Iniciar sesión
  async login(email, password) {
    try {
      console.log(`Intentando iniciar sesión con email: ${email}`)
      const response = await axios.post(`${API_URL}/auth/login`, { email, password })

      if (response.data.token) {
        // Guardar token en localStorage
        localStorage.setItem("token", response.data.token)

        // Decodificar token para obtener información del usuario
        const decodedToken = jwtDecode(response.data.token)
        console.log("Token decodificado:", decodedToken)

        // Crear objeto de usuario con la información del token
        const user = {
          id: decodedToken.userId || decodedToken.id,
          email: decodedToken.email,
          name: decodedToken.name,
          role: decodedToken.role || "user", // Asegurarse de que el rol esté presente
        }

        // Guardar información del usuario en localStorage
        localStorage.setItem("user", JSON.stringify(user))

        // Verificar explícitamente si el usuario es admin
        this.checkAdminStatus(user.id)

        return {
          token: response.data.token,
          user,
        }
      }

      return response.data
    } catch (error) {
      console.error("Error en login:", error)
      throw this.handleError(error)
    }
  }

  // Verificar si el usuario es administrador
  async checkAdminStatus(userId) {
    try {
      const token = this.getToken()
      if (!token) return false

      const response = await axios.get(`${API_URL}/diagnostic/check-admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.isAdmin) {
        // Actualizar el usuario en localStorage con el rol de admin
        const user = this.getCurrentUser()
        if (user) {
          user.role = "admin"
          localStorage.setItem("user", JSON.stringify(user))
          console.log("Usuario actualizado como admin en localStorage")

          // Disparar un evento personalizado para notificar que el usuario es admin
          if (typeof window !== "undefined") {
            const event = new CustomEvent("userRoleUpdated", { detail: { role: "admin" } })
            window.dispatchEvent(event)
          }
        }
        return true
      }

      return false
    } catch (error) {
      console.error("Error al verificar estado de admin:", error)
      return false
    }
  }

  // Registrar nuevo usuario
  async register(name, email, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Cerrar sesión
  logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  }

  // Obtener token actual
  getToken() {
    return localStorage.getItem("token")
  }

  // Verificar si el usuario está autenticado
  isAuthenticated() {
    const token = this.getToken()
    if (!token) return false

    try {
      const decodedToken = jwtDecode(token)
      const currentTime = Date.now() / 1000

      // Verificar si el token ha expirado
      if (decodedToken.exp < currentTime) {
        this.logout()
        return false
      }

      return true
    } catch (error) {
      console.error("Error al verificar autenticación:", error)
      return false
    }
  }

  // Obtener información del usuario actual
  getCurrentUser() {
    const userStr = localStorage.getItem("user")
    if (!userStr) return null

    try {
      return JSON.parse(userStr)
    } catch (error) {
      console.error("Error al obtener usuario actual:", error)
      return null
    }
  }

  // Manejar errores de API
  handleError(error) {
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      const errorMessage = error.response.data.message || "Error en la solicitud"
      return new Error(errorMessage)
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      return new Error("No se recibió respuesta del servidor")
    } else {
      // Ocurrió un error al configurar la solicitud
      return new Error("Error al procesar la solicitud")
    }
  }
}

// Exportar una instancia del servicio
const authService = new AuthService()
module.exports = authService
