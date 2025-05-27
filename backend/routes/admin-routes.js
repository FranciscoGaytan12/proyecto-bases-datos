const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const { User, validate } = require("../models/user")
const { Policy } = require("../models/policy")
const { generatePassword, sendPasswordByEmail } = require("../utils/password-utils")
const { sendEmail } = require("../utils/email-utils")
const { query, getTransaction, commitTransaction, rollbackTransaction } = require("../db")

// Middleware para autenticación
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]
  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}

// Middleware para autorización de administrador
function authorizeAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Acceso prohibido. Se requiere rol de administrador." })
  }
  next()
}

// Ruta para obtener todos los usuarios (solo para administradores)
router.get("/users", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const users = await query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.created_at,
        COUNT(p.id) as policy_count
      FROM users u 
      LEFT JOIN policies p ON u.id = p.user_id 
      GROUP BY u.id, u.name, u.email, u.role, u.created_at
      ORDER BY u.created_at DESC
    `)

    res.json(users)
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    res.status(500).json({ message: "Error al obtener usuarios" })
  }
})

// Ruta para obtener información detallada de un usuario antes de eliminarlo
router.get("/users/:id/deletion-info", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const userId = req.params.id

    // Obtener información del usuario
    const userResult = await query("SELECT id, name, email, role FROM users WHERE id = ?", [userId])

    if (userResult.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    const user = userResult[0]

    // Verificar si es administrador
    if (user.role === "admin") {
      return res.status(400).json({
        message: "No se puede eliminar un usuario administrador",
        canDelete: false,
      })
    }

    // Obtener pólizas asociadas
    const policies = await query(
      `
      SELECT 
        id, 
        policy_type, 
        status, 
        premium_amount, 
        start_date, 
        end_date 
      FROM policies 
      WHERE user_id = ?
    `,
      [userId],
    )

    // Obtener pagos asociados
    const payments = await query(
      `
      SELECT COUNT(*) as payment_count, SUM(amount) as total_amount 
      FROM payments 
      WHERE user_id = ?
    `,
      [userId],
    )

    // Obtener siniestros asociados
    const claims = await query(
      `
      SELECT COUNT(*) as claim_count 
      FROM claims c
      JOIN policies p ON c.policy_id = p.id
      WHERE p.user_id = ?
    `,
      [userId],
    )

    res.json({
      user,
      policies,
      paymentInfo: payments[0] || { payment_count: 0, total_amount: 0 },
      claimInfo: claims[0] || { claim_count: 0 },
      canDelete: true,
      totalItemsToDelete: policies.length + (payments[0]?.payment_count || 0) + (claims[0]?.claim_count || 0),
    })
  } catch (error) {
    console.error("Error al obtener información de eliminación:", error)
    res.status(500).json({ message: "Error al obtener información del usuario" })
  }
})

// Ruta para eliminar un usuario y todos sus datos asociados (solo para administradores)
router.delete("/users/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  let connection = null

  try {
    const userId = req.params.id

    // Verificar si el usuario existe
    const userResult = await query("SELECT id, name, email, role FROM users WHERE id = ?", [userId])

    if (userResult.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    const user = userResult[0]

    // Verificar si es administrador
    if (user.role === "admin") {
      return res.status(400).json({ message: "No se puede eliminar un usuario administrador" })
    }

    // Verificar si el usuario que intenta eliminar es el mismo
    if (Number.parseInt(userId) === req.user.userId) {
      return res.status(400).json({ message: "No puedes eliminarte a ti mismo" })
    }

    // Iniciar transacción
    connection = await getTransaction()

    console.log(`Iniciando eliminación en cascada para usuario ID: ${userId}`)

    // 1. Eliminar fotos de siniestros asociadas a las pólizas del usuario
    await connection.execute(
      `
      DELETE cp FROM claim_photos cp
      JOIN claims c ON cp.claim_id = c.id
      JOIN policies p ON c.policy_id = p.id
      WHERE p.user_id = ?
    `,
      [userId],
    )

    // 2. Eliminar actualizaciones de siniestros asociadas a las pólizas del usuario
    await connection.execute(
      `
      DELETE cu FROM claim_updates cu
      JOIN claims c ON cu.claim_id = c.id
      JOIN policies p ON c.policy_id = p.id
      WHERE p.user_id = ?
    `,
      [userId],
    )

    // 3. Eliminar siniestros asociados a las pólizas del usuario
    await connection.execute(
      `
      DELETE c FROM claims c
      JOIN policies p ON c.policy_id = p.id
      WHERE p.user_id = ?
    `,
      [userId],
    )

    // 4. Eliminar pagos del usuario
    await connection.execute("DELETE FROM payments WHERE user_id = ?", [userId])

    // 5. Eliminar pólizas del usuario
    const policiesResult = await connection.execute("SELECT COUNT(*) as count FROM policies WHERE user_id = ?", [
      userId,
    ])
    const policyCount = policiesResult[0][0].count

    await connection.execute("DELETE FROM policies WHERE user_id = ?", [userId])

    // 6. Finalmente, eliminar el usuario
    await connection.execute("DELETE FROM users WHERE id = ?", [userId])

    // Confirmar transacción
    await commitTransaction(connection)

    console.log(`✅ Usuario eliminado exitosamente: ${user.name} (${user.email})`)
    console.log(`📊 Elementos eliminados: ${policyCount} pólizas y datos asociados`)

    res.json({
      message: "Usuario y todos sus datos asociados eliminados exitosamente",
      deletedUser: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      deletedPolicies: policyCount,
    })
  } catch (error) {
    console.error("Error al eliminar usuario:", error)

    // Revertir transacción en caso de error
    if (connection) {
      await rollbackTransaction(connection)
    }

    res.status(500).json({
      message: "Error al eliminar usuario y sus datos asociados",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Resto de las rutas existentes...
router.post("/users", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { error } = validate(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    let user = await User.findOne({ email: req.body.email })
    if (user) return res.status(400).send("El usuario ya está registrado.")

    user = new User({
      ...req.body,
    })

    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(user.password, salt)

    await user.save()

    res.status(201).json({ message: "Usuario creado exitosamente", userId: user._id })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al crear usuario" })
  }
})

router.put("/users/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const userId = req.params.id

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    const { error } = validate(req.body)
    if (error) {
      return res.status(400).send(error.details[0].message)
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
      },
      { new: true },
    )

    res.json({ message: "Usuario actualizado exitosamente", user: updatedUser })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al actualizar usuario" })
  }
})

router.post("/users/:id/reset-password", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const userId = req.params.id

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    const newPassword = generatePassword()

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    user.password = hashedPassword
    await user.save()

    await sendPasswordByEmail(user.email, newPassword)

    res.json({ message: "Contraseña restablecida y enviada al usuario por correo electrónico" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al restablecer la contraseña" })
  }
})

router.get("/policies", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const policies = await Policy.find().populate("userId", "name email")
    res.json(policies)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al obtener pólizas" })
  }
})

router.delete("/policies/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const policyId = req.params.id

    const policy = await Policy.findById(policyId)
    if (!policy) {
      return res.status(404).json({ message: "Póliza no encontrada" })
    }

    await Policy.findByIdAndDelete(policyId)

    res.json({ message: "Póliza eliminada exitosamente" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al eliminar póliza" })
  }
})

router.put("/policies/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const policyId = req.params.id

    const policy = await Policy.findById(policyId)
    if (!policy) {
      return res.status(404).json({ message: "Póliza no encontrada" })
    }

    const updatedPolicy = await Policy.findByIdAndUpdate(
      policyId,
      {
        ...req.body,
      },
      { new: true },
    )

    res.json({ message: "Póliza actualizada exitosamente", policy: updatedPolicy })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al actualizar póliza" })
  }
})

const { updatePolicyStatus } = require("../update-policy-status")

router.post("/update-policy-status", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    console.log(`Actualizando estado de pólizas manualmente por admin ID: ${req.user.userId}`)

    const result = await updatePolicyStatus()

    res.json({
      message: "Estados de pólizas actualizados correctamente",
      ...result,
    })
  } catch (error) {
    console.error("Error al actualizar estados de pólizas:", error)
    res.status(500).json({
      message: "Error interno del servidor al actualizar estados de pólizas",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

module.exports = router
