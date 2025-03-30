// Servidor Express para manejar la conexión a MySQL y autenticación
const express = require("express")
const mysql = require("mysql2/promise")
const cors = require("cors")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")

// Cargar variables de entorno
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Configuración de la conexión a MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "segurototal",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// Verificar conexión a la base de datos
async function checkDatabaseConnection() {
  try {
    const connection = await pool.getConnection()
    console.log("Conexión a MySQL establecida correctamente")
    connection.release()
    return true
  } catch (error) {
    console.error("Error al conectar a MySQL:", error)
    return false
  }
}

// Inicializar la base de datos (crear tablas si no existen)
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection()

    // Crear tabla de usuarios si no existe
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    console.log("Base de datos inicializada correctamente")
    connection.release()
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error)
  }
}

// Ruta para registrar un nuevo usuario
app.post("/api/register", async (req, res) => {
  try {
    const { email, password, name } = req.body

    // Validar datos
    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son requeridos" })
    }

    // Verificar si el usuario ya existe
    const [existingUsers] = await pool.query("SELECT * FROM users WHERE email = ?", [email])

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: "El usuario ya existe" })
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insertar nuevo usuario
    await pool.query("INSERT INTO users (email, password, name) VALUES (?, ?, ?)", [email, hashedPassword, name || ""])

    res.status(201).json({ message: "Usuario registrado exitosamente" })
  } catch (error) {
    console.error("Error al registrar usuario:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
})

// Ruta para iniciar sesión
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Validar datos
    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son requeridos" })
    }

    // Buscar usuario
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email])

    if (users.length === 0) {
      return res.status(401).json({ message: "Credenciales inválidas" })
    }

    const user = users[0]

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return res.status(401).json({ message: "Credenciales inválidas" })
    }

    // Generar token JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || "your_jwt_secret", {
      expiresIn: "1h",
    })

    // Enviar respuesta
    res.json({
      message: "Inicio de sesión exitoso",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
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

// Ruta protegida de ejemplo
app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query("SELECT id, email, name, created_at FROM users WHERE id = ?", [req.user.userId])

    if (users.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    res.json({ user: users[0] })
  } catch (error) {
    console.error("Error al obtener perfil:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
})

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`)

  // Verificar conexión a la base de datos
  const isConnected = await checkDatabaseConnection()

  if (isConnected) {
    // Inicializar la base de datos
    await initializeDatabase()
  }
})

