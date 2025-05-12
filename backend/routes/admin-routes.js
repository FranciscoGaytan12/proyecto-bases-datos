// Rutas para el panel de administración
const express = require("express")
const router = express.Router()
const db = require("../db")
const { authenticateToken, isAdmin } = require("../middleware/auth")

// Middleware para verificar que el usuario es administrador
router.use(authenticateToken, isAdmin)

// Obtener todos los usuarios
router.get("/users", async (req, res) => {
  try {
    console.log("Obteniendo lista de usuarios")
    const users = await db.query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC")
    res.json({ users })
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    res.status(500).json({ message: "Error al obtener usuarios", error: error.message })
  }
})

// Obtener un usuario específico
router.get("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id
    console.log(`Obteniendo usuario con ID: ${userId}`)

    const users = await db.query("SELECT id, name, email, role, created_at FROM users WHERE id = ?", [userId])

    if (users.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    res.json({ user: users[0] })
  } catch (error) {
    console.error(`Error al obtener usuario ${req.params.id}:`, error)
    res.status(500).json({ message: "Error al obtener usuario", error: error.message })
  }
})

// Obtener las pólizas de un usuario específico
router.get("/users/:id/policies", async (req, res) => {
  try {
    const userId = req.params.id
    console.log(`Obteniendo pólizas del usuario con ID: ${userId}`)

    // Verificar si el usuario existe
    const users = await db.query("SELECT id FROM users WHERE id = ?", [userId])

    if (users.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    // Obtener las pólizas del usuario
    const policies = await db.query("SELECT * FROM policies WHERE user_id = ? ORDER BY created_at DESC", [userId])

    res.json({ policies })
  } catch (error) {
    console.error(`Error al obtener pólizas del usuario ${req.params.id}:`, error)
    res.status(500).json({ message: "Error al obtener pólizas", error: error.message })
  }
})

// Actualizar un usuario
router.put("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id
    const { name, email, role } = req.body

    console.log(`Actualizando usuario con ID: ${userId}`)

    // Verificar si el usuario existe
    const users = await db.query("SELECT id FROM users WHERE id = ?", [userId])

    if (users.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    // Actualizar el usuario
    await db.query("UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?", [name, email, role, userId])

    res.json({ message: "Usuario actualizado correctamente" })
  } catch (error) {
    console.error(`Error al actualizar usuario ${req.params.id}:`, error)
    res.status(500).json({ message: "Error al actualizar usuario", error: error.message })
  }
})

module.exports = router
