import api from '@/lib/api';
import type {
  AdminBookingListResponse,
  AdminRefundProcessResponse,
  B2BManualOrder,
  B2BRoomAllocationInput,
} from '@/types/booking';

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
  getPendingB2BManualOrders: async (): Promise<B2BManualOrder[]> => {
    const response = await api.get<B2BManualOrder[]>('/b2b/admin/orders/pending-confirmation/');
    return response.data;
  },
  confirmB2BManualAllocation: async (
    reference: string,
    allocations: B2BRoomAllocationInput[],
  ): Promise<void> => {
    await api.post(`/b2b/admin/orders/${encodeURIComponent(reference)}/confirm-allocation/`, {
      allocations,
    });
  },
  rejectB2BManualOrder: async (reference: string): Promise<void> => {
    await api.post(`/b2b/admin/orders/${encodeURIComponent(reference)}/reject/`, {});
  },
};
