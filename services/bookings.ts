import api from '@/lib/api';
import type { AdminBookingListResponse } from '@/types/booking';

export const bookingsService = {
  getBookings: async (page: number = 1): Promise<AdminBookingListResponse> => {
    const response = await api.get<AdminBookingListResponse>('/hotels/bookings/', {
      params: { page },
    });
    return response.data;
  },
};
