// Servicio de autenticación
const authService = {
  // Obtener el token actual
  getToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token")
    }
    return null
  },

  // Iniciar sesión
  login: async (email, password) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error("Credenciales incorrectas")
      }

      const data = await response.json()

      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
      }

      return data
    } catch (error) {
      throw error
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

  // Verificar si el usuario es administrador
  isAdmin: () => {
    const user = authService.getCurrentUser()
    return user && user.role === "admin"
  },
}

export default authService
