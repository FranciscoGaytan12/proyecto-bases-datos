// Servidor Express para manejar la conexión a MySQL y autenticación
const express = require("express")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")
const db = require("./db")

// Importar rutas
const agentesRoutes = require('./routes/agentes-routes');

// Cargar variables de entorno
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Actualizar la configuración de CORS
const corsOptions = {
  origin: "*", // Permite todas las conexiones durante el desarrollo
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}

app.use(cors(corsOptions))
app.use(express.json())

// Rutas
app.use('/api/agentes', agentesRoutes);

// Middleware para mostrar información de las peticiones
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  console.log("Headers:", req.headers)
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Body:", JSON.stringify(req.body, null, 2))
  }
  next()
})

// Middleware para manejar errores
app.use((err, req, res, next) => {
  console.error("Error no controlado:", err)
  res.status(500).json({ message: "Error interno del servidor" })
})

// Ruta para registrar un nuevo usuario
app.post("/api/register", async (req, res) => {
  try {
    console.log("Datos recibidos:", req.body)
    const { email, password, name } = req.body

    // Validar datos
    if (!email || !password) {
      console.log("Validación fallida: email o contraseña faltantes")
      return res.status(400).json({ message: "Email y contraseña son requeridos" })
    }

    // Verificar si el usuario ya existe
    console.log("Verificando si el usuario existe...")
    const existingUsers = await db.query("SELECT * FROM users WHERE email = ?", [email])
    console.log("Usuarios existentes encontrados:", existingUsers.length)

    if (existingUsers.length > 0) {
      console.log("Usuario ya existe:", email)
      return res.status(409).json({ message: "El usuario ya existe" })
    }

    // Encriptar contraseña
    console.log("Encriptando contraseña...")
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log("Contraseña encriptada correctamente")

    // Insertar nuevo usuario
    console.log("Insertando nuevo usuario...")
    const result = await db.query("INSERT INTO users (email, password, name) VALUES (?, ?, ?)", [
      email,
      hashedPassword,
      name || "",
    ])
    console.log("Usuario insertado correctamente:", result)

    res.status(201).json({ message: "Usuario registrado exitosamente", userId: result.insertId })
  } catch (error) {
    console.error("Error detallado al registrar usuario:", error)
    console.error("Stack trace:", error.stack)

    // Enviar respuesta con detalles del error
    res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
    })
  }
})

// Ruta para iniciar sesión
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body
    console.log("Login attempt:", { email })

    // Validar datos
    if (!email || !password) {
      console.log("Missing email or password")
      return res.status(400).json({ message: "Email y contraseña son requeridos" })
    }

    // Buscar usuario
    const users = await db.query("SELECT * FROM users WHERE email = ?", [email])
    console.log("Found users:", users.length)

    if (users.length === 0) {
      console.log("No user found with email:", email)
      return res.status(401).json({ message: "Credenciales inválidas" })
    }

    const user = users[0]
    console.log("Found user:", { id: user.id, email: user.email, role: user.role })

    // Verificar contraseña
    console.log("Comparing passwords...")
    const passwordMatch = await bcrypt.compare(password, user.password)
    console.log("Password match:", passwordMatch)

    if (!passwordMatch) {
      console.log("Invalid password for user:", email)
      return res.status(401).json({ message: "Credenciales inválidas" })
    }

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "1h" }
    )

    console.log("Login successful, generated token")

    // Enviar respuesta
    res.json({
      message: "Inicio de sesión exitoso",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error("Error al iniciar sesión:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
})

// Middleware para verificar token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Token no proporcionado" })
  }

  jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret", (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token inválido" })
    }

    req.user = user
    next()
  })
}

// Middleware para verificar rol de administrador
function isAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Acceso denegado. Se requiere rol de administrador" })
  }
  next()
}

// Ruta protegida para obtener perfil de usuario
app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const users = await db.query("SELECT id, email, name, created_at FROM users WHERE id = ?", [req.user.userId])

    if (users.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    res.json({ user: users[0] })
  } catch (error) {
    console.error("Error al obtener perfil:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
})

// Ruta para obtener todas las pólizas de un usuario
app.get("/api/policies", authenticateToken, async (req, res) => {
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

// Ruta para obtener detalles de una póliza específica
app.get("/api/policies/:id", authenticateToken, async (req, res) => {
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

// Ruta para crear una nueva póliza (ejemplo)
app.post("/api/policies", authenticateToken, async (req, res) => {
  let connection
  try {
    const { policy_type, start_date, end_date, premium, coverage_amount, beneficiaries } = req.body

    // Validar datos
    if (!policy_type || !start_date || !end_date || !premium || !coverage_amount) {
      return res.status(400).json({ message: "Todos los campos son requeridos" })
    }

    // Generar número de póliza único
    const policyNumber = `POL-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Iniciar transacción
    connection = await db.getTransaction()

    // Insertar póliza
    const result = await connection.query(
      `INSERT INTO policies 
       (user_id, policy_number, policy_type, start_date, end_date, premium, coverage_amount, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [req.user.userId, policyNumber, policy_type, start_date, end_date, premium, coverage_amount],
    )

    const policyId = result[0].insertId

    // Insertar beneficiarios si existen
    if (beneficiaries && beneficiaries.length > 0) {
      for (const beneficiary of beneficiaries) {
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

// Ruta para obtener todos los usuarios (solo admin)
app.get("/api/admin/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await db.query(
      "SELECT id, email, name, role, created_at, updated_at FROM users ORDER BY created_at DESC",
    )

    res.json({ users })
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
})

// Importar rutas de comentarios
const commentRoutes = require('./routes/comment-routes')
// Importar rutas de pagos
const paymentRoutes = require('./routes/payment-routes')

// Usar rutas de comentarios bajo el prefijo /api/comments
app.use('/api/comments', commentRoutes)
// Usar rutas de pagos bajo el prefijo /api/payments
app.use('/api/payments', paymentRoutes)

// Ruta de prueba
app.get("/api/test", (req, res) => {
  res.json({ message: "API funcionando correctamente", timestamp: new Date().toISOString() })
})

// Ruta de prueba para la base de datos
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await db.query("SELECT 1 as test")
    res.json({ message: "Conexión a base de datos exitosa", result })
  } catch (error) {
    console.error("Error en prueba de base de datos:", error)
    res.status(500).json({ message: "Error al conectar con la base de datos", error: error.message })
  }
})
// Las rutas de pagos se manejan en routes/payment-routes.js
// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`)

  // Verificar conexión a la base de datos
  const isConnected = await db.checkDatabaseConnection()

  if (isConnected) {
    // Inicializar la base de datos
    await db.initializeDatabase()
  }
})