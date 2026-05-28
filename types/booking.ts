export interface AdminHotelBooking {
  id: number;
  booking_reference: string;
  hotel: {
    id: number;
    name: string;
    slug: string;
    city_name: string;
    short_address: string;
  };
  room_type: {
    id: number;
    code: string;
    name: string;
  };
  check_in: string;
  check_out: string;
  num_rooms: number;
  num_guests: number;
  total_amount: string;
  cancellation_fee?: string;
  cancellation_gst_amount?: string;
  cancellation_gst_rate?: string;
  refund_amount?: string;
  cancellation_reason?: string;
  currency: string;
  status:
    | 'DRAFT'
    | 'PENDING_PAYMENT'
    | 'PAYMENT_FAILED'
    | 'CONFIRMED'
    | 'CANCELLED'
    | 'REFUND_PENDING'
    | 'REFUNDED'
    | 'EXPIRED'
    | string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  created_at: string;
}

export interface AdminBookingListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminHotelBooking[];
}

export interface AdminRefundProcessResponse {
  booking_reference: string;
  refund_id?: string;
  refund_status: string;
  refund_amount: string;
  booking_status?: string;
  already_processed?: boolean;
  cancellation_fee: string;
  cancellation_penalty_amount: string;
  cancellation_fee_gst_amount: string;
  cancellation_fee_gst_rate?: string;
  gateway_fee_loss_estimate?: string;
}
