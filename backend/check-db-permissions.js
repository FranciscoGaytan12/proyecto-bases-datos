// Script para verificar los permisos de escritura en la base de datos
const mysql = require("mysql2/promise")
require("dotenv").config()

async function checkDatabasePermissions() {
  console.log("=== VERIFICACIÓN DE PERMISOS DE BASE DE DATOS ===")
  console.log("Fecha y hora:", new Date().toISOString())
  console.log("")

  // Configuración de la conexión
  const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "Puertas78.",
    database: process.env.DB_NAME || "segurototal",
    port: process.env.DB_PORT || 3306,
  }

  console.log("Configuración de conexión:")
  console.log(`- Host: ${dbConfig.host}`)
  console.log(`- Puerto: ${dbConfig.port}`)
  console.log(`- Usuario: ${dbConfig.user}`)
  console.log(`- Base de datos: ${dbConfig.database}`)
  console.log(`- Contraseña: ${dbConfig.password ? "***Configurada***" : "No configurada"}`)
  console.log("")

  let connection
  try {
    // Conectar a la base de datos
    console.log("Conectando a la base de datos...")
    connection = await mysql.createConnection(dbConfig)
    console.log("✅ Conexión establecida")
    console.log("")

    // Verificar permisos del usuario
    console.log("Verificando permisos del usuario...")
    const [grants] = await connection.query("SHOW GRANTS FOR CURRENT_USER()")

    console.log("Permisos encontrados:")
    grants.forEach((grant, index) => {
      const grantStr = Object.values(grant)[0]
      console.log(`${index + 1}. ${grantStr}`)
    })
    console.log("")

    // Verificar si tiene permisos de escritura
    const hasWritePermissions = grants.some((grant) => {
      const grantStr = Object.values(grant)[0].toString().toUpperCase()
      return (
        grantStr.includes("ALL PRIVILEGES") ||
        (grantStr.includes("INSERT") && grantStr.includes("UPDATE") && grantStr.includes("DELETE"))
      )
    })

    if (hasWritePermissions) {
      console.log("✅ El usuario tiene permisos de escritura")
    } else {
      console.error("❌ El usuario NO tiene todos los permisos necesarios para escritura")
      console.log("Se requieren permisos de INSERT, UPDATE y DELETE")
    }
    console.log("")

    // Probar operaciones de escritura
    console.log("Probando operaciones de escritura...")

    // 1. Crear tabla de prueba
    console.log("1. Creando tabla de prueba...")
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS write_test (
          id INT AUTO_INCREMENT PRIMARY KEY,
          test_value VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log("✅ Tabla de prueba creada exitosamente")
    } catch (error) {
      console.error("❌ Error al crear tabla de prueba:", error.message)
      console.log("Esto indica problemas con el permiso CREATE TABLE")
    }

    // 2. Insertar registro
    console.log("2. Insertando registro de prueba...")
    let insertId
    try {
      const testValue = `test-${Date.now()}`
      const [result] = await connection.query("INSERT INTO write_test (test_value) VALUES (?)", [testValue])
      insertId = result.insertId
      console.log(`✅ Registro insertado exitosamente con ID: ${insertId}`)
    } catch (error) {
      console.error("❌ Error al insertar registro:", error.message)
      console.log("Esto indica problemas con el permiso INSERT")
    }

    // 3. Actualizar registro
    if (insertId) {
      console.log("3. Actualizando registro de prueba...")
      try {
        const newValue = `updated-${Date.now()}`
        await connection.query("UPDATE write_test SET test_value = ? WHERE id = ?", [newValue, insertId])
        console.log("✅ Registro actualizado exitosamente")
      } catch (error) {
        console.error("❌ Error al actualizar registro:", error.message)
        console.log("Esto indica problemas con el permiso UPDATE")
      }
    }

    // 4. Eliminar registro
    if (insertId) {
      console.log("4. Eliminando registro de prueba...")
      try {
        await connection.query("DELETE FROM write_test WHERE id = ?", [insertId])
        console.log("✅ Registro eliminado exitosamente")
      } catch (error) {
        console.error("❌ Error al eliminar registro:", error.message)
        console.log("Esto indica problemas con el permiso DELETE")
      }
    }

    // 5. Probar transacciones
    console.log("5. Probando transacciones...")
    try {
      // Iniciar transacción
      await connection.beginTransaction()
      console.log("✅ Transacción iniciada")

      // Insertar en transacción
      const testValue = `transaction-${Date.now()}`
      const [result] = await connection.query("INSERT INTO write_test (test_value) VALUES (?)", [testValue])
      console.log(`✅ Registro insertado en transacción con ID: ${result.insertId}`)

      // Confirmar transacción
      await connection.commit()
      console.log("✅ Transacción confirmada exitosamente")

      // Eliminar el registro de prueba
      await connection.query("DELETE FROM write_test WHERE id = ?", [result.insertId])
      console.log("✅ Registro de transacción eliminado")
    } catch (error) {
      console.error("❌ Error en prueba de transacción:", error.message)
      if (connection) {
        await connection.rollback()
        console.log("Transacción revertida")
      }
    }

    // 6. Verificar tablas principales
    console.log("\nVerificando tablas principales...")
    const mainTables = ["policies", "payments", "claims"]

    for (const table of mainTables) {
      try {
        const [result] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`)
        console.log(`✅ Tabla '${table}': ${result[0].count} registros`)

        // Probar inserción en cada tabla principal
        console.log(`Probando inserción en tabla '${table}'...`)

        if (table === "policies") {
          // Obtener un usuario para la prueba
          const [users] = await connection.query("SELECT id FROM users LIMIT 1")
          if (users.length === 0) {
            console.log("⚠️ No se encontraron usuarios para la prueba")
            continue
          }

          const userId = users[0].id
          const policyNumber = `TEST-${Date.now()}`

          try {
            await connection.beginTransaction()

            const [result] = await connection.query(
              `
              INSERT INTO policies 
              (user_id, policy_number, policy_type, start_date, end_date, premium, coverage_amount, status) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
              [
                userId,
                policyNumber,
                "auto",
                new Date(),
                new Date(Date.now() + 31536000000), // Un año después
                100.0,
                10000.0,
                "active",
              ],
            )

            console.log(`✅ Póliza de prueba insertada con ID: ${result.insertId}`)

            // Eliminar la póliza de prueba
            await connection.query("DELETE FROM policies WHERE policy_number = ?", [policyNumber])
            console.log("✅ Póliza de prueba eliminada")

            await connection.commit()
          } catch (error) {
            console.error(`❌ Error al insertar en '${table}':`, error.message)
            await connection.rollback()
          }
        } else if (table === "payments") {
          // Obtener una póliza para la prueba
          const [policies] = await connection.query("SELECT id FROM policies LIMIT 1")
          if (policies.length === 0) {
            console.log("⚠️ No se encontraron pólizas para la prueba")
            continue
          }

          const policyId = policies[0].id
          const transactionId = `TR-${Date.now()}`

          try {
            await connection.beginTransaction()

            const [result] = await connection.query(
              `
              INSERT INTO payments 
              (policy_id, amount, payment_date, payment_method, transaction_id, status) 
              VALUES (?, ?, ?, ?, ?, ?)
            `,
              [policyId, 100.0, new Date(), "credit_card", transactionId, "completed"],
            )

            console.log(`✅ Pago de prueba insertado con ID: ${result.insertId}`)

            // Eliminar el pago de prueba
            await connection.query("DELETE FROM payments WHERE transaction_id = ?", [transactionId])
            console.log("✅ Pago de prueba eliminado")

            await connection.commit()
          } catch (error) {
            console.error(`❌ Error al insertar en '${table}':`, error.message)
            await connection.rollback()
          }
        } else if (table === "claims") {
          // Obtener una póliza y usuario para la prueba
          const [policies] = await connection.query("SELECT id, user_id FROM policies LIMIT 1")
          if (policies.length === 0) {
            console.log("⚠️ No se encontraron pólizas para la prueba")
            continue
          }

          const policyId = policies[0].id
          const userId = policies[0].user_id
          const claimNumber = `CLAIM-${Date.now()}`

          try {
            await connection.beginTransaction()

            const [result] = await connection.query(
              `
              INSERT INTO claims 
              (policy_id, user_id, claim_number, incident_type, status, estimated_amount, incident_date, location, description) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
              [
                policyId,
                userId,
                claimNumber,
                "accident",
                "submitted",
                500.0,
                new Date(),
                "Test Location",
                "Test claim description",
              ],
            )

            console.log(`✅ Siniestro de prueba insertado con ID: ${result.insertId}`)

            // Eliminar el siniestro de prueba
            await connection.query("DELETE FROM claims WHERE claim_number = ?", [claimNumber])
            console.log("✅ Siniestro de prueba eliminado")

            await connection.commit()
          } catch (error) {
            console.error(`❌ Error al insertar en '${table}':`, error.message)
            await connection.rollback()
          }
        }
      } catch (error) {
        console.error(`❌ Error al verificar tabla '${table}':`, error.message)
      }
    }

    console.log("\n=== RESUMEN DE LA VERIFICACIÓN ===")
    console.log("✅ Conexión a la base de datos: Exitosa")
    console.log(`✅ Tablas verificadas: ${mainTables.length}`)
    console.log("")
    console.log("Si todas las pruebas de escritura fueron exitosas, los permisos de base de datos están correctos.")
    console.log("Si hubo errores, revisa los mensajes específicos para identificar el problema.")
  } catch (error) {
    console.error("❌ Error durante la verificación:", error.message)
    console.error("Detalles:", error)
  } finally {
    if (connection) {
      console.log("\nCerrando conexión...")
      await connection.end()
      console.log("Conexión cerrada")
    }
  }
}

// Ejecutar la verificación
checkDatabasePermissions()
  .then(() => {
    console.log("\nVerificación completada")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\nError en la verificación:", error)
    process.exit(1)
  })
