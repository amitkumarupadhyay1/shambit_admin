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
    is_staff?: boolean;
    is_superuser?: boolean;
    groups?: string[];
    permissions?: string[];
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
    const user = {
      ...response.data.user,
      is_staff: Boolean(response.data.user.is_staff),
      is_superuser: Boolean(response.data.user.is_superuser),
      groups: response.data.user.groups || [],
      permissions: response.data.user.permissions || [],
    };

    if (!user.is_staff && !user.is_superuser) {
      setAuthToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_refresh_token');
      }
      throw new Error('This account is not authorized for the admin dashboard.');
    }

    return {
      access: response.data.access,
      refresh: response.data.refresh,
      user,
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
      is_staff: Boolean(response.data.is_staff),
      is_superuser: Boolean(response.data.is_superuser),
      groups: response.data.groups || [],
      permissions: response.data.permissions || [],
    };
  },

  /**
   * Verify if user is admin
   * Note: Since backend doesn't expose admin flags, we assume authenticated users are admins
   */
  verifyAdmin: async (): Promise<boolean> => {
    try {
      const user = await authService.getProfile();
      return Boolean(user.is_staff || user.is_superuser);
    } catch {
      return false;
    }
  },
};
