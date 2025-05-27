const axios = require("axios")
const db = require("./db")

const API_BASE_URL = process.env.API_URL || "http://localhost:5000/api"

async function testPolicyRoutes() {
  console.log("🧪 Probando rutas de pólizas...")

  try {
    // Primero verificar que hay datos en la base de datos
    console.log("📊 Verificando datos en la base de datos...")
    const [policies] = await db.query("SELECT id, policy_number, status, user_id FROM policies ORDER BY id")
    console.log(`📈 Pólizas encontradas: ${policies.length}`)

    if (policies.length === 0) {
      console.log("❌ No hay pólizas en la base de datos. Ejecuta fix-policy-data.js primero")
      return
    }

    // Mostrar pólizas disponibles
    console.log("📋 Pólizas disponibles:")
    policies.forEach((policy) => {
      console.log(`  - ID: ${policy.id}, Número: ${policy.policy_number}, Estado: ${policy.status}`)
    })

    // Verificar que el servidor esté corriendo
    console.log("🌐 Verificando servidor...")
    try {
      const response = await axios.get(`${API_BASE_URL}/test`)
      console.log("✅ Servidor respondiendo:", response.data)
    } catch (error) {
      console.log("❌ Servidor no responde. Asegúrate de que esté corriendo en el puerto correcto")
      console.log("💡 Ejecuta: cd backend && node server.js")
      return
    }

    // Crear un usuario de prueba y obtener token
    console.log("👤 Creando sesión de prueba...")
    const testUser = await createTestSession()

    if (!testUser.token) {
      console.log("❌ No se pudo crear sesión de prueba")
      return
    }

    console.log("✅ Token obtenido:", testUser.token.substring(0, 20) + "...")

    // Probar obtener pólizas
    console.log("📋 Probando GET /policies...")
    try {
      const response = await axios.get(`${API_BASE_URL}/policies`, {
        headers: { Authorization: `Bearer ${testUser.token}` },
      })
      console.log("✅ Pólizas obtenidas:", response.data.policies?.length || 0)
    } catch (error) {
      console.log("❌ Error obteniendo pólizas:", error.response?.data || error.message)
    }

    // Probar obtener detalles de una póliza específica
    const testPolicyId = policies[0].id
    console.log(`🔍 Probando GET /policies/${testPolicyId}...`)
    try {
      const response = await axios.get(`${API_BASE_URL}/policies/${testPolicyId}`, {
        headers: { Authorization: `Bearer ${testUser.token}` },
      })
      console.log("✅ Detalles de póliza obtenidos:", response.data.policy?.policy_number)
    } catch (error) {
      console.log("❌ Error obteniendo detalles:", error.response?.data || error.message)
    }

    // Probar cancelar póliza (solo si está activa)
    const activePolicies = policies.filter((p) => p.status === "active")
    if (activePolicies.length > 0) {
      const testCancelId = activePolicies[0].id
      console.log(`❌ Probando POST /policies/${testCancelId}/cancel...`)
      try {
        const response = await axios.post(
          `${API_BASE_URL}/policies/${testCancelId}/cancel`,
          {},
          {
            headers: { Authorization: `Bearer ${testUser.token}` },
          },
        )
        console.log("✅ Póliza cancelada:", response.data)
      } catch (error) {
        console.log("❌ Error cancelando póliza:", error.response?.data || error.message)
      }
    } else {
      console.log("⚠️ No hay pólizas activas para probar cancelación")
    }

    // Probar con ID inexistente (debería dar 404)
    console.log("🔍 Probando con ID inexistente (999)...")
    try {
      await axios.get(`${API_BASE_URL}/policies/999`, {
        headers: { Authorization: `Bearer ${testUser.token}` },
      })
      console.log("⚠️ Debería haber dado error 404")
    } catch (error) {
      if (error.response?.status === 404) {
        console.log("✅ Error 404 manejado correctamente")
      } else {
        console.log("❌ Error inesperado:", error.response?.data || error.message)
      }
    }
  } catch (error) {
    console.error("💥 Error en las pruebas:", error)
  }
}

async function createTestSession() {
  try {
    // Intentar login con usuario existente
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/login`, {
        email: "test@example.com",
        password: "test123",
      })
      return loginResponse.data
    } catch (loginError) {
      console.log("👤 Usuario de prueba no existe, creando...")

      // Registrar nuevo usuario
      const registerResponse = await axios.post(`${API_BASE_URL}/register`, {
        name: "Usuario de Prueba",
        email: "test@example.com",
        password: "test123",
      })

      return registerResponse.data
    }
  } catch (error) {
    console.error("❌ Error creando sesión:", error.response?.data || error.message)
    return {}
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testPolicyRoutes()
    .then(() => {
      console.log("🎉 Pruebas completadas")
      process.exit(0)
    })
    .catch((error) => {
      console.error("💥 Error en las pruebas:", error)
      process.exit(1)
    })
}

module.exports = { testPolicyRoutes }
