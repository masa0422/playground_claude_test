import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { ErrorResponse, ValidationErrorResponse } from '../types/api';

// Base API configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Loading state management
let loadingCount = 0;
const loadingCallbacks = new Set<(loading: boolean) => void>();

export const subscribeToLoading = (callback: (loading: boolean) => void): (() => void) => {
  loadingCallbacks.add(callback);
  callback(loadingCount > 0);
  
  return () => {
    loadingCallbacks.delete(callback);
  };
};

const setLoading = (loading: boolean) => {
  if (loading) {
    loadingCount++;
  } else {
    loadingCount = Math.max(0, loadingCount - 1);
  }
  
  const isLoading = loadingCount > 0;
  loadingCallbacks.forEach(callback => callback(isLoading));
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    setLoading(true);
    
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    
    return config;
  },
  (error) => {
    setLoading(false);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    setLoading(false);
    return response;
  },
  (error: AxiosError) => {
    setLoading(false);
    
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          // Bad Request - validation errors
          throw new APIError('Invalid request data', status, data);
        case 401:
          // Unauthorized
          throw new APIError('Authentication required', status, data);
        case 403:
          // Forbidden
          throw new APIError('Access denied', status, data);
        case 404:
          // Not Found
          throw new APIError('Resource not found', status, data);
        case 422:
          // Validation Error
          throw new ValidationAPIError('Validation failed', status, data);
        case 500:
          // Internal Server Error
          throw new APIError('Server error occurred', status, data);
        default:
          throw new APIError(`Request failed with status ${status}`, status, data);
      }
    } else if (error.request) {
      // Network error
      throw new NetworkError('Network connection failed');
    } else {
      // Other error
      throw new APIError('Request setup failed', 0, null);
    }
  }
);

// Custom error classes
export class APIError extends Error {
  public status: number;
  public data: any;
  
  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

export class ValidationAPIError extends APIError {
  public validationErrors: ValidationErrorResponse | null;
  
  constructor(message: string, status: number, data: ValidationErrorResponse | null) {
    super(message, status, data);
    this.name = 'ValidationAPIError';
    this.validationErrors = data;
  }
  
  getFieldErrors(): Record<string, string[]> {
    if (!this.validationErrors?.detail) return {};
    
    const fieldErrors: Record<string, string[]> = {};
    
    this.validationErrors.detail.forEach(error => {
      const field = error.loc.join('.');
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(error.msg);
    });
    
    return fieldErrors;
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

// API client wrapper functions
export const api = {
  // Generic HTTP methods
  get: <T>(url: string, params?: any): Promise<T> => {
    return apiClient.get(url, { params }).then(response => response.data);
  },
  
  post: <T>(url: string, data?: any): Promise<T> => {
    return apiClient.post(url, data).then(response => response.data);
  },
  
  put: <T>(url: string, data?: any): Promise<T> => {
    return apiClient.put(url, data).then(response => response.data);
  },
  
  delete: <T>(url: string): Promise<T> => {
    return apiClient.delete(url).then(response => response.data);
  },
  
  // Health check
  healthCheck: async (): Promise<{ status: string; service: string }> => {
    return api.get('/health');
  },
  
  // Test connection
  ping: async (): Promise<{ message: string }> => {
    return api.get('/');
  },
};

// Export the configured axios instance for advanced usage
export { apiClient };
export default api;