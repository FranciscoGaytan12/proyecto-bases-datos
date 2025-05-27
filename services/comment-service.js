import api from "./api"

export const commentService = {
  // Obtener todos los comentarios
  getComments: async () => {
    try {
      const response = await api.get("/api/comments")  // Añadir /api/ al inicio
      return response.data.comments || []
    } catch (error) {
      console.error("Error al obtener comentarios:", error)
      return []
    }
  },

  // Crear un nuevo comentario
  createComment: async (data) => {
    try {
      const response = await api.post("/api/comments", data)  // Añadir /api/ al inicio
      return response.data
    } catch (error) {
      console.error("Error al crear comentario:", error)
      throw error
    }
  },
}

export default commentService
