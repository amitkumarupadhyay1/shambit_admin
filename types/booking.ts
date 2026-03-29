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
  currency: string;
  status: 'DRAFT' | 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | string;
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
