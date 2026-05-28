import api from '@/lib/api';
import type { AdminBookingListResponse, AdminRefundProcessResponse } from '@/types/booking';

export const bookingsService = {
  getBookings: async (page: number = 1): Promise<AdminBookingListResponse> => {
    const response = await api.get<AdminBookingListResponse>('/hotels/bookings/', {
      params: { page },
    });
    return response.data;
  },
  processRefund: async (bookingId: number): Promise<AdminRefundProcessResponse> => {
    const response = await api.post<AdminRefundProcessResponse>(`/hotels/bookings/${bookingId}/process-refund/`, {});
    return response.data;
  },
};
