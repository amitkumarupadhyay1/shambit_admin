import api from '@/lib/api';

export interface AdminSupportTicketTimelineEvent {
  event_type: string;
  actor: string;
  message: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface AdminSupportTicketBooking {
  id: number;
  booking_reference: string;
  hotel_name: string;
  hotel_city: string;
  status: string;
  check_in: string;
  check_out: string;
}

export interface AdminSupportTicket {
  id: number;
  reference: string;
  issue_category: string;
  issue_category_display: string;
  subject: string;
  description: string;
  status: string;
  status_display: string;
  urgency_score: number;
  is_code_red: boolean;
  expected_response_by: string | null;
  timeline_events: AdminSupportTicketTimelineEvent[];
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_reference_text: string;
  hotel_booking: AdminSupportTicketBooking | null;
  channel_source: string;
  created_at: string;
  updated_at: string;
  last_customer_action_at: string | null;
  last_staff_action_at: string | null;
  resolved_at: string | null;
}

export interface AdminSupportChatMessage {
  id: number;
  ticket: number;
  sender: number | null;
  sender_name: string;
  sender_type: 'CUSTOMER' | 'PARTNER' | 'ADMIN' | 'SYSTEM';
  message: string;
  context_data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const supportService = {
  getTickets: async (): Promise<AdminSupportTicket[]> => {
    const response = await api.get<AdminSupportTicket[]>('/support/tickets/');
    return response.data;
  },

  getChatHistory: async (ticketRef: string): Promise<AdminSupportChatMessage[]> => {
    const response = await api.get<
      PaginatedResponse<AdminSupportChatMessage> | AdminSupportChatMessage[]
    >(`/chat/tickets/${ticketRef}/history/`);
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results ?? [];
  },

  markChatMessagesRead: async (ticketRef: string): Promise<{ marked_read: number }> => {
    const response = await api.patch<{ marked_read: number }>(
      `/chat/tickets/${ticketRef}/mark-read/`
    );
    return response.data;
  },

  getChatPresence: async (ticketRef: string): Promise<{
    is_online: boolean;
    last_seen: string | null;
    active_count?: number;
    sender_type?: string;
    participant_counts?: Record<string, number>;
  }> => {
    const response = await api.get<{
      is_online: boolean;
      last_seen: string | null;
      active_count?: number;
      sender_type?: string;
      participant_counts?: Record<string, number>;
    }>(`/chat/tickets/${ticketRef}/presence/`);
    return response.data;
  },
};
