const mysql = require("mysql2/promise")
const bcrypt = require("bcryptjs")
const dotenv = require("dotenv")

// Cargar variables de entorno
dotenv.config()

async function testRegister() {
  let connection
  try {
    // Configuración de la conexión
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "segurototal",
    })

    console.log("✅ Conexión exitosa a MySQL")

    // Verificar si la tabla users existe
    try {
      const [tables] = await connection.execute("SHOW TABLES LIKE 'users'")
      if (tables.length === 0) {
        console.error("❌ La tabla users no existe")

        // Crear la tabla users
        console.log("Creando tabla users...")
        await connection.execute(`
          CREATE TABLE users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255),
            role ENUM('user', 'admin') DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `)
        console.log("✅ Tabla users creada correctamente")
      } else {
        console.log("✅ Tabla users existe")

        // Mostrar estructura de la tabla
        const [columns] = await connection.execute("DESCRIBE users")
        console.log("Estructura de la tabla users:")
        columns.forEach((col) => {
          console.log(
            `- ${col.Field}: ${col.Type} ${col.Null === "NO" ? "NOT NULL" : ""} ${col.Key === "PRI" ? "PRIMARY KEY" : ""}`,
          )
        })
      }

      // Probar inserción de usuario
      const testEmail = `test_${Date.now()}@example.com`
      const testPassword = "password123"
      const testName = "Usuario de Prueba"

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(testPassword, 10)

      console.log("Intentando registrar usuario de prueba...")

      // Insertar usuario
      const [result] = await connection.execute("INSERT INTO users (email, password, name) VALUES (?, ?, ?)", [
        testEmail,
        hashedPassword,
        testName,
      ])

      console.log(`✅ Usuario de prueba registrado correctamente con ID: ${result.insertId}`)

      // Verificar que el usuario se haya insertado
      const [users] = await connection.execute("SELECT id, email, name FROM users WHERE email = ?", [testEmail])
      console.log("Usuario insertado:", users[0])

      // Eliminar usuario de prueba
      await connection.execute("DELETE FROM users WHERE email = ?", [testEmail])
      console.log("✅ Usuario de prueba eliminado correctamente")
    } catch (err) {
      console.error("❌ Error al verificar o crear tabla users:", err)
    }
  } catch (error) {
    console.error("❌ Error al conectar a MySQL:", error)
  } finally {
    if (connection) {
      await connection.end()
      console.log("Conexión cerrada")
    }
  }
}

testRegister()

