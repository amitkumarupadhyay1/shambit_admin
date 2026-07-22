export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  groups?: string[];
  permissions?: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
  turnstile_token?: string;
}

export interface LoginResponse {
  access?: string;
  refresh?: string;
  user?: User;
  totp_required?: boolean;
  temp_token?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
