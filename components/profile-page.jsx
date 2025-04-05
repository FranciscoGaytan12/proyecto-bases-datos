"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "../services/api"
import UserProfile from "./UserProfile"

function ProfilePage({ onGoHome }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const checkAuth = () => {
      const isAuth = authService.isAuthenticated()
      setIsAuthenticated(isAuth)
      setIsLoading(false)

      if (!isAuth) {
        // Redirigir al inicio si no está autenticado
        router.push("/")
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B4C4AE] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // No renderizar nada mientras se redirige
  }

  return <UserProfile onGoHome={onGoHome} />
}

export default ProfilePage
