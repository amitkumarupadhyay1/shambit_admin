import api from '@/lib/api';

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
