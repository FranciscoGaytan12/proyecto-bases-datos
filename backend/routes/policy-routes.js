// Rutas para gestionar pólizas
const express = require("express")
const router = express.Router()
const db = require("../db")
const { authenticateToken } = require("../middleware/auth")
const {
  generatePolicyNumber,
  generateClaimNumber,
  calculatePolicyStatus,
  validatePolicyData,
} = require("../utils/db-helpers")

// Obtener todas las pólizas del usuario
router.get("/", authenticateToken, async (req, res) => {
  try {
    const policies = await db.query("SELECT * FROM policies WHERE user_id = ? ORDER BY created_at DESC", [
      req.user.userId,
    ])

    res.json({ policies })
  } catch (error) {
    console.error("Error al obtener pólizas:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
})

// Obtener detalles de una póliza específica
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const policyId = req.params.id

    // Obtener la póliza
    const policies = await db.query("SELECT * FROM policies WHERE id = ? AND user_id = ?", [policyId, req.user.userId])

    if (policies.length === 0) {
      return res.status(404).json({ message: "Póliza no encontrada" })
    }

    const policy = policies[0]

    // Obtener beneficiarios
    const beneficiaries = await db.query("SELECT * FROM beneficiaries WHERE policy_id = ?", [policyId])

    // Obtener reclamaciones
    const claims = await db.query("SELECT * FROM claims WHERE policy_id = ?", [policyId])

    // Obtener pagos
    const payments = await db.query("SELECT * FROM payments WHERE policy_id = ?", [policyId])

    res.json({
      policy,
      beneficiaries,
      claims,
      payments,
    })
  } catch (error) {
    console.error("Error al obtener detalles de póliza:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
})

// Crear una nueva póliza
router.post("/", authenticateToken, async (req, res) => {
  let connection
  try {
    const policyData = req.body

    // Validar datos
    const errors = validatePolicyData(policyData)
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors })
    }

    // Generar número de póliza único
    const policyNumber = generatePolicyNumber()

    // Calcular estado inicial
    const status = calculatePolicyStatus(policyData.start_date, policyData.end_date)

    // Iniciar transacción
    connection = await db.getTransaction()

    // Insertar póliza
    const result = await connection.query(
      `INSERT INTO policies 
       (user_id, policy_number, policy_type, start_date, end_date, premium, coverage_amount, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.userId,
        policyNumber,
        policyData.policy_type,
        policyData.start_date,
        policyData.end_date,
        policyData.premium,
        policyData.coverage_amount,
        status,
      ],
    )

    const policyId = result[0].insertId

    // Insertar beneficiarios si existen
    if (policyData.beneficiaries && policyData.beneficiaries.length > 0) {
      for (const beneficiary of policyData.beneficiaries) {
        await connection.query(
          `INSERT INTO beneficiaries (policy_id, name, relationship, percentage) 
           VALUES (?, ?, ?, ?)`,
          [policyId, beneficiary.name, beneficiary.relationship, beneficiary.percentage],
        )
      }
    }

    // Confirmar transacción
    await db.commitTransaction(connection)

    res.status(201).json({
      message: "Póliza creada exitosamente",
      policy_id: policyId,
      policy_number: policyNumber,
    })
  } catch (error) {
    // Revertir transacción en caso de error
    if (connection) {
      await db.rollbackTransaction(connection)
    }
    console.error("Error al crear póliza:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
})

// Actualizar una póliza existente
router.put("/:id", authenticateToken, async (req, res) => {
  let connection
  try {
    const policyId = req.params.id
    const policyData = req.body

    // Verificar que la póliza exista y pertenezca al usuario
    const policies = await db.query("SELECT * FROM policies WHERE id = ? AND user_id = ?", [policyId, req.user.userId])

    if (policies.length === 0) {
      return res.status(404).json({ message: "Póliza no encontrada" })
    }

    // Validar datos
    const errors = validatePolicyData(policyData)
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors })
    }

    // Calcular estado
    const status = calculatePolicyStatus(policyData.start_date, policyData.end_date)

    // Iniciar transacción
    connection = await db.getTransaction()

    // Actualizar póliza
    await connection.query(
      `UPDATE policies SET 
       policy_type = ?, 
       start_date = ?, 
       end_date = ?, 
       premium = ?, 
       coverage_amount = ?, 
       status = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        policyData.policy_type,
        policyData.start_date,
        policyData.end_date,
        policyData.premium,
        policyData.coverage_amount,
        status,
        policyId,
      ],
    )

    // Actualizar beneficiarios si existen
    if (policyData.beneficiaries && policyData.beneficiaries.length > 0) {
      // Eliminar beneficiarios existentes
      await connection.query("DELETE FROM beneficiaries WHERE policy_id = ?", [policyId])

      // Insertar nuevos beneficiarios
      for (const beneficiary of policyData.beneficiaries) {
        await connection.query(
          `INSERT INTO beneficiaries (policy_id, name, relationship, percentage) 
           VALUES (?, ?, ?, ?)`,
          [policyId, beneficiary.name, beneficiary.relationship, beneficiary.percentage],
        )
      }
    }

    // Confirmar transacción
    await db.commitTransaction(connection)

    res.json({
      message: "Póliza actualizada exitosamente",
      policy_id: policyId,
    })
  } catch (error) {
    // Revertir transacción en caso de error
    if (connection) {
      await db.rollbackTransaction(connection)
    }
    console.error("Error al actualizar póliza:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
})

// Crear una nueva reclamación para una póliza
router.post("/:id/claims", authenticateToken, async (req, res) => {
  try {
    const policyId = req.params.id
    const { description, amount } = req.body

    // Validar datos
    if (!description || !amount) {
      return res.status(400).json({ message: "La descripción y el monto son requeridos" })
    }

    // Verificar que la póliza exista y pertenezca al usuario
    const policies = await db.query("SELECT * FROM policies WHERE id = ? AND user_id = ?", [policyId, req.user.userId])

    if (policies.length === 0) {
      return res.status(404).json({ message: "Póliza no encontrada" })
    }

    // Verificar que la póliza esté activa
    if (policies[0].status !== "active") {
      return res.status(400).json({ message: "Solo se pueden crear reclamaciones para pólizas activas" })
    }

    // Generar número de reclamación único
    const claimNumber = generateClaimNumber()

    // Insertar reclamación
    const result = await db.query(
      `INSERT INTO claims (policy_id, claim_number, description, amount, status) 
       VALUES (?, ?, ?, ?, 'submitted')`,
      [policyId, claimNumber, description, amount],
    )

    res.status(201).json({
      message: "Reclamación creada exitosamente",
      claim_id: result.insertId,
      claim_number: claimNumber,
    })
  } catch (error) {
    console.error("Error al crear reclamación:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
})

module.exports = router

