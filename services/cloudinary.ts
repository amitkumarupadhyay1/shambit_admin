import api from '@/lib/api';
import type { CloudinaryUsage, CloudinarySummary } from '@/types/cloudinary';

export const cloudinaryService = {
  /**
   * Get Cloudinary usage statistics
   */
  getUsage: async (): Promise<CloudinaryUsage> => {
    const response = await api.get<CloudinaryUsage>('/media/cloudinary_usage/');
    return response.data;
  },

  /**
   * Get Cloudinary usage alerts
   */
  getAlerts: async (): Promise<{ alerts: string[]; count: number }> => {
    const response = await api.get<{ alerts: string[]; count: number }>('/media/cloudinary_alerts/');
    return response.data;
  },

  /**
   * Get complete Cloudinary summary with recommendations
   */
  getSummary: async (): Promise<CloudinarySummary> => {
    const response = await api.get<CloudinarySummary>('/media/cloudinary_summary/');
    return response.data;
  },
};
