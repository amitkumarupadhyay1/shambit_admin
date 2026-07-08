import api from '@/lib/api';
import type { HotelPartnerProperty, AdminPropertyListResponse, PanVerificationStatus, BankVerificationStatus, B2BContract } from '@/types/property';
export const adminPropertyService = {
  getProperties: async (filters?: {
    status?: string;
    partner?: string;
    city?: string;
    page?: number;
  }): Promise<AdminPropertyListResponse> => {
    const response = await api.get<AdminPropertyListResponse>('/hotel-partners/admin/properties/', {
      params: filters,
    });
    return response.data;
  },

  getProperty: async (id: number): Promise<HotelPartnerProperty> => {
    const response = await api.get<HotelPartnerProperty>(`/hotel-partners/admin/properties/${id}/`);
    return response.data;
  },

  approveProperty: async (id: number, cityId: number): Promise<{ message: string; hotel_id: number }> => {
    const response = await api.post<{ message: string; hotel_id: number }>(
      `/hotel-partners/admin/properties/${id}/approve/`,
      { city_id: cityId }
    );
    return response.data;
  },

  rejectProperty: async (id: number, reason: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(
      `/hotel-partners/admin/properties/${id}/reject/`,
      { rejection_reason: reason }
    );
    return response.data;
  },

  verifyPan: async (id: number, status: PanVerificationStatus): Promise<{ message: string; property: HotelPartnerProperty }> => {
    const response = await api.post<{ message: string; property: HotelPartnerProperty }>(
      `/hotel-partners/admin/properties/${id}/verify_pan/`,
      { status }
    );
    return response.data;
  },

  verifyBank: async (id: number, status: BankVerificationStatus): Promise<{ message: string; property: HotelPartnerProperty }> => {
    const response = await api.post<{ message: string; property: HotelPartnerProperty }>(
      `/hotel-partners/admin/properties/${id}/verify_bank/`,
      { status }
    );
    return response.data;
  },

  getB2BContract: async (hotelId: number): Promise<B2BContract | null> => {
    try {
      const response = await api.get<{ results: B2BContract[] }>(`/pricing/b2b/admin/contracts/?hotel=${hotelId}`);
      if (response.data && response.data.results && response.data.results.length > 0) {
        return response.data.results[0];
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch B2B contract:', error);
      return null;
    }
  },

  createB2BContract: async (data: B2BContract): Promise<B2BContract> => {
    const response = await api.post<B2BContract>('/pricing/b2b/admin/contracts/', data);
    return response.data;
  },

  updateB2BContract: async (id: number, data: Partial<B2BContract>): Promise<B2BContract> => {
    const response = await api.patch<B2BContract>(`/pricing/b2b/admin/contracts/${id}/`, data);
    return response.data;
  },
};
