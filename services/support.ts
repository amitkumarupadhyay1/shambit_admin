import api from '@/lib/api';

export type SupportTicketStatus =
  | 'OPEN'
  | 'IN_REVIEW'
  | 'WAITING_ON_HOTEL'
  | 'WAITING_ON_CUSTOMER'
  | 'RESOLVED'
  | 'CLOSED';

export type SupportIssueCategory =
  | 'CHECK_IN'
  | 'PAYMENT'
  | 'CANCELLATION'
  | 'MODIFICATION'
  | 'POST_STAY'
  | 'ACCOUNT'
  | 'OTHER'
  | 'LEGACY_CONTACT';

export type SupportSenderType = 'CUSTOMER' | 'PARTNER' | 'ADMIN' | 'SYSTEM';

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

export interface AdminSupportLastMessagePreview {
  id: number;
  sender_type: SupportSenderType;
  message: string;
  created_at: string;
  is_read: boolean;
}

export interface AdminSupportTicket {
  id: number;
  reference: string;
  issue_category: SupportIssueCategory;
  issue_category_display: string;
  subject: string;
  description: string;
  status: SupportTicketStatus;
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
  admin_notes?: string;
  allowed_status_transitions?: SupportTicketStatus[];
  unread_message_count?: number;
  last_message_preview?: AdminSupportLastMessagePreview | null;
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
  sender_type: SupportSenderType;
  message: string;
  context_data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface AdminSupportPresence {
  is_online: boolean;
  last_seen: string | null;
  active_count?: number;
  sender_type?: string | null;
  participant_counts?: Partial<Record<SupportSenderType, number>>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ChatHistoryPage {
  messages: AdminSupportChatMessage[];
  next: string | null;
  previous: string | null;
  count: number | null;
}

function normalizeHistoryResponse(
  payload: PaginatedResponse<AdminSupportChatMessage> | AdminSupportChatMessage[]
): ChatHistoryPage {
  if (Array.isArray(payload)) {
    return {
      messages: payload,
      next: null,
      previous: null,
      count: payload.length,
    };
  }

  return {
    messages: payload.results ?? [],
    next: payload.next,
    previous: payload.previous,
    count: payload.count,
  };
}

export const supportService = {
  getTickets: async (): Promise<AdminSupportTicket[]> => {
    const response = await api.get<AdminSupportTicket[]>('/support/tickets/');
    return response.data;
  },

  getTicket: async (ticketId: number): Promise<AdminSupportTicket> => {
    const response = await api.get<AdminSupportTicket>(`/support/tickets/${ticketId}/`);
    return response.data;
  },

  transitionTicket: async (
    ticketId: number,
    status: SupportTicketStatus,
    note = ''
  ): Promise<AdminSupportTicket> => {
    const response = await api.post<AdminSupportTicket>(
      `/support/tickets/${ticketId}/transition/`,
      { status, note }
    );
    return response.data;
  },

  updateAdminNotes: async (
    ticketId: number,
    adminNotes: string
  ): Promise<AdminSupportTicket> => {
    const response = await api.patch<AdminSupportTicket>(
      `/support/tickets/${ticketId}/admin-notes/`,
      { admin_notes: adminNotes }
    );
    return response.data;
  },

  getChatHistory: async (
    ticketRef: string,
    options: { pageSize?: number; url?: string } = {}
  ): Promise<ChatHistoryPage> => {
    const endpoint = options.url ?? `/chat/tickets/${ticketRef}/history/`;
    const response = await api.get<
      PaginatedResponse<AdminSupportChatMessage> | AdminSupportChatMessage[]
    >(endpoint, {
      params: options.url ? undefined : { page_size: options.pageSize ?? 50 },
    });
    return normalizeHistoryResponse(response.data);
  },

  markChatMessagesRead: async (ticketRef: string): Promise<{ marked_read: number }> => {
    const response = await api.patch<{ marked_read: number }>(
      `/chat/tickets/${ticketRef}/mark-read/`
    );
    return response.data;
  },

  getChatPresence: async (ticketRef: string): Promise<AdminSupportPresence> => {
    const response = await api.get<AdminSupportPresence>(
      `/chat/tickets/${ticketRef}/presence/`
    );
    return response.data;
  },
};
