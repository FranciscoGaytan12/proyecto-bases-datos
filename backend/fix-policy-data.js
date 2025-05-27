const db = require("./db")

async function fixPolicyData() {
  console.log("🔍 Verificando y reparando datos de pólizas...")

  try {
    // Verificar conexión a la base de datos
    console.log("📡 Verificando conexión a la base de datos...")
    await db.query("SELECT 1")
    console.log("✅ Conexión a la base de datos exitosa")

    // Verificar si existe la tabla policies
    console.log("📋 Verificando tabla policies...")
    const [tables] = await db.query("SHOW TABLES LIKE 'policies'")

    if (tables.length === 0) {
      console.log("❌ Tabla policies no existe. Creándola...")
      await createPoliciesTable()
    } else {
      console.log("✅ Tabla policies existe")
    }

    // Verificar estructura de la tabla
    console.log("🔧 Verificando estructura de la tabla policies...")
    const [columns] = await db.query("DESC policies")
    console.log(
      "📊 Columnas actuales:",
   columns.map((col) => col.Field),
    )

    // Verificar datos existentes
    console.log("📊 Verificando datos existentes...")
    const [policies] = await db.query("SELECT id, policy_number, status, user_id FROM policies ORDER BY id")
    console.log(`📈 Total de pólizas encontradas: ${policies.length}`)

    if (policies.length > 0) {
      console.log("📋 Pólizas existentes:")
      policies.forEach((policy) => {
        console.log(
          `  - ID: ${policy.id}, Número: ${policy.policy_number}, Estado: ${policy.status}, Usuario: ${policy.user_id}`,
        )
      })
    }

    // Verificar si existe la póliza ID 18 específicamente
    console.log("🔍 Verificando póliza ID 18...")
    const [policy18] = await db.query("SELECT * FROM policies WHERE id = ?", [18])

    if (policy18.length === 0) {
      console.log("❌ Póliza ID 18 no existe. Creándola...")
      await createMissingPolicy(18)
    } else {
      console.log("✅ Póliza ID 18 existe:", policy18[0])
    }

    // Verificar usuarios para asignar pólizas
    console.log("👥 Verificando usuarios...")
    const [users] = await db.query("SELECT id, email FROM users ORDER BY id")
    console.log(`👤 Total de usuarios: ${users.length}`)

    if (users.length === 0) {
      console.log("❌ No hay usuarios. Creando usuario de prueba...")
      await createTestUser()
    }

    // Crear pólizas de prueba si no existen suficientes
    if (policies.length < 5) {
      console.log("📝 Creando pólizas de prueba adicionales...")
      await createTestPolicies()
    }

    console.log("✅ Verificación y reparación completada")
  } catch (error) {
    console.error("❌ Error durante la verificación:", error)
    throw error
  }
}

async function createPoliciesTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS policies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      policy_number VARCHAR(50) UNIQUE NOT NULL,
      policy_type ENUM('auto', 'home', 'life', 'health', 'travel', 'business') NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      premium DECIMAL(10,2) NOT NULL,
      coverage_amount DECIMAL(15,2) NOT NULL,
      status ENUM('active', 'pending', 'expired', 'cancelled') DEFAULT 'pending',
      product_id INT,
      details JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_policy_number (policy_number),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `

  await db.query(createTableQuery)
  console.log("✅ Tabla policies creada")
}

async function createTestUser() {
  const bcrypt = require("bcrypt")
  const hashedPassword = await bcrypt.hash("test123", 10)

  const insertUserQuery = `
    INSERT INTO users (name, email, password, role, created_at) 
    VALUES (?, ?, ?, ?, NOW())
  `

  const [result] = await db.query(insertUserQuery, ["Usuario de Prueba", "test@example.com", hashedPassword, "user"])

  console.log("✅ Usuario de prueba creado con ID:", result.insertId)
  return result.insertId
}

async function createMissingPolicy(policyId) {
  // Obtener un usuario existente o crear uno
  const [users] = await db.query("SELECT id FROM users LIMIT 1")
  const userId = users.length > 0 ? users[0].id : await createTestUser()

  const insertPolicyQuery = `
    INSERT INTO policies (
      id, user_id, policy_number, policy_type, start_date, end_date, 
      premium, coverage_amount, status, details, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `

  const policyData = [
    policyId,
    userId,
    `POL-${policyId.toString().padStart(6, "0")}`,
    "auto",
    "2023-01-01",
    "2024-01-01",
    299.99,
    50000.0,
    "active",
    JSON.stringify({
      make: "Toyota",
      model: "Corolla",
      year: 2020,
      license_plate: `ABC-${policyId}`,
    }),
  ]

  await db.query(insertPolicyQuery, policyData)
  console.log(`✅ Póliza ID ${policyId} creada exitosamente`)
}

async function createTestPolicies() {
  const [users] = await db.query("SELECT id FROM users")
  if (users.length === 0) {
    console.log("❌ No hay usuarios para asignar pólizas")
    return
  }

  const userId = users[0].id
  const testPolicies = [
    {
      policy_number: "POL-000001",
      policy_type: "auto",
      premium: 299.99,
      coverage_amount: 50000,
      details: { make: "Toyota", model: "Corolla", year: 2020 },
    },
    {
      policy_number: "POL-000002",
      policy_type: "home",
      premium: 199.99,
      coverage_amount: 150000,
      details: { address: "Calle Principal 123", square_meters: 120 },
    },
    {
      policy_number: "POL-000003",
      policy_type: "life",
      premium: 89.99,
      coverage_amount: 100000,
      details: { beneficiaries: [{ name: "Cónyuge", percentage: 100 }] },
    },
  ]

  for (const policy of testPolicies) {
    try {
      const insertQuery = `
        INSERT INTO policies (
          user_id, policy_number, policy_type, start_date, end_date,
          premium, coverage_amount, status, details, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `

      await db.query(insertQuery, [
        userId,
        policy.policy_number,
        policy.policy_type,
        "2023-01-01",
        "2024-01-01",
        policy.premium,
        policy.coverage_amount,
        "active",
        JSON.stringify(policy.details),
      ])

      console.log(`✅ Póliza ${policy.policy_number} creada`)
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        console.log(`⚠️ Póliza ${policy.policy_number} ya existe`)
      } else {
        console.error(`❌ Error creando póliza ${policy.policy_number}:`, error.message)
      }
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixPolicyData()
    .then(() => {
      console.log("🎉 Proceso completado exitosamente")
      process.exit(0)
    })
    .catch((error) => {
      console.error("💥 Error en el proceso:", error)
      process.exit(1)
    })
}

module.exports = { fixPolicyData }
