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

// Middleware para logging detallado de errores
const logError = (error, req, operation) => {
  console.error(`Error en ${operation}:`, error)
  console.error(`Detalles de la petición:`)
  console.error(`- URL: ${req.originalUrl}`)
  console.error(`- Método: ${req.method}`)
  console.error(`- Usuario ID: ${req.user?.userId || "No autenticado"}`)
  console.error(`- Parámetros:`, req.params)
  console.error(`- Query:`, req.query)
  console.error(`- Body:`, req.body)
  console.error(`- Stack:`, error.stack)
}

// Obtener todas las pólizas del usuario
router.get("/", authenticateToken, async (req, res) => {
  try {
    console.log(`Obteniendo pólizas para usuario ID: ${req.user.userId}`)

    // Verificar conexión a la base de datos antes de la consulta
    try {
      await db.query("SELECT 1")
      console.log("Conexión a la base de datos verificada")
    } catch (dbError) {
      console.error("Error de conexión a la base de datos:", dbError)
      return res.status(500).json({
        message: "Error de conexión a la base de datos",
        error: process.env.NODE_ENV === "development" ? dbError.message : undefined,
      })
    }

    const policies = await db.query("SELECT * FROM policies WHERE user_id = ? ORDER BY created_at DESC", [
      req.user.userId,
    ])

    console.log(`Se encontraron ${policies.length} pólizas`)
    res.json({ policies })
  } catch (error) {
    logError(error, req, "obtener pólizas")
    res.status(500).json({
      message: "Error interno del servidor al obtener pólizas",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Obtener detalles de una póliza específica
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const policyId = req.params.id
    console.log(`Obteniendo detalles de póliza ID: ${policyId} para usuario ID: ${req.user.userId}`)

    // Obtener la póliza
    const policies = await db.query("SELECT * FROM policies WHERE id = ? AND user_id = ?", [policyId, req.user.userId])

    if (policies.length === 0) {
      console.log(`Póliza ID: ${policyId} no encontrada para usuario ID: ${req.user.userId}`)
      return res.status(404).json({ message: "Póliza no encontrada" })
    }

    const policy = policies[0]
    console.log(`Póliza encontrada: ${policy.policy_number}`)

    // Obtener beneficiarios
    const beneficiaries = await db.query("SELECT * FROM beneficiaries WHERE policy_id = ?", [policyId])
    console.log(`Se encontraron ${beneficiaries.length} beneficiarios`)

    // Obtener reclamaciones
    const claims = await db.query("SELECT * FROM claims WHERE policy_id = ?", [policyId])
    console.log(`Se encontraron ${claims.length} reclamaciones`)

    // Obtener pagos
    const payments = await db.query("SELECT * FROM payments WHERE policy_id = ?", [policyId])
    console.log(`Se encontraron ${payments.length} pagos`)

    res.json({
      policy,
      beneficiaries,
      claims,
      payments,
    })
  } catch (error) {
    logError(error, req, "obtener detalles de póliza")
    res.status(500).json({
      message: "Error interno del servidor al obtener detalles de póliza",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Crear una nueva póliza
router.post("/", authenticateToken, async (req, res) => {
  let connection
  try {
    const policyData = req.body
    console.log(`Creando nueva póliza para usuario ID: ${req.user.userId}`, policyData)

    // Validar datos
    const errors = validatePolicyData(policyData)
    if (Object.keys(errors).length > 0) {
      console.log(`Validación fallida:`, errors)
      return res.status(400).json({ errors })
    }

    // Generar número de póliza único
    const policyNumber = generatePolicyNumber()
    console.log(`Número de póliza generado: ${policyNumber}`)

    // Calcular estado inicial
    const status = calculatePolicyStatus(policyData.start_date, policyData.end_date)
    console.log(`Estado inicial de la póliza: ${status}`)

    // Iniciar transacción
    connection = await db.getTransaction()
    console.log(`Transacción iniciada`)

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
    console.log(`Póliza insertada con ID: ${policyId}`)

    // Insertar beneficiarios si existen
    if (policyData.beneficiaries && policyData.beneficiaries.length > 0) {
      console.log(`Insertando ${policyData.beneficiaries.length} beneficiarios`)
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
    console.log(`Transacción confirmada`)

    res.status(201).json({
      message: "Póliza creada exitosamente",
      policy_id: policyId,
      policy_number: policyNumber,
    })
  } catch (error) {
    // Revertir transacción en caso de error
    if (connection) {
      console.log(`Revirtiendo transacción debido a error`)
      await db.rollbackTransaction(connection)
    }
    logError(error, req, "crear póliza")
    res.status(500).json({
      message: "Error interno del servidor al crear póliza",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Actualizar una póliza existente
router.put("/:id", authenticateToken, async (req, res) => {
  let connection
  try {
    const policyId = req.params.id
    const policyData = req.body
    console.log(`Actualizando póliza ID: ${policyId} para usuario ID: ${req.user.userId}`, policyData)

    // Verificar que la póliza exista y pertenezca al usuario
    const policies = await db.query("SELECT * FROM policies WHERE id = ? AND user_id = ?", [policyId, req.user.userId])

    if (policies.length === 0) {
      console.log(`Póliza ID: ${policyId} no encontrada para usuario ID: ${req.user.userId}`)
      return res.status(404).json({ message: "Póliza no encontrada" })
    }

    // Validar datos
    const errors = validatePolicyData(policyData)
    if (Object.keys(errors).length > 0) {
      console.log(`Validación fallida:`, errors)
      return res.status(400).json({ errors })
    }

    // Calcular estado
    const status = calculatePolicyStatus(policyData.start_date, policyData.end_date)
    console.log(`Nuevo estado de la póliza: ${status}`)

    // Iniciar transacción
    connection = await db.getTransaction()
    console.log(`Transacción iniciada`)

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
    console.log(`Póliza actualizada`)

    // Actualizar beneficiarios si existen
    if (policyData.beneficiaries && policyData.beneficiaries.length > 0) {
      console.log(`Actualizando ${policyData.beneficiaries.length} beneficiarios`)
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
    console.log(`Transacción confirmada`)

    res.json({
      message: "Póliza actualizada exitosamente",
      policy_id: policyId,
    })
  } catch (error) {
    // Revertir transacción en caso de error
    if (connection) {
      console.log(`Revirtiendo transacción debido a error`)
      await db.rollbackTransaction(connection)
    }
    logError(error, req, "actualizar póliza")
    res.status(500).json({
      message: "Error interno del servidor al actualizar póliza",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Cancelar una póliza
router.post("/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const policyId = req.params.id
    console.log(`Cancelando póliza ID: ${policyId} para usuario ID: ${req.user.userId}`)

    // Verificar que la póliza exista y pertenezca al usuario
    const policies = await db.query("SELECT * FROM policies WHERE id = ? AND user_id = ?", [policyId, req.user.userId])

    if (policies.length === 0) {
      console.log(`Póliza ID: ${policyId} no encontrada para usuario ID: ${req.user.userId}`)
      return res.status(404).json({ message: "Póliza no encontrada" })
    }

    // Verificar que la póliza esté activa
    if (policies[0].status !== "active") {
      console.log(`Póliza ID: ${policyId} no está activa, estado actual: ${policies[0].status}`)
      return res.status(400).json({ message: "Solo se pueden cancelar pólizas activas" })
    }

    // Actualizar estado de la póliza
    await db.query(
      `UPDATE policies SET 
       status = 'cancelled',
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [policyId],
    )
    console.log(`Póliza ID: ${policyId} cancelada exitosamente`)

    res.json({
      message: "Póliza cancelada exitosamente",
      policy_id: policyId,
      status: "cancelled",
    })
  } catch (error) {
    logError(error, req, "cancelar póliza")
    res.status(500).json({
      message: "Error interno del servidor al cancelar póliza",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Eliminar una póliza
router.delete("/:id", authenticateToken, async (req, res) => {
  let connection
  try {
    const policyId = req.params.id
    console.log(`Eliminando póliza ID: ${policyId} para usuario ID: ${req.user.userId}`)

    // Verificar que la póliza exista y pertenezca al usuario
    const policies = await db.query("SELECT * FROM policies WHERE id = ? AND user_id = ?", [policyId, req.user.userId])

    if (policies.length === 0) {
      console.log(`Póliza ID: ${policyId} no encontrada para usuario ID: ${req.user.userId}`)
      return res.status(404).json({ message: "Póliza no encontrada" })
    }

    // Iniciar transacción
    connection = await db.getTransaction()
    console.log(`Transacción iniciada para eliminar póliza ID: ${policyId}`)

    // Eliminar registros relacionados
    console.log(`Eliminando beneficiarios de la póliza ID: ${policyId}`)
    await connection.query("DELETE FROM beneficiaries WHERE policy_id = ?", [policyId])

    console.log(`Eliminando reclamaciones de la póliza ID: ${policyId}`)
    await connection.query("DELETE FROM claims WHERE policy_id = ?", [policyId])

    console.log(`Eliminando pagos de la póliza ID: ${policyId}`)
    await connection.query("DELETE FROM payments WHERE policy_id = ?", [policyId])

    // Eliminar la póliza
    console.log(`Eliminando póliza ID: ${policyId}`)
    await connection.query("DELETE FROM policies WHERE id = ?", [policyId])

    // Confirmar transacción
    await db.commitTransaction(connection)
    console.log(`Transacción confirmada, póliza ID: ${policyId} eliminada exitosamente`)

    res.json({
      message: "Póliza eliminada exitosamente",
      policy_id: policyId,
    })
  } catch (error) {
    // Revertir transacción en caso de error
    if (connection) {
      console.log(`Revirtiendo transacción debido a error`)
      await db.rollbackTransaction(connection)
    }
    logError(error, req, "eliminar póliza")
    res.status(500).json({
      message: "Error interno del servidor al eliminar póliza",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Crear una nueva reclamación para una póliza
router.post("/:id/claims", authenticateToken, async (req, res) => {
  try {
    const policyId = req.params.id
    const { description, amount } = req.body
    console.log(`Creando reclamación para póliza ID: ${policyId}`, { description, amount })

    // Validar datos
    if (!description || !amount) {
      console.log(`Validación fallida: descripción o monto faltantes`)
      return res.status(400).json({ message: "La descripción y el monto son requeridos" })
    }

    // Verificar que la póliza exista y pertenezca al usuario
    const policies = await db.query("SELECT * FROM policies WHERE id = ? AND user_id = ?", [policyId, req.user.userId])

    if (policies.length === 0) {
      console.log(`Póliza ID: ${policyId} no encontrada para usuario ID: ${req.user.userId}`)
      return res.status(404).json({ message: "Póliza no encontrada" })
    }

    // Verificar que la póliza esté activa
    if (policies[0].status !== "active") {
      console.log(`Póliza ID: ${policyId} no está activa, estado actual: ${policies[0].status}`)
      return res.status(400).json({ message: "Solo se pueden crear reclamaciones para pólizas activas" })
    }

    // Generar número de reclamación único
    const claimNumber = generateClaimNumber()
    console.log(`Número de reclamación generado: ${claimNumber}`)

    // Insertar reclamación
    const result = await db.query(
      `INSERT INTO claims (policy_id, claim_number, description, amount, status) 
       VALUES (?, ?, ?, ?, 'submitted')`,
      [policyId, claimNumber, description, amount],
    )
    console.log(`Reclamación insertada con ID: ${result.insertId}`)

    res.status(201).json({
      message: "Reclamación creada exitosamente",
      claim_id: result.insertId,
      claim_number: claimNumber,
    })
  } catch (error) {
    logError(error, req, "crear reclamación")
    res.status(500).json({
      message: "Error interno del servidor al crear reclamación",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

module.exports = router
