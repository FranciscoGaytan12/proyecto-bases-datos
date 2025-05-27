// Rutas para gestionar siniestros
const express = require("express")
const router = express.Router()
const db = require("../db")
const { authenticateToken } = require("../middleware/auth")
const { generateClaimNumber } = require("../utils/db-helpers")

// Middleware para logging detallado de errores
const logError = (error, req, operation) => {
  console.error(`Error en ${operation}:`, error)
  console.error(`Detalles de la petición:`)
  console.error(`- URL: ${req.originalUrl}`)
  console.error(`- Método: ${req.method}`)
  console.error(`- Usuario ID: ${req.user?.id || "No autenticado"}`)
  console.error(`- Parámetros:`, req.params)
  console.error(`- Query:`, req.query)
  console.error(`- Body:`, req.body)
  console.error(`- Stack:`, error.stack)
}

// Crear un nuevo siniestro
router.post("/:policyId", authenticateToken, async (req, res) => {
  let connection
  try {
    const policyId = req.params.policyId
    const userId = req.user.id
    const claimData = req.body

    console.log(`Creando nuevo siniestro para póliza ID: ${policyId} y usuario ID: ${userId}`, claimData)

    // Validar datos básicos
    if (!claimData.description || !claimData.incident_date || !claimData.location || !claimData.estimated_amount) {
      return res.status(400).json({
        message: "Faltan datos requeridos para el siniestro",
        errors: {
          description: !claimData.description ? "La descripción es requerida" : null,
          incident_date: !claimData.incident_date ? "La fecha del incidente es requerida" : null,
          location: !claimData.location ? "La ubicación es requerida" : null,
          estimated_amount: !claimData.estimated_amount ? "El monto estimado es requerido" : null,
        },
      })
    }

    // Verificar que la póliza exista y pertenezca al usuario
    const policies = await db.query("SELECT * FROM policies WHERE id = ? AND user_id = ?", [policyId, userId])

    if (policies.length === 0) {
      console.log(`Póliza ID: ${policyId} no encontrada para usuario ID: ${userId}`)
      return res.status(404).json({ message: "Póliza no encontrada o no pertenece al usuario" })
    }

    // Verificar que la póliza esté activa
    if (policies[0].status !== "active") {
      console.log(`Póliza ID: ${policyId} no está activa, estado actual: ${policies[0].status}`)
      return res.status(400).json({ message: "Solo se pueden crear siniestros para pólizas activas" })
    }

    // Generar número de siniestro único
    const claimNumber = generateClaimNumber()
    console.log(`Número de siniestro generado: ${claimNumber}`)

    // Iniciar transacción
    connection = await db.getTransaction()
    console.log(`Transacción iniciada`)

    // Insertar siniestro
    const result = await connection.query(
      `INSERT INTO claims (
        policy_id, 
        user_id, 
        claim_number, 
        incident_type, 
        status, 
        estimated_amount, 
        incident_date, 
        location, 
        description, 
        additional_info, 
        contact_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        policyId,
        userId,
        claimNumber,
        claimData.incident_type || "accident",
        "submitted",
        claimData.estimated_amount,
        claimData.incident_date,
        claimData.location,
        claimData.description,
        claimData.additional_info || null,
        claimData.contact_phone || null,
      ],
    )

    const claimId = result[0].insertId
    console.log(`Siniestro insertado con ID: ${claimId}`)

    // Registrar la primera actualización del siniestro
    await connection.query(
      `INSERT INTO claim_updates (claim_id, title, description, status_after, updated_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        claimId,
        "Siniestro registrado",
        "Tu siniestro ha sido registrado correctamente. Un agente revisará la información proporcionada.",
        "submitted",
        userId,
      ],
    )

    // Si hay fotos, registrarlas (en un entorno real, aquí se procesarían las subidas)
    if (claimData.photos && claimData.photos.length > 0) {
      console.log(`Registrando ${claimData.photos.length} fotos para el siniestro`)

      // En un entorno real, aquí se procesarían las subidas a un servicio de almacenamiento
      // Por ahora, solo registramos la información en la base de datos
      for (const photo of claimData.photos) {
        await connection.query(
          `INSERT INTO claim_photos (
            claim_id, 
            file_name, 
            file_path, 
            file_type, 
            file_size, 
            description
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            claimId,
            photo, // En un entorno real, esto sería el nombre del archivo
            `/uploads/claims/${claimId}/${photo}`, // Ruta simulada
            "image/jpeg", // Tipo simulado
            0, // Tamaño simulado
            `Foto del siniestro: ${photo}`, // Descripción simulada
          ],
        )
      }
    }

    // Confirmar transacción
    await db.commitTransaction(connection)
    console.log(`Transacción confirmada`)

    res.status(201).json({
      message: "Siniestro registrado exitosamente",
      claim_id: claimId,
      claim_number: claimNumber,
      status: "submitted",
    })
  } catch (error) {
    // Revertir transacción en caso de error
    if (connection) {
      console.log(`Revirtiendo transacción debido a error`)
      await db.rollbackTransaction(connection)
    }
    logError(error, req, "crear siniestro")
    res.status(500).json({
      message: "Error interno del servidor al registrar siniestro",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Obtener todos los siniestros del usuario
router.get("/", authenticateToken, async (req, res) => {
  try {
    console.log(`Obteniendo siniestros para usuario ID: ${req.user.id}`)

    const claims = await db.query(
      `SELECT c.*, p.policy_number, p.policy_type
       FROM claims c
       JOIN policies p ON c.policy_id = p.id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.id]
    )

    // Obtener las actualizaciones para cada siniestro
    for (let claim of claims) {
      const updates = await db.query(
        `SELECT * FROM claim_updates 
         WHERE claim_id = ? 
         ORDER BY created_at DESC`,
        [claim.id]
      )
      claim.updates = updates
    }

    console.log(`Se encontraron ${claims.length} siniestros`)
    res.json({ claims })
  } catch (error) {
    logError(error, req, "obtener siniestros")
    res.status(500).json({
      message: "Error interno del servidor al obtener siniestros",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    })
  }
})

// Obtener un siniestro específico
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const claimId = req.params.id
    console.log(`Obteniendo detalles del siniestro ID: ${claimId}`)

    const claims = await db.query(
      `SELECT c.*, p.policy_number, p.policy_type
       FROM claims c
       JOIN policies p ON c.policy_id = p.id
       WHERE c.id = ? AND c.user_id = ?`,
      [claimId, req.user.id]
    )

    if (claims.length === 0) {
      console.log(`Siniestro ID: ${claimId} no encontrado para usuario ID: ${req.user.id}`)
      return res.status(404).json({ message: "Siniestro no encontrado" })
    }

    // Obtener actualizaciones del siniestro
    const claim = claims[0]
    const updates = await db.query(
      `SELECT * FROM claim_updates 
       WHERE claim_id = ? 
       ORDER BY created_at DESC`,
      [claimId]
    )
    claim.updates = updates

    console.log(`Siniestro encontrado: ${claim.id}`)
    res.json({ claim })
  } catch (error) {
    logError(error, req, "obtener detalles de siniestro")
    res.status(500).json({
      message: "Error interno del servidor al obtener detalles del siniestro",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    })
  }
})

// Cancelar un siniestro
router.post("/:claimId/cancel", authenticateToken, async (req, res) => {
  try {
    const claimId = req.params.claimId
    const userId = req.user.id
    console.log(`Cancelando siniestro ID: ${claimId} para usuario ID: ${userId}`)

    // Verificar que el siniestro exista y pertenezca al usuario
    const claims = await db.query("SELECT * FROM claims WHERE id = ? AND user_id = ?", [claimId, userId])

    if (claims.length === 0) {
      console.log(`Siniestro ID: ${claimId} no encontrado para usuario ID: ${userId}`)
      return res.status(404).json({ message: "Siniestro no encontrado" })
    }

    const claim = claims[0]

    // Verificar que el siniestro esté en un estado que permita cancelación
    if (claim.status !== "submitted" && claim.status !== "under_review") {
      console.log(`Siniestro ID: ${claimId} no puede ser cancelado, estado actual: ${claim.status}`)
      return res.status(400).json({
        message: "Solo se pueden cancelar siniestros en estado 'enviado' o 'en revisión'",
      })
    }

    // Actualizar estado del siniestro
    await db.query(
      `UPDATE claims SET 
       status = 'cancelled',
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [claimId],
    )

    // Registrar actualización
    await db.query(
      `INSERT INTO claim_updates (claim_id, title, description, status_before, status_after, updated_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        claimId,
        "Siniestro cancelado",
        "El siniestro ha sido cancelado por el usuario.",
        claim.status,
        "cancelled",
        userId,
      ],
    )

    console.log(`Siniestro ID: ${claimId} cancelado exitosamente`)

    res.json({
      message: "Siniestro cancelado exitosamente",
      claim_id: claimId,
      status: "cancelled",
    })
  } catch (error) {
    logError(error, req, "cancelar siniestro")
    res.status(500).json({
      message: "Error interno del servidor al cancelar siniestro",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

module.exports = router
