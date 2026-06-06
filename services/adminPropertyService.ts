import api from '@/lib/api';
import type { HotelPartnerProperty, AdminPropertyListResponse, PanVerificationStatus, BankVerificationStatus } from '@/types/property';

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
};
