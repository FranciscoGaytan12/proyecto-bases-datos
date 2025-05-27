const express = require("express")
const router = express.Router()
const db = require("../db")
const { authenticateToken } = require("../middleware/auth")

// Obtener todas las pólizas de un usuario
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const query = "SELECT * FROM policies WHERE user_id = ?"
    const [policies] = await db.query(query, [userId])
    res.json({
      success: true,
      policies: policies,
    })
  } catch (error) {
    console.error("Error al obtener pólizas:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener pólizas",
    })
  }
})

// Obtener una póliza por ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const policyId = req.params.id
    const userId = req.user.id

    const query = "SELECT * FROM policies WHERE id = ? AND user_id = ?"
    const [policies] = await db.query(query, [policyId, userId])

    if (policies.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Póliza no encontrada",
      })
    }

    res.json({
      success: true,
      policy: policies[0],
    })
  } catch (error) {
    console.error("Error al obtener póliza:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener póliza",
    })
  }
})

// Crear una nueva póliza
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { policy_number, start_date, end_date, coverage_amount, premium, product_id } = req.body

    // Validar que los campos requeridos estén presentes
    if (!policy_number || !start_date || !end_date || !coverage_amount || !premium || !product_id) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos",
      })
    }

    const query =
      "INSERT INTO policies (user_id, policy_number, start_date, end_date, coverage_amount, premium, product_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    const [result] = await db.query(query, [
      userId,
      policy_number,
      start_date,
      end_date,
      coverage_amount,
      premium,
      product_id,
      "active",
    ])

    res.status(201).json({
      success: true,
      message: "Póliza creada exitosamente",
      policy_id: result.insertId,
    })
  } catch (error) {
    console.error("Error al crear póliza:", error)
    res.status(500).json({
      success: false,
      message: "Error al crear póliza",
    })
  }
})

// Actualizar una póliza existente
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const policyId = req.params.id
    const userId = req.user.id
    const { policy_number, start_date, end_date, coverage_amount, premium, product_id } = req.body

    // Verificar que la póliza existe y pertenece al usuario
    const checkQuery = "SELECT * FROM policies WHERE id = ? AND user_id = ?"
    const [policies] = await db.query(checkQuery, [policyId, userId])

    if (policies.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Póliza no encontrada o no tienes permiso para actualizarla",
      })
    }

    // Construir la consulta de actualización dinámicamente
    let updateQuery = "UPDATE policies SET updated_at = NOW()"
    const updateParams = []

    if (policy_number) {
      updateQuery += ", policy_number = ?"
      updateParams.push(policy_number)
    }
    if (start_date) {
      updateQuery += ", start_date = ?"
      updateParams.push(start_date)
    }
    if (end_date) {
      updateQuery += ", end_date = ?"
      updateParams.push(end_date)
    }
    if (coverage_amount) {
      updateQuery += ", coverage_amount = ?"
      updateParams.push(coverage_amount)
    }
    if (premium) {
      updateQuery += ", premium = ?"
      updateParams.push(premium)
    }
    if (product_id) {
      updateQuery += ", product_id = ?"
      updateParams.push(product_id)
    }

    updateQuery += " WHERE id = ? AND user_id = ?"
    updateParams.push(policyId, userId)

    // Si no hay campos para actualizar, devolver un error
    if (updateParams.length === 2) {
      return res.status(400).json({
        success: false,
        message: "No hay campos para actualizar",
      })
    }

    const [result] = await db.query(updateQuery, updateParams)

    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: "Error al actualizar la póliza",
      })
    }

    res.json({
      success: true,
      message: "Póliza actualizada exitosamente",
      policy_id: policyId,
    })
  } catch (error) {
    console.error("Error al actualizar póliza:", error)
    res.status(500).json({
      success: false,
      message: "Error al actualizar póliza",
    })
  }
})

// Modificar la ruta de cancelación para eliminar la póliza
router.post("/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const policyId = req.params.id
    const userId = req.user.id

    console.log(`Intentando eliminar póliza ID: ${policyId} para usuario: ${userId}`)

    // Verificar que el ID sea un número válido
    if (!policyId || isNaN(policyId)) {
      return res.status(400).json({
        success: false,
        message: "ID de póliza inválido",
      })
    }

    // Verificar que la póliza existe y pertenece al usuario
    const [policies] = await db.query("SELECT * FROM policies WHERE id = ? AND user_id = ?", [policyId, userId])

    if (policies.length === 0) {
      return res.status(404).json({
        success: false,
        message: "La póliza no existe o no tienes permiso para eliminarla",
      })
    }

    // Eliminar la póliza
    await db.query("DELETE FROM policies WHERE id = ? AND user_id = ?", [policyId, userId])

    console.log(`✅ Póliza ID: ${policyId} eliminada exitosamente`)

    res.json({
      success: true,
      message: "Póliza eliminada exitosamente",
      policy_id: policyId,
    })
  } catch (error) {
    console.error("Error al eliminar póliza:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al eliminar la póliza",
    })
  }
})

module.exports = router
