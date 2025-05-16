"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Shield, Users, ArrowLeft, Search, RefreshCw, AlertCircle, User, Package } from "lucide-react"
import { adminService } from "../services/api"
import { handleApiError } from "../backend/error-handler"

function AdminPanel({ onGoBack }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState(null)
  const [userPolicies, setUserPolicies] = useState([])
  const [loadingPolicies, setLoadingPolicies] = useState(false)

  // Cargar todos los usuarios al montar el componente
  useEffect(() => {
    fetchUsers()
  }, [])  

  // Función para cargar todos los usuarios
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adminService.getUsers()
      setUsers(data)
    } catch (err) {
      console.error("Error al cargar usuarios:", err)
      handleApiError(err, setError, setLoading)
    } finally {
      setLoading(false)
    }
  }

  // Función para cargar las pólizas de un usuario específico
  const fetchUserPolicies = async (userId) => {
    try {
      setLoadingPolicies(true)
      const data = await adminService.getUserPolicies(userId)
      setUserPolicies(data)
    } catch (err) {
      console.error(`Error al cargar pólizas del usuario ${userId}:`, err)
      // No mostramos error aquí, simplemente establecemos un array vacío
      setUserPolicies([])
    } finally {
      setLoadingPolicies(false)
    }
  }

  // Manejar selección de usuario
  const handleUserSelect = (user) => {
    setSelectedUser(user)
    fetchUserPolicies(user.id)
  }

  // Filtrar usuarios según término de búsqueda
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Renderizar tabla de usuarios
  const renderUsersTable = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando usuarios...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-12 bg-red-50 rounded-lg">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">Error al cargar usuarios</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchUsers}
            className="flex items-center justify-center mx-auto bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-md transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </button>
        </div>
      )
    }

    if (filteredUsers.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No se encontraron usuarios</h3>
          <p className="text-gray-600">Intenta con otra búsqueda o verifica la base de datos.</p>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha de registro
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className={`hover:bg-gray-50 ${selectedUser?.id === user.id ? "bg-blue-50" : ""}`}>
                <td className="py-4 px-4 text-sm text-gray-500">{user.id}</td>
                <td className="py-4 px-4 text-sm text-gray-900">{user.name || "Sin nombre"}</td>
                <td className="py-4 px-4 text-sm text-gray-900">{user.email}</td>
                <td className="py-4 px-4 text-sm">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user.role || "usuario"}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="py-4 px-4 text-sm text-gray-500">
                  <button onClick={() => handleUserSelect(user)} className="text-blue-500 hover:text-blue-700 mr-3">
                    Ver pólizas
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Renderizar detalles de pólizas del usuario seleccionado
  const renderUserPolicies = () => {
    if (!selectedUser) return null

    return (
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <User className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold">Pólizas de {selectedUser.name || selectedUser.email}</h3>
          </div>
          <button onClick={() => setSelectedUser(null)} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        {loadingPolicies ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando pólizas...</p>
          </div>
        ) : userPolicies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha inicio
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha fin
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prima
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {userPolicies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm text-gray-900">{policy.policy_number}</td>
                    <td className="py-4 px-4 text-sm text-gray-900">{getPolicyTypeName(policy.policy_type)}</td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      {new Date(policy.start_date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      {new Date(policy.end_date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">${policy.premium}</td>
                    <td className="py-4 px-4 text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          policy.status === "active"
                            ? "bg-green-100 text-green-800"
                            : policy.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {getStatusName(policy.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No hay pólizas</h3>
            <p className="text-gray-600">Este usuario no tiene pólizas contratadas.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Encabezado del panel de administración */}
          <div className="bg-blue-400 text-white p-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-white text-blue-400 rounded-full p-3 mr-4">
                  <Shield className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Panel de Administración</h1>
                  <p className="text-white opacity-90">Gestión de usuarios y pólizas</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <motion.button
                  className="flex items-center bg-white text-blue-400 px-4 py-2 rounded-md font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onGoBack}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al dashboard
                </motion.button>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="p-6">
            {/* Barra de búsqueda */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Tabla de usuarios */}
            {renderUsersTable()}

            {/* Detalles de pólizas del usuario seleccionado */}
            {renderUserPolicies()}
          </div>
        </div>
      </div>
    </div>
  )
}

// Función auxiliar para obtener el nombre legible del tipo de póliza
function getPolicyTypeName(policyType) {
  const policyTypeNames = {
    auto: "Automóvil",
    home: "Hogar",
    life: "Vida",
    health: "Salud",
    travel: "Viaje",
    business: "Negocio",
  }
  return policyTypeNames[policyType] || policyType
}

// Función auxiliar para obtener el nombre legible del estado de la póliza
function getStatusName(status) {
  const statusNames = {
    active: "Activa",
    cancelled: "Cancelada",
    pending: "Pendiente",
    expired: "Expirada",
  }
  return statusNames[status] || status
}

export default AdminPanel
