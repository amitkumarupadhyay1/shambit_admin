import api from '@/lib/api';
import type { HotelPartnerProperty, AdminPropertyListResponse, PanVerificationStatus, BankVerificationStatus, B2BContract, B2BContractDocument, B2BPreviewPayload, B2BPreviewResponse } from '@/types/property';
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
    const response = await api.get<{ results: B2BContract[] }>(`/pricing/b2b/admin/contracts/?hotel=${hotelId}`);
    const contracts = response.data.results || [];
    return contracts.find(contract => !contract.published_at && Boolean(contract.amendment_of))
      ?? contracts.find(contract => contract.is_active)
      ?? contracts[0]
      ?? null;
  },

  beginB2BContractAmendment: async (id: number, changeReason: string): Promise<B2BContract> => {
    const response = await api.post<B2BContract>(`/pricing/b2b/admin/contracts/${id}/begin_amendment/`, {
      change_reason: changeReason,
    });
    return response.data;
  },

  suspendB2BContract: async (id: number, changeReason: string): Promise<B2BContract> => {
    const response = await api.post<B2BContract>(`/pricing/b2b/admin/contracts/${id}/suspend/`, {
      change_reason: changeReason,
    });
    return response.data;
  },

  downloadB2BSettledContractPdf: async (id: number): Promise<Blob> => {
    const response = await api.get<Blob>(`/pricing/b2b/admin/contracts/${id}/settled_pdf/`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getB2BPreview: async (payload: B2BPreviewPayload): Promise<B2BPreviewResponse> => {
    const response = await api.post<B2BPreviewResponse>('/pricing/b2b/preview/', payload);
    return response.data;
  },

  createB2BContract: async (data: Partial<B2BContract>): Promise<B2BContract> => {
    const response = await api.post<B2BContract>('/pricing/b2b/admin/contracts/', data);
    return response.data;
  },

  updateB2BContract: async (id: number, data: Partial<B2BContract>): Promise<B2BContract> => {
    const response = await api.patch<B2BContract>(`/pricing/b2b/admin/contracts/${id}/`, data);
    return response.data;
  },

  uploadB2BContractDocument: async (
    contractId: number,
    file: File,
    documentType: 'SIGNED_CONTRACT' | 'ADDENDUM' | 'OTHER',
    signedAt?: string,
    changeReason?: string
  ): Promise<B2BContractDocument> => {
    const formData = new FormData();
    formData.append('contract', String(contractId));
    formData.append('document_type', documentType);
    formData.append('file', file);
    if (signedAt) formData.append('signed_at', signedAt);
    if (changeReason) formData.append('change_reason', changeReason);
    const response = await api.post<B2BContractDocument>('/pricing/b2b/admin/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteB2BContractDocument: async (documentId: number, changeReason: string): Promise<void> => {
    await api.delete(`/pricing/b2b/admin/documents/${documentId}/`, {
      data: { change_reason: changeReason },
    });
  },

  downloadB2BContractDocument: async (documentId: number): Promise<Blob> => {
    const response = await api.get<Blob>(`/pricing/b2b/admin/documents/${documentId}/download/`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
