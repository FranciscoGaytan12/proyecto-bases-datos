// Script para actualizar el estado de las pólizas
const db = require("./db")
const { calculatePolicyStatus } = require("./utils/db-helpers")

/**
 * Actualiza el estado de todas las pólizas basado en sus fechas
 */
async function updatePolicyStatus() {
  try {
    console.log("Iniciando actualización de estados de pólizas...")

    // Obtener todas las pólizas
    const policies = await db.query("SELECT id, start_date, end_date, status FROM policies")
    console.log(`Se encontraron ${policies.length} pólizas para actualizar`)

    let updatedCount = 0

    // Actualizar el estado de cada póliza
    for (const policy of policies) {
      const currentStatus = policy.status
      const newStatus = calculatePolicyStatus(policy.start_date, policy.end_date)

      // Si el estado ha cambiado, actualizarlo en la base de datos
      if (currentStatus !== newStatus) {
        await db.query("UPDATE policies SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [
          newStatus,
          policy.id,
        ])
        updatedCount++
        console.log(`Póliza ID ${policy.id}: Estado actualizado de ${currentStatus} a ${newStatus}`)
      }
    }

    console.log(`Actualización completada. ${updatedCount} pólizas actualizadas.`)
    return { success: true, updatedCount }
  } catch (error) {
    console.error("Error al actualizar estados de pólizas:", error)
    return { success: false, error: error.message }
  }
}

// Exportar la función para usarla en otros archivos
module.exports = { updatePolicyStatus }

// Si se ejecuta directamente este archivo
if (require.main === module) {
  ;(async () => {
    try {
      await db.initializeDatabase()
      const result = await updatePolicyStatus()
      console.log(result)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      await db.closePool()
    }
  })()
}
