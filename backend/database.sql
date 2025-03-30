-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS segurototal;

-- Usar la base de datos
USE segurototal;

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear tabla de pólizas
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
);

-- Crear tabla de beneficiarios
CREATE TABLE IF NOT EXISTS beneficiaries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  policy_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(100) NOT NULL,
  percentage INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE
);

-- Crear tabla de reclamaciones
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
);

-- Crear tabla de pagos
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
);

-- Insertar algunos datos de ejemplo
INSERT INTO users (email, password, name) VALUES
('admin@segurototal.com', '$2b$10$X7KAdjZq8VN7A.k5E4QIAOk/HSOkzR.Hl5JQwGdmWUKyb8vTUvhie', 'Administrador'), -- contraseña: admin123
('usuario@ejemplo.com', '$2b$10$NlUO.wSH3TS1UUJPi1QOqOSbmXG7FwNjQ9l5FrKEEMaUIPvFwQXcO', 'Usuario Ejemplo'); -- contraseña: password123

