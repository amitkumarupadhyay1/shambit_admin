import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

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

export const getAuthToken = async (): Promise<string | undefined> => {
  if (typeof window !== 'undefined') {
    const session = await getSession();
    return session?.accessToken;
  }
  return undefined;
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
  async (config) => {
    // Get token from NextAuth session on the client
    if (typeof window !== 'undefined') {
      const session = await getSession();
      if (session?.accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
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
      // Unauthorized - NextAuth handles token refresh behind the scenes,
      // so if we get 401 it means refresh failed or token is truly invalid
      if (typeof window !== 'undefined') {
        signOut({ callbackUrl: '/login' });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
