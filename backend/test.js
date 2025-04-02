const mysql = require("mysql2/promise")
const dotenv = require("dotenv")

// Cargar variables de entorno
dotenv.config()

async function testConnection() {
  try {
    // Configuración de la conexión
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "127.0.0.1",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "Puerts78.",
      database: process.env.DB_NAME || "segurototal",
    })

    console.log("✅ Conexión exitosa a MySQL")

    // Probar consulta simple
    const [rows] = await connection.execute("SELECT 1 as test")
    console.log("✅ Consulta exitosa:", rows)

    // Verificar tabla de usuarios
    try {
      const [users] = await connection.execute("DESCRIBE users")
      console.log(
        "✅ Tabla users existe:",
        users.map((row) => row.Field),
      )
    } catch (err) {
      console.error("❌ Error al verificar tabla users:", err.message)
    }

    // Cerrar conexión
    await connection.end()
  } catch (error) {
    console.error("❌ Error al conectar a MySQL:", error)
  }
}

testConnection()

