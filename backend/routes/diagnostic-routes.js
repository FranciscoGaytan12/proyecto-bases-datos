// Rutas para diagnóstico del sistema
const express = require("express")
const router = express.Router()
const db = require("../db")
const { authenticateToken } = require("../middleware/auth")

// Verificar estado del sistema
router.get("/health", async (req, res) => {
  try {
    const healthCheck = {
      uptime: process.uptime(),
      timestamp: Date.now(),
      message: "OK",
      database: false,
      environment: {
   
        DB_HOST: process.env.DB_HOST || "localhost",
        DB_PORT: process.env.DB_PORT || 3306,
        DB_NAME: process.env.DB_NAME || "segurototal",
        DB_USER: process.env.DB_USER || "root",
        // No mostrar la contraseña por seguridad
        JWT_SECRET: process.env.JWT_SECRET ? "configurado" : "no configurado",
      },
    }

    // Verificar conexión a la base de datos
    try {
      await db.query("SELECT 1")
      healthCheck.database = true
    } catch (dbError) {
      healthCheck.database = false
      healthCheck.databaseError = dbError.message
    }

    res.json(healthCheck)
  } catch (error) {
    console.error("Error en health check:", error)
    res.status(500).json({ message: "Error al verificar estado del sistema", error: error.message })
  }
})

// Verificar conexión a la base de datos
router.get("/db-test", async (req, res) => {
  try {
    // Intentar ejecutar una consulta simple
    const result = await db.query("SELECT 1 as test")

    res.json({
      success: true,
      message: "Conexión a base de datos exitosa",
      result,
      config: {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME || "segutotal",
        user: process.env.DB_USER || "root",
      },
    })
  } catch (error) {
    console.error("Error en prueba de base de datos:", error)

    res.status(500).json({
      success: false,
      message: "Error al conectar con la base de datos",
      error: error.message,
      config: {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME || "segutotal",
        user: process.env.DB_USER || "root",
      },
    })
  }
})

// Ruta para verificar si un usuario es administrador
router.get("/check-admin", authenticateToken, async (req, res) => {
  try {
    // Obtener el ID del usuario del token JWT
    const userId = req.user.userId

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "ID de usuario no encontrado en el token",
        isAdmin: false,
      })
    }

    // Consultar la base de datos para verificar el rol del usuario
    const query = "SELECT roles FROM users WHERE id = ?"
    const users = await db.query(query, [userId])

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
        isAdmin: false,
      })
    }

    const user = users[0]
    const isAdmin = user.roles === "admin"

    return res.json({
      success: true,
      message: isAdmin ? "El usuario es administrador" : "El usuario no es administrador",
      isAdmin: isAdmin,
    })
  } catch (error) {
    console.error("Error al verificar rol de administrador:", error)
    return res.status(500).json({
      success: false,
      message: "Error al verificar rol de administrador",
      error: error.message,
      isAdmin: false,
    })
  }
})

module.exports = router
