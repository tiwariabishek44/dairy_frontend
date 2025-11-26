import { API_ENDPOINTS } from './api-endpoints'

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Generic API client function
export const apiClient = async <T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    // Get auth token from localStorage if available
    const token = localStorage.getItem('authToken')

    // Check if body is FormData (for file uploads)
    const isFormData = options.body instanceof FormData

    // Default headers (don't set Content-Type for FormData)
    const defaultHeaders: HeadersInit = {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    }

    // Merge with provided headers
    const headers = {
      ...defaultHeaders,
      ...options.headers,
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Include credentials for CORS
      mode: 'cors', // Explicitly set CORS mode
    }

    console.log('🌐 Fetch Request:');
    console.log('  - URL:', url);
    console.log('  - Method:', config.method || 'GET');
    console.log('  - Headers:', headers);
    console.log('  - Config:', config);

    const response = await fetch(url, config)

    // Handle non-JSON responses (like file downloads)
    const contentType = response.headers.get('Content-Type')
    let data

    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    // Check if request was successful
    if (!response.ok) {
      throw new ApiError(
        response.status,
        data?.message || `HTTP Error: ${response.status}`,
        data
      )
    }

    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(500, 'Network error or server unavailable')
  }
}

// Convenient methods for different HTTP verbs
export const api = {
  get: <T = any>(url: string, params?: Record<string, any>) => {
    const urlWithParams = params 
      ? `${url}?${new URLSearchParams(params).toString()}`
      : url
    return apiClient<T>(urlWithParams, { method: 'GET' })
  },

  post: <T = any>(url: string, data?: any) => {
    console.log('📤 API POST Request:');
    console.log('  - Full URL:', url);
    console.log('  - Data:', data);
    return apiClient<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  put: <T = any>(url: string, data?: any) => {
    return apiClient<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  patch: <T = any>(url: string, data?: any) => {
    return apiClient<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  delete: <T = any>(url: string) => {
    return apiClient<T>(url, { method: 'DELETE' })
  },

  // For file uploads
  uploadFile: <T = any>(url: string, formData: FormData) => {
    return apiClient<T>(url, {
      method: 'POST',
      body: formData,
      // Authorization header and proper Content-Type handling are automatic in apiClient
    })
  },
}