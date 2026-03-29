import api, { setAuthToken } from '@/lib/api';
import type { LoginCredentials, LoginResponse } from '@/types/auth';

// Simplified response type that matches backend
interface BackendLoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    phone: string;
    is_active: boolean;
  };
}

export const authService = {
  /**
   * Login admin user
   * Note: Backend doesn't expose is_staff/is_superuser in the response.
   * Admin verification should be implemented on the backend side.
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post<BackendLoginResponse>('/auth/login/', credentials);
    
    // Set token in localStorage and axios headers
    if (response.data.access) {
      setAuthToken(response.data.access);
      // Store refresh token
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_refresh_token', response.data.refresh);
      }
    }
    
    // Transform backend response to match frontend expectations
    // Since backend doesn't provide is_staff/is_superuser, we assume authenticated users are admins
    return {
      access: response.data.access,
      refresh: response.data.refresh,
      user: {
        ...response.data.user,
        is_staff: true, // Assume true for now - should be verified on backend
        is_superuser: true, // Assume true for now - should be verified on backend
      },
    };
  },

  /**
   * Logout admin user
   */
  logout: async (): Promise<void> => {
    try {
      const refreshToken = typeof window !== 'undefined' 
        ? localStorage.getItem('admin_refresh_token') 
        : null;
      
      if (refreshToken) {
        await api.post('/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_refresh_token');
      }
    }
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    const response = await api.get<BackendLoginResponse['user']>('/auth/me/');
    return {
      ...response.data,
      is_staff: true, // Assume true - should be verified on backend
      is_superuser: true, // Assume true - should be verified on backend
    };
  },

  /**
   * Verify if user is admin
   * Note: Since backend doesn't expose admin flags, we assume authenticated users are admins
   */
  verifyAdmin: async (): Promise<boolean> => {
    try {
      await authService.getProfile();
      return true; // If profile fetch succeeds, user is authenticated
    } catch {
      return false;
    }
  },
};
