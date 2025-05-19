// Script para verificar los usuarios en la base de datos
const dotenv = require("dotenv")
const db = require("./db")

// Cargar variables de entorno
dotenv.config()

// Función para verificar los usuarios
async function checkUsers() {
  try {
    console.log("Verificando conexión a la base de datos...")

    // Verificar conexión a la base de datos
    const isConnected = await db.checkDatabaseConnection()
    if (!isConnected) {
      console.error("❌ No se pudo conectar a la base de datos. Verifica la configuración.")
      process.exit(1)
    }

    console.log("✅ Conexión a la base de datos establecida")

    // Verificar si existe la tabla de usuarios
    console.log("Verificando si existe la tabla de usuarios...")
    try {
      await db.query("SELECT 1 FROM users LIMIT 1")
      console.log("✅ La tabla de usuarios existe")
    } catch (error) {
      console.error("❌ La tabla de usuarios no existe o hay un problema con ella:", error.message)
      console.log("Ejecutando inicialización de la base de datos...")
      await db.initializeDatabase()
      console.log("✅ Base de datos inicializada")
    }

    // Obtener todos los usuarios
    console.log("\nListando todos los usuarios:")
    const users = await db.query("SELECT id, email, name, roles, created_at FROM users ORDER BY id")

    if (users.length === 0) {
      console.log("No hay usuarios registrados en la base de datos.")
      console.log("\nPuedes crear un usuario administrador ejecutando:")
      console.log("node backend/create-admin.js")
    } else {
      console.log(`Se encontraron ${users.length} usuarios:`)
      console.log("---------------------------------------------")
      users.forEach((user) => {
        console.log(`ID: ${user.id}`)
        console.log(`Email: ${user.email}`)
        console.log(`Nombre: ${user.roles || "Sin nombre"}`)
        console.log(`Rol: ${user.name || "usuario"}`)
        console.log(`Fecha de registro: ${new Date(user.created_at).toLocaleString()}`)
        console.log("---------------------------------------------")
      })

      // Verificar si hay usuarios administradores
      const admins = users.filter((user) => user.roles === "admin")
      if (admins.length === 0) {
        console.log("\n⚠️ No hay usuarios con rol de administrador.")
        console.log("Para convertir un usuario existente en administrador, ejecuta:")
        console.log(`node backend/make-admin.js <email>`)
        console.log("\nPara crear un nuevo usuario administrador, ejecuta:")
        console.log("node backend/create-admin.js")
      } else {
        console.log(`\n✅ Se encontraron ${admins.length} usuarios administradores:`)
        admins.forEach((admin) => {
          console.log(`- ${admin.email} (${admin.name || "Sin nombre"})`)
        })
      }
    }

    process.exit(0)
  } catch (error) {
    console.error("❌ Error al verificar usuarios:", error)
    console.error("Stack trace:", error.stack)
    process.exit(1)
  }
}

// Ejecutar la función
checkUsers()
