import axios from 'axios';

const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return process.env.INTERNAL_API_URL || 'http://web:8000/api';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

export const getWsBaseUrl = (): string => {
  return API_BASE_URL.replace(/^http/, 'ws').replace(/\/api$/, '/ws/support');
};

export const getWsUrl = (ticketRef: string, token?: string): string => {
  const base = `${getWsBaseUrl()}/${ticketRef}/`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (will be set after login)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Helper function to set auth token
export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('admin_token', token);
    if (api.defaults.headers.common) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  } else {
    localStorage.removeItem('admin_token');
    if (api.defaults.headers.common) {
      delete api.defaults.headers.common['Authorization'];
    }
  }
};

// Helper function to get auth token
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('admin_token');
  }
  return null;
};
