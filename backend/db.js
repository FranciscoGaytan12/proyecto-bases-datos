// Módulo para manejar la conexión a la base de datos MySQL
const mysql = require("mysql2/promise")
const dotenv = require("dotenv")

// Cargar variables de entorno
dotenv.config()

// Configuración del pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number.parseInt(process.env.DB_PORT || "3307", 10), 
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Puertas78.",
  database: process.env.DB_NAME || "segurototal",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Opciones adicionales para compatibilidad
  multipleStatements: true, // Permite múltiples consultas en una sola llamada
  dateStrings: true, // Devuelve fechas como strings en formato YYYY-MM-DD HH:MM:SS
})

// Función para verificar la conexión a la base de datos
async function checkDatabaseConnection() {
  try {
    const connection = await pool.getConnection()
    console.log("✅ Conexión a MySQL establecida correctamente")
    console.log(`✅ Conectado a: ${process.env.DB_HOST}:${process.env.DB_PORT || 3307}`)
    console.log(`✅ Base de datos: ${process.env.DB_NAME || "segurototal"}`)
    connection.release()
    return true
  } catch (error) {
    console.error("❌ Error al conectar a MySQL:", error)
    return false
  }
}

// Función para inicializar la base de datos (crear tablas si no existen)
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
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Crear tabla de pólizas si no existe
    await connection.query(`
      CREATE TABLE IF NOT EXISTS policies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        policy_number VARCHAR(50) NOT NULL UNIQUE,
        policy_type ENUM('auto', 'home', 'life', 'health', 'travel', 'business') NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        premium DECIMAL(10, 2) NOT NULL,
        coverage_amount DECIMAL(12, 2) NOT NULL,
        status ENUM('active', 'pending', 'expired', 'cancelled') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Crear tabla de beneficiarios si no existe
    await connection.query(`
      CREATE TABLE IF NOT EXISTS beneficiaries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        policy_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        relationship VARCHAR(100) NOT NULL,
        percentage INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE
      )
    `)

    // Crear tabla de reclamaciones si no existe
    await connection.query(`
      CREATE TABLE IF NOT EXISTS claims (
        id INT AUTO_INCREMENT PRIMARY KEY,
        policy_id INT NOT NULL,
        claim_number VARCHAR(50) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        status ENUM('submitted', 'under_review', 'approved', 'rejected', 'paid') NOT NULL DEFAULT 'submitted',
        submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolution_date TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE
      )
    `)

    // Crear tabla de pagos si no existe
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        policy_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_method ENUM('credit_card', 'debit_card', 'bank_transfer', 'cash') NOT NULL,
        transaction_id VARCHAR(100) NULL,
        status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE
      )
    `)

    // Verificar si ya existen usuarios
    const [users] = await connection.query("SELECT COUNT(*) as count FROM users")

    // Si no hay usuarios, crear un usuario administrador por defecto
    if (users[0].count === 0) {
      const bcrypt = require("bcryptjs")
      const hashedPassword = await bcrypt.hash("admin123", 10)

      await connection.query(
        `
        INSERT INTO users (email, password, name, roles) 
        VALUES ('admin@segurototal.com', ?, 'Administrador', 'admin')
      `,
        [hashedPassword],
      )

      console.log("👤 Usuario administrador creado con éxito")
    }

    console.log("🏗️ Base de datos inicializada correctamente")
    connection.release()
  } catch (error) {
    console.error("❌ Error al inicializar la base de datos:", error)
    throw error
  }
}

// Función para ejecutar consultas SQL
async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params)
    return results
  } catch (error) {
    console.error("❌ Error al ejecutar consulta SQL:", error)
    console.error("SQL:", sql)
    console.error("Parámetros:", params)
    throw error
  }
}

// Función para obtener una transacción
async function getTransaction() {
  const connection = await pool.getConnection()
  await connection.beginTransaction()
  return connection
}

// Función para confirmar una transacción
async function commitTransaction(connection) {
  try {
    await connection.commit()
  } finally {
    connection.release()
  }
}

// Función para revertir una transacción
async function rollbackTransaction(connection) {
  try {
    await connection.rollback()
  } finally {
    connection.release()
  }
}

// Función para ejecutar un script SQL (útil para importar/exportar)
async function executeScript(scriptSQL) {
  try {
    const connection = await pool.getConnection()
    await connection.query(scriptSQL)
    connection.release()
    return true
  } catch (error) {
    console.error("❌ Error al ejecutar script SQL:", error)
    throw error
  }
}

module.exports = {
  pool,
  query,
  checkDatabaseConnection,
  initializeDatabase,
  getTransaction,
  commitTransaction,
  rollbackTransaction,
  executeScript,
}

