/**
 * Utility to retry API calls with exponential backoff
 * @param {Function} apiCall - The API function to call
 * @param {Object} options - Retry options
 * @returns {Promise} - The result of the API call
 */
export const retryApiCall = async (apiCall, options = {}) => {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      factor = 2,
      shouldRetry = (error) => {
        // By default, retry on 500 errors and network errors
        return (
          error.status === 500 ||
          error.isServerError ||
          error.code === "NETWORK_ERROR" ||
          error.code === "ECONNABORTED" ||
          error.code === "NO_RESPONSE"
        )
      },
    } = options
  
    let lastError
    let delay = initialDelay
  
    for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
      try {
        // If it's a retry, log it
        if (retryCount > 0) {
          console.log(`Retry attempt ${retryCount}/${maxRetries} after ${delay}ms`)
        }
  
        return await apiCall()
      } catch (error) {
        lastError = error
  
        // If we shouldn't retry this error or we've reached max retries, throw
        if (!shouldRetry(error) || retryCount === maxRetries) {
          throw error
        }
  
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay))
  
        // Increase delay for next retry with exponential backoff
        delay = Math.min(delay * factor, maxDelay)
      }
    }
  
    // This should never be reached due to the throw in the loop,
    // but just in case
    throw lastError
  }
  