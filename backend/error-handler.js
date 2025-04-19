/**
 * Utility function to handle API errors consistently across the application
 * @param {Error} error - The error object from the API call
 * @param {Function} setError - State setter function for error message
 * @param {Function} setLoading - State setter function for loading state
 * @param {boolean} shouldLogout - Whether to logout on auth errors
 * @param {Function} onAuthError - Callback for auth errors
 */
export const handleApiError = (error, setError, setLoading, shouldLogout = true, onAuthError = null) => {
    console.error("API Error:", error)
  
    // Set loading to false if provided
    if (setLoading) {
      setLoading(false)
    }
  
    // Handle authentication errors
    if (error.isAuthError || error.status === 401) {
      const errorMessage = "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
  
      if (setError) {
        setError(errorMessage)
      }
  
      if (shouldLogout) {
        // Import dynamically to avoid circular dependencies
        import("../services/api").then(({ authService }) => {
          authService.logout()
        })
  
        // Call auth error callback if provided
        if (onAuthError) {
          onAuthError()
        } else {
          // Default behavior: redirect after a delay
          setTimeout(() => {
            window.location.href = "/"
          }, 3000)
        }
      }
  
      return
    }
  
    // Handle server errors (500)
    if (error.isServerError || error.status === 500) {
      const errorMessage = "Error en el servidor. Por favor, inténtalo más tarde o contacta con soporte."
  
      if (setError) {
        setError(errorMessage)
      }
  
      return
    }
  
    // Handle network errors
    if (error.code === "NETWORK_ERROR" || error.code === "ECONNABORTED" || error.code === "NO_RESPONSE") {
      const errorMessage = "No se pudo conectar con el servidor. Verifica tu conexión a internet."
  
      if (setError) {
        setError(errorMessage)
      }
  
      return
    }
  
    // Handle other errors
    if (setError) {
      setError(error.message || "Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.")
    }
  }
  
  /**
   * Creates a fallback response for when the API is unavailable
   * @param {string} entityType - The type of entity (e.g., 'policies', 'profile')
   * @returns {Object} Fallback data
   */
  export const createFallbackResponse = (entityType) => {
    switch (entityType) {
      case "policies":
        return [
          {
            id: 1,
            policy_number: "POL-123456",
            policy_type: "auto",
            start_date: "2023-01-01",
            end_date: "2024-01-01",
            premium: 299,
            coverage_amount: 50000,
            status: "active",
          },
          {
            id: 2,
            policy_number: "POL-789012",
            policy_type: "home",
            start_date: "2023-02-15",
            end_date: "2024-02-15",
            premium: 199,
            coverage_amount: 150000,
            status: "active",
          },
        ]
  
      case "policy":
        return {
          id: 1,
          policy_number: "POL-123456",
          policy_type: "auto",
          start_date: "2023-01-01",
          end_date: "2024-01-01",
          premium: 299,
          coverage_amount: 50000,
          status: "active",
          details: {
            make: "Toyota",
            model: "Corolla",
            year: 2020,
            license_plate: "ABC-1234",
          },
          beneficiaries: [],
          claims: [],
          payments: [
            {
              id: 1,
              amount: 299,
              payment_date: "2023-01-01",
              payment_method: "credit_card",
              status: "completed",
            },
          ],
        }
  
      default:
        return null
    }
  }
  