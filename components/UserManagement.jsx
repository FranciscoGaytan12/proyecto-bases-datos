"use client"

import { useState, useEffect } from "react"
import { Search, Trash2, RotateCcw, AlertTriangle, FileText, CreditCard, AlertCircle } from "lucide-react"
import authService from "../services/auth-service"

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [deletionInfo, setDeletionInfo] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [loadingDeletionInfo, setLoadingDeletionInfo] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authService.getToken()}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setUsers(Array.isArray(data) ? data : data.users || [])
    } catch (error) {
      console.error("Error al cargar usuarios:", error)
      // Datos simulados para desarrollo
      setUsers([
        {
          id: 1,
          name: "Juan Pérez",
          email: "juan@example.com",
          role: "user",
          created_at: "2023-01-15T10:30:00Z",
          policy_count: 2,
        },
        {
          id: 2,
          name: "María García",
          email: "maria@example.com",
          role: "user",
          created_at: "2023-02-20T14:45:00Z",
          policy_count: 1,
        },
        {
          id: 3,
          name: "Admin Principal",
          email: "admin@example.com",
          role: "admin",
          created_at: "2023-01-01T00:00:00Z",
          policy_count: 0,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadDeletionInfo = async (userId) => {
    try {
      setLoadingDeletionInfo(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/deletion-info`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authService.getToken()}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setDeletionInfo(data)
    } catch (error) {
      console.error("Error al cargar información de eliminación:", error)
      // Datos simulados para desarrollo
      setDeletionInfo({
        user: { id: userId, name: "Usuario de prueba", email: "test@example.com" },
        policies: [
          { id: 1, policy_type: "auto", status: "active", premium_amount: 500 },
          { id: 2, policy_type: "home", status: "expired", premium_amount: 300 },
        ],
        paymentInfo: { payment_count: 5, total_amount: 2500 },
        claimInfo: { claim_count: 1 },
        canDelete: true,
        totalItemsToDelete: 8,
      })
    } finally {
      setLoadingDeletionInfo(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    try {
      setDeleting(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authService.getToken()}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Actualizar la lista de usuarios
      setUsers(users.filter((user) => user.id !== userId))
      setShowDeleteModal(false)
      setUserToDelete(null)
      setDeletionInfo(null)

      alert(`Usuario eliminado exitosamente. Se eliminaron ${data.deletedPolicies} pólizas asociadas.`)
    } catch (error) {
      console.error("Error al eliminar usuario:", error)
      alert(`Error al eliminar usuario: ${error.message}`)
    } finally {
      setDeleting(false)
    }
  }

  const confirmDelete = async (user) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
    await loadDeletionInfo(user.id)
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setUserToDelete(null)
    setDeletionInfo(null)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return "Fecha inválida"
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "user":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleText = (role) => {
    switch (role) {
      case "admin":
        return "Administrador"
      case "user":
        return "Usuario"
      default:
        return role || "Sin rol"
    }
  }

  const getPolicyTypeText = (type) => {
    switch (type) {
      case "auto":
        return "Automóvil"
      case "home":
        return "Hogar"
      case "life":
        return "Vida"
      case "health":
        return "Salud"
      default:
        return type || "Desconocido"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "expired":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "Activa"
      case "expired":
        return "Expirada"
      case "cancelled":
        return "Cancelada"
      default:
        return status || "Desconocido"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Cargando usuarios...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
        >
          <RotateCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar usuarios por nombre, email o rol..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-blue-600">{users.length}</div>
          <div className="text-sm text-gray-600">Total de usuarios</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-red-600">{users.filter((user) => user.role === "admin").length}</div>
          <div className="text-sm text-gray-600">Administradores</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">{users.filter((user) => user.role === "user").length}</div>
          <div className="text-sm text-gray-600">Usuarios regulares</div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pólizas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name || "Sin nombre"}</div>
                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}
                    >
                      {getRoleText(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">{user.policy_count || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.created_at)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {user.role !== "admin" && (
                        <button
                          className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                          onClick={() => confirmDelete(user)}
                          title="Eliminar usuario y todas sus pólizas"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500">No se encontraron usuarios</div>
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4 text-center">Confirmar eliminación completa</h3>

              {loadingDeletionInfo ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">Cargando información...</span>
                </div>
              ) : deletionInfo ? (
                <div className="mt-4 px-4 py-3">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">
                          ¡Atención! Esta acción eliminará permanentemente:
                        </h4>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            <strong>Usuario:</strong> {deletionInfo.user.name} ({deletionInfo.user.email})
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {deletionInfo.policies.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                      <h4 className="text-sm font-medium text-red-800 mb-2">
                        Pólizas que se eliminarán ({deletionInfo.policies.length}):
                      </h4>
                      <div className="max-h-32 overflow-y-auto">
                        {deletionInfo.policies.map((policy) => (
                          <div key={policy.id} className="flex justify-between items-center py-1 text-sm text-red-700">
                            <span>
                              {getPolicyTypeText(policy.policy_type)} - ID: {policy.id}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(policy.status)}`}>
                              {getStatusText(policy.status)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {deletionInfo.paymentInfo.payment_count > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 text-blue-600 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-blue-800">Pagos</div>
                            <div className="text-xs text-blue-600">
                              {deletionInfo.paymentInfo.payment_count} registros
                            </div>
                            <div className="text-xs text-blue-600">
                              ${deletionInfo.paymentInfo.total_amount?.toLocaleString() || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {deletionInfo.claimInfo.claim_count > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 text-orange-600 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-orange-800">Siniestros</div>
                            <div className="text-xs text-orange-600">
                              {deletionInfo.claimInfo.claim_count} registros
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                      <div className="text-sm font-medium text-gray-800">Total elementos</div>
                      <div className="text-lg font-bold text-gray-900">{deletionInfo.totalItemsToDelete}</div>
                    </div>
                  </div>

                  <div className="bg-red-100 border border-red-300 rounded-md p-3">
                    <p className="text-sm text-red-800 font-medium">
                      ⚠️ Esta acción no se puede deshacer. Todos los datos del usuario y sus pólizas asociadas se
                      eliminarán permanentemente.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 px-4 py-3">
                  <p className="text-sm text-gray-500">Error al cargar la información de eliminación.</p>
                </div>
              )}

              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
                    onClick={() => handleDeleteUser(userToDelete.id)}
                    disabled={deleting || loadingDeletionInfo || !deletionInfo?.canDelete}
                  >
                    {deleting ? "Eliminando..." : "Confirmar eliminación"}
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    onClick={cancelDelete}
                    disabled={deleting}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
