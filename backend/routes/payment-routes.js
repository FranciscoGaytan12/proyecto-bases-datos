// Rutas para gestionar pagos
const express = require("express")
const router = express.Router()
const db = require("../db")
const { authenticateToken } = require("../middleware/auth")

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

// Obtener todos los pagos del usuario
router.get("/", authenticateToken, async (req, res) => {
  try {
    console.log(`Obteniendo pagos para usuario ID: ${req.user.userId}`)

    const payments = await db.query(
      `SELECT p.*, po.policy_number, po.policy_type 
       FROM payments p 
       JOIN policies po ON p.policy_id = po.id 
       WHERE po.user_id = ? 
       ORDER BY p.payment_date DESC`,
      [req.user.userId],
    )

    console.log(`Se encontraron ${payments.length} pagos`)
    res.json({ payments })
  } catch (error) {
    logError(error, req, "obtener pagos")
    res.status(500).json({
      message: "Error interno del servidor al obtener pagos",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Obtener un pago específico
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const paymentId = req.params.id
    console.log(`Obteniendo detalles del pago ID: ${paymentId}`)

    const payments = await db.query(
      `SELECT p.*, po.policy_number, po.policy_type 
       FROM payments p 
       JOIN policies po ON p.policy_id = po.id 
       WHERE p.id = ? AND po.user_id = ?`,
      [paymentId, req.user.userId],
    )

    if (payments.length === 0) {
      console.log(`Pago ID: ${paymentId} no encontrado para usuario ID: ${req.user.userId}`)
      return res.status(404).json({ message: "Pago no encontrado" })
    }

    console.log(`Pago encontrado: ${payments[0].id}`)
    res.json({ payment: payments[0] })
  } catch (error) {
    logError(error, req, "obtener detalles de pago")
    res.status(500).json({
      message: "Error interno del servidor al obtener detalles del pago",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Crear un nuevo pago
router.post("/", authenticateToken, async (req, res) => {
  let connection
  try {
    const paymentData = req.body
    console.log(`Creando nuevo pago para póliza ID: ${paymentData.policy_id}`, paymentData)

    // Validar datos básicos
    if (!paymentData.policy_id || !paymentData.amount || !paymentData.payment_method) {
      console.log(`Validación fallida: datos incompletos`)
      return res.status(400).json({
        message: "Datos incompletos. Se requiere policy_id, amount y payment_method",
      })
    }

    // Verificar que la póliza exista y pertenezca al usuario
    const policies = await db.query("SELECT * FROM policies WHERE id = ? AND user_id = ?", [
      paymentData.policy_id,
      req.user.userId,
    ])

    if (policies.length === 0) {
      console.log(`Póliza ID: ${paymentData.policy_id} no encontrada para usuario ID: ${req.user.userId}`)
      return res.status(404).json({ message: "Póliza no encontrada o no pertenece al usuario" })
    }

    // Iniciar transacción
    connection = await db.getTransaction()
    console.log(`Transacción iniciada`)

    // Preparar datos del pago
    const paymentRecord = {
      policy_id: paymentData.policy_id,
      amount: paymentData.amount,
      payment_date: paymentData.payment_date || new Date(),
      payment_method: paymentData.payment_method,
      transaction_id: paymentData.transaction_id || `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: paymentData.status || "completed",
      card_last_four: paymentData.card_info?.last_four || null,
      card_holder: paymentData.card_info?.card_holder || null,
    }

    console.log("Datos del pago a insertar:", paymentRecord)

    // Insertar pago
    const query = `
      INSERT INTO payments 
      (policy_id, amount, payment_date, payment_method, transaction_id, status, card_last_four, card_holder) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `

    const params = [
      paymentRecord.policy_id,
      paymentRecord.amount,
      paymentRecord.payment_date,
      paymentRecord.payment_method,
      paymentRecord.transaction_id,
      paymentRecord.status,
      paymentRecord.card_last_four,
      paymentRecord.card_holder,
    ]

    console.log("Ejecutando query:", query)
    console.log("Parámetros:", params)

    const result = await connection.query(query, params)

    const paymentId = result.insertId
    console.log(`Pago insertado con ID: ${paymentId}`)

    // Confirmar transacción
    await db.commitTransaction(connection)
    console.log(`Transacción confirmada`)

    res.status(201).json({
      message: "Pago registrado exitosamente",
      payment_id: paymentId,
      transaction_id: paymentRecord.transaction_id,
    })
  } catch (error) {
    // Revertir transacción en caso de error
    if (connection) {
      console.log(`Revirtiendo transacción debido a error`)
      await db.rollbackTransaction(connection)
    }
    logError(error, req, "crear pago")
    res.status(500).json({
      message: "Error interno del servidor al registrar pago",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Actualizar estado de un pago
router.put("/:id/status", authenticateToken, async (req, res) => {
  try {
    const paymentId = req.params.id
    const { status } = req.body
    console.log(`Actualizando estado del pago ID: ${paymentId} a ${status}`)

    if (!status || !["pending", "completed", "failed", "refunded"].includes(status)) {
      console.log(`Estado inválido: ${status}`)
      return res.status(400).json({
        message: "Estado inválido. Debe ser: pending, completed, failed o refunded",
      })
    }

    // Verificar que el pago exista y pertenezca al usuario
    const payments = await db.query(
      `SELECT p.* FROM payments p 
       JOIN policies po ON p.policy_id = po.id 
       WHERE p.id = ? AND po.user_id = ?`,
      [paymentId, req.user.userId],
    )

    if (payments.length === 0) {
      console.log(`Pago ID: ${paymentId} no encontrado para usuario ID: ${req.user.userId}`)
      return res.status(404).json({ message: "Pago no encontrado o no pertenece al usuario" })
    }

    // Actualizar estado
    await db.query(
      `UPDATE payments SET 
       status = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, paymentId],
    )
    console.log(`Estado del pago actualizado exitosamente`)

    res.json({
      message: "Estado del pago actualizado exitosamente",
      payment_id: paymentId,
      status: status,
    })
  } catch (error) {
    logError(error, req, "actualizar estado de pago")
    res.status(500).json({
      message: "Error interno del servidor al actualizar estado del pago",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

module.exports = router
