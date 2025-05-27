// Utilidades para trabajar con la base de datos

/**
 * Genera un número de póliza único
 * @param {string} prefix - Prefijo para el número de póliza
 * @returns {string} Número de póliza único
 */
function generatePolicyNumber(prefix = "POL") {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Genera un número de reclamación único
 * @returns {string} Número de reclamación único
 */
function generateClaimNumber() {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `CLAIM-${timestamp}-${random}`
}

/**
 * Calcula el estado de una póliza basado en sus fechas
 * @param {Date|string} startDate - Fecha de inicio de la póliza
 * @param {Date|string} endDate - Fecha de fin de la póliza
 * @returns {string} Estado de la póliza ('active', 'expired', 'pending')
 */
function calculatePolicyStatus(startDate, endDate) {
  const now = new Date()
  // Asegurarse de que las fechas son objetos Date
  const start = startDate instanceof Date ? startDate : new Date(startDate)
  const end = endDate instanceof Date ? endDate : new Date(endDate)

  // Eliminar la hora para comparar
  now.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  console.log(
    `Calculando estado de póliza - Fecha actual: ${now.toISOString()}, Inicio: ${start.toISOString()}, Fin: ${end.toISOString()}`,
  )

  if (now < start) {
    console.log("Estado: pending (la fecha actual es anterior a la fecha de inicio)")
    return "pending"
  } else if (now > end) {
    console.log("Estado: expired (la fecha actual es posterior a la fecha de fin)")
    return "expired"
  } else {
    console.log("Estado: active (la fecha actual está entre la fecha de inicio y fin)")
    return "active"
  }
}

/**
 * Valida los datos de una póliza
 * @param {Object} policyData - Datos de la póliza a validar
 * @returns {Object} Objeto con errores si hay alguno
 */
function validatePolicyData(policyData) {
  const errors = {}

  if (!policyData.policy_type) {
    errors.policy_type = "El tipo de póliza es requerido"
  }

  if (!policyData.start_date) {
    errors.start_date = "La fecha de inicio es requerida"
  }

  if (!policyData.end_date) {
    errors.end_date = "La fecha de fin es requerida"
  } else if (new Date(policyData.end_date) <= new Date(policyData.start_date)) {
    errors.end_date = "La fecha de fin debe ser posterior a la fecha de inicio"
  }

  if (!policyData.premium) {
    errors.premium = "La prima es requerida"
  } else if (isNaN(policyData.premium) || policyData.premium <= 0) {
    errors.premium = "La prima debe ser un número positivo"
  }

  if (!policyData.coverage_amount) {
    errors.coverage_amount = "El monto de cobertura es requerido"
  } else if (isNaN(policyData.coverage_amount) || policyData.coverage_amount <= 0) {
    errors.coverage_amount = "El monto de cobertura debe ser un número positivo"
  }

  // Validar beneficiarios si existen
  if (policyData.beneficiaries && policyData.beneficiaries.length > 0) {
    let totalPercentage = 0

    policyData.beneficiaries.forEach((beneficiary, index) => {
      if (!beneficiary.name) {
        errors[`beneficiaries[${index}].name`] = "El nombre del beneficiario es requerido"
      }

      if (!beneficiary.relationship) {
        errors[`beneficiaries[${index}].relationship`] = "La relación del beneficiario es requerida"
      }

      if (!beneficiary.percentage) {
        errors[`beneficiaries[${index}].percentage`] = "El porcentaje del beneficiario es requerido"
      } else if (isNaN(beneficiary.percentage) || beneficiary.percentage <= 0 || beneficiary.percentage > 100) {
        errors[`beneficiaries[${index}].percentage`] = "El porcentaje debe ser un número entre 1 y 100"
      }

      totalPercentage += Number(beneficiary.percentage)
    })

    if (totalPercentage !== 100) {
      errors.beneficiaries = "La suma de los porcentajes debe ser exactamente 100%"
    }
  }

  return errors
}

module.exports = {
  generatePolicyNumber,
  generateClaimNumber,
  calculatePolicyStatus,
  validatePolicyData,
}
