// Script para convertir un usuario en administrador
const dotenv = require("dotenv")
const db = require("./db")

// Cargar variables de entorno
dotenv.config()

// Función para convertir un usuario en administrador
async function makeUserAdmin(email) {
  try {
    console.log(`Intentando convertir al usuario ${email} en administrador...`)

    // Verificar si el usuario existe
    const users = await db.query("SELECT * FROM users WHERE email = ?", [email])

    if (users.length === 0) {
      console.error(`Error: El usuario con email ${email} no existe.`)
      process.exit(1)
    }

    const user = users[0]
    console.log(`Usuario encontrado: ${user.name} (ID: ${user.id})`)

    // Actualizar el rol del usuario a 'admin'
    await db.query("UPDATE users SET roles = 'admin' WHERE id = ?", [user.id])

    console.log(`✅ El usuario ${user.name} (${email}) ahora es administrador.`)

    // Verificar que el cambio se haya aplicado
    const updatedUsers = await db.query("SELECT * FROM users WHERE id = ?", [user.id])
    console.log(`Rol actualizado: ${updatedUsers[0].role}`)

    process.exit(0)
  } catch (error) {
    console.error("Error al convertir usuario en administrador:", error)
    process.exit(1)
  }
}

// Verificar argumentos
if (process.argv.length < 3) {
  console.error("Uso: node make-admin.js <email>")
  process.exit(1)
}

const email = process.argv[2]
makeUserAdmin(email)
