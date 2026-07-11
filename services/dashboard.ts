import api from '@/lib/api';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  timestamp: number;
  response_time_ms: number;
  dependencies: {
    database: { status: string; error?: string };
    cache: { status: string; error?: string };
    storage: { status: string; backend: string; error?: string };
  };
}

export interface DashboardStats {
  users: {
    total: number;
    active: number;
  };
  auth: {
    active_otp_limits: number;
  };
  platform: {
    properties: number;
    bookings: number;
    revenue: number;
  };
}

export const getSystemHealth = async (): Promise<SystemHealth> => {
  const { data } = await api.get<SystemHealth>('/ready/');
  return data;
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await api.get<DashboardStats>('/auth/admin/dashboard-stats/');
  return data;
};
