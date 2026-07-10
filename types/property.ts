/**
 * Property-related TypeScript types
 * Matches backend API models exactly
 */

export type PropertyStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export type PropertyType = 'HOTEL' | 'RESORT' | 'VILLA' | 'HOMESTAY' | 'HOSTEL' | 'GUESTHOUSE' | 'APARTMENT';

export type CommissionType = 'MARKUP' | 'DEDUCTION';

export type PanVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type BankVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'FAILED_BOUNCE';

export type PropertyPhotoCategory = 'EXTERIOR' | 'LOBBY' | 'POOL' | 'DINING' | 'COMMON_AREAS' | 'AMENITIES';

export type RoomPhotoCategory = 'ROOM_MAIN' | 'ROOM_ANGLE' | 'BATHROOM' | 'ROOM_AMENITIES';

export interface HotelPartnerPhoto {
    id: number;
    property?: number;
    room_type?: number;
    photo: string;
    photo_url: string;
    caption: string;
    photo_category: PropertyPhotoCategory | RoomPhotoCategory;
    sort_order: number;
    uploaded_at: string;
}

export interface HotelPartnerRoomType {
    id: number;
    property: number;
    room_name: string;
    room_code: string;
    description: string;
    bed_type: string;
    room_size_sqft?: number;
    max_adults: number;
    max_children: number;
    max_occupancy: number;
    total_inventory: number;
    base_price_per_night: string;
    extra_adult_rate: string;
    extra_child_rate: string;
    discounted_base_price_per_night: string;
    room_discount_percent: string;
    retail_price_per_night: string;
    payout_price_per_night: string;
    weekend_multiplier: string;
    tax_percent: string;
    declared_tariff?: string | null;
    facilities: number[];
    amenities: string[];
    is_refundable: boolean;
    cancellation_window_hours: number;
    image_urls: string[];
    photos: HotelPartnerPhoto[];
    approved_room_type_id?: number | null;
    created_at: string;
    updated_at: string;
}

export interface MealPlan {
    code: string;
    name: string;
    includes_breakfast: boolean;
    includes_lunch: boolean;
    includes_dinner: boolean;
}

export interface RoomTypeMealPlan {
    id: number;
    room_type: number;
    room_type_name: string;
    meal_plan: MealPlan;
    adult_price: string;
    child_price: string;
    infant_price: string;
    tax_percent: string;
    is_available: boolean;
}

export interface HotelPartnerProperty {
    id: number;
    partner: number;
    partner_business_name: string;
    status: PropertyStatus;
    rejection_reason?: string;
    property_type: PropertyType;
    property_name: string;
    slug: string;
    description: string;
    star_rating: string;
    year_established?: number;
    total_rooms: number;
    has_legal_details: boolean;
    check_in_time: string;
    check_out_time: string;
    facilities: number[];
    amenities: string[];
    house_rules: string[];
    cancellation_policy: string;
    cancellation_policy_notes?: string;
    full_address: string;
    short_address: string;
    city_name: string;
    pincode: string;
    state: string;
    country: string;
    latitude?: string;
    longitude?: string;
    pan_number?: string;
    pan_name?: string;
    pan_verification_status?: PanVerificationStatus;
    gstin?: string;
    registration_status?: 'REGISTERED' | 'UNREGISTERED' | 'EXEMPTED';
    state_code?: string;
    bank_account_number?: string;
    bank_ifsc?: string;
    bank_name?: string;
    bank_account_holder_name?: string;
    bank_verification_status?: BankVerificationStatus;
    trade_licence_number?: string;
    trade_licence_expiry?: string;
    tourism_registration_number?: string;
    tourism_registration_expiry?: string;
    fssai_licence_number?: string;
    fssai_licence_expiry?: string;
    fire_noc_number?: string;
    fire_noc_expiry?: string;
    admin_notes?: string;
    submitted_at?: string;
    reviewed_at?: string;
    reviewed_by?: number;
    promoted_hotel?: number;
    commission_type: CommissionType;
    commission_percentage: string;
    room_types: HotelPartnerRoomType[];
    photos: HotelPartnerPhoto[];
    created_at: string;
    updated_at: string;
}

export type B2BCommissionType = 'PERCENTAGE' | 'FLAT' | 'PAX_MATRIX';

export interface PaxMatrixData {
    columns: string[];
    rows: string[];
    data: Record<string, Record<string, string | number>>;
}

export type ProfitMarginType = 'PERCENTAGE' | 'FLAT';
export type TaxApplicationType = 'PRE_TAX' | 'POST_TAX';
export type AgentDeductionStrategy = 'DEDUCT_FROM_PROFIT' | 'ADD_TO_SELLING_PRICE';

export interface B2BContract {
    id?: number;
    hotel: number;
    commission_type: B2BCommissionType;
    value: string;
    pax_matrix_json: PaxMatrixData | null;
    shambit_discount_rate: string;
    shambit_profit_margin: string;
    profit_margin_type?: ProfitMarginType;
    tax_application?: TaxApplicationType;
    agent_deduction_strategy?: AgentDeductionStrategy;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface AdminPropertyListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: HotelPartnerProperty[];
}

export interface B2BPreviewPayload {
    hotel_id: number;
    shambit_discount_rate: string;
    shambit_profit_margin: string;
    profit_margin_type: ProfitMarginType;
    commission_type: B2BCommissionType;
    value: string;
    tax_application: TaxApplicationType;
    agent_deduction_strategy: AgentDeductionStrategy;
}

export interface B2BPreviewRow {
    id: string | number;
    is_sub_row?: boolean;
    room_type: string;
    meal_plan: string;
    b2c_price: number;
    hotel_net: number;
    profit: number;
    final_b2b_selling: number;
    agent_tac: number;
    net_shambit_profit: number;
}

export interface B2BPreviewResponse {
    matrices: B2BPreviewRow[][];
}
