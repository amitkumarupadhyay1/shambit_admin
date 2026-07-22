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

export interface B2BManualEligibleRoom {
  room_type_id: number;
  name: string;
  max_adults: number;
  base_occupancy?: number;
  max_occupancy?: number;
  available_rooms: number;
  max_rooms_per_booking: number | null;
  allocation_priority: number;
}

export interface B2BPricingSummary {
  b2c_total?: string;
  agent_tac_total?: string;
  b2b_selling_subtotal?: string;
  platform_fee_total?: string;
  coupon_discount_amount?: string;
  coupon_code?: string | null;
  foc_rooms_granted?: number;
  foc_discount_total?: string;
  final_b2b_selling_total?: string;
  b2b_selling_total: string;
}

export interface B2BManualOrder {
  booking_reference: string;
  hotel_name: string;
  agency_name: string;
  agent_email: string;
  check_in: string;
  check_out: string;
  num_nights?: number;
  total_rooms: number;
  total_guests: number;
  primary_guest_name: string;
  contact_email: string;
  contact_phone?: string;
  contract_number?: string;
  contract_version?: number | null;
  global_rate_plan: string;
  pricing_snapshot?: B2BPricingSummary;
  b2b_selling_total: string;
  allocation_status?: string;
  payment_status?: string;
  created_at: string;
  confirmation_deadline: string;
  eligible_rooms: B2BManualEligibleRoom[];
}

export interface B2BRoomAllocationInput {
  room_type_id: number;
  quantity: number;
}
