const express = require("express")
const router = express.Router()
const authRoutes = require("./auth-routes")

// Ruta de prueba
router.get("/test", (req, res) => {
  res.json({
    message: "Servidor funcionando correctamente",
    timestamp: new Date().toISOString(),
    status: "OK",
  })
})

// Usar las rutas de autenticación
router.use("/", authRoutes)

module.exports = router
