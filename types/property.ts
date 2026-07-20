/**
 * Property-related TypeScript types
 * Matches backend API models exactly
 */

export type PropertyStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export type PropertyType = 'HOTEL' | 'RESORT' | 'VILLA' | 'HOMESTAY' | 'HOSTEL' | 'GUESTHOUSE' | 'APARTMENT' | 'RESTAURANT' | 'GALLA_DINNER' | 'WEDDING_DESTINATION' | 'HALL_BOOKING';

export type PricingMode = 'ROOM_RATE_PLAN' | 'A_LA_CARTE_MEAL';

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
    pricing_mode: PricingMode;
    rate_plans: CustomerRatePlan[];
    meal_plans: RoomTypeMealPlan[];
    created_at: string;
    updated_at: string;
}

export interface MealPlan {
    id?: number;
    code: string;
    name: string;
    includes_breakfast: boolean;
    includes_lunch: boolean;
    includes_dinner: boolean;
}

export interface CustomerRatePlan {
    id: number;
    code: string;
    name: string;
    plan_type: string;
    adjustment_type: 'NONE' | 'PERCENTAGE' | 'FIXED';
    adjustment_value: string;
    is_public: boolean;
    is_refundable: boolean;
    meal_plan?: MealPlan | null;
    inclusions: string[];
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
    pricing_mode: PricingMode;
    b2b_global_summary?: {
        configured: boolean;
        status: 'NOT_CONFIGURED' | 'DRAFT_NOT_PUBLISHED' | 'SCHEDULED_FOR_B2B_AGENTS' | 'PUBLISHED_TO_B2B_AGENTS' | 'EXPIRED';
        message: string;
        contract_id?: number;
        contract_number?: string;
        rates: Array<{
            plan: string;
            final_b2b_rate: string;
            min_rooms: number;
            max_rooms?: number | null;
        }>;
    };
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

export type B2BCommissionType = 'PERCENTAGE' | 'FLAT';
export type B2BPricingMode = 'ROOM_WISE' | 'GLOBAL' | 'BOTH';

export interface PaxMatrixData {
    columns: string[];
    rows: string[];
    data: Record<string, Record<string, string | number>>;
}

export type ProfitMarginType = 'PERCENTAGE' | 'FLAT';
export type TaxApplicationType = 'PRE_TAX' | 'POST_TAX';
export type AgentDeductionStrategy = 'DEDUCT_FROM_PROFIT' | 'ADD_TO_SELLING_PRICE';

export interface B2BRoomRatePlan {
    id?: number;
    room_type: number;
    rate_mode: 'PERCENTAGE_DISCOUNT' | 'FLAT_DISCOUNT' | 'FIXED_NET_RATE';
    value: string;
    effective_from?: string | null;
    effective_to?: string | null;
    is_active: boolean;
}

export interface B2BGlobalRateEligibleRoom {
    id?: number;
    room_type: number;
    allocation_priority: number;
    max_rooms_per_booking?: number | null;
}

export interface B2BGlobalRatePlan {
    id?: number;
    name: string;
    is_active: boolean;
    hotel_net_rate_per_room_per_night: string;
    tax_percent: string;
    min_rooms: number;
    max_rooms?: number | null;
    allocation_mode: 'AUTO_ALLOCATE' | 'MANUAL_CONFIRMATION';
    effective_from?: string | null;
    effective_to?: string | null;
    blackout_dates: string[];
    terms_and_conditions: string;
    eligible_rooms: B2BGlobalRateEligibleRoom[];
}

export interface B2BContract {
    id?: number;
    hotel: number;
    contract_number: string;
    counterparty_name: string;
    pricing_mode: B2BPricingMode;
    version?: number;
    amendment_of?: number | null;
    commission_type: B2BCommissionType;
    value: string;
    shambit_discount_rate: Record<string, {value: string, type: 'PERCENTAGE' | 'FLAT' | 'FIXED_NET_RATE'}>;
    shambit_profit_margin: string;
    profit_margin_type?: ProfitMarginType;
    tax_application?: TaxApplicationType;
    agent_deduction_strategy?: AgentDeductionStrategy;
    is_active: boolean;
    hotel_gst_rate?: string;
    shambit_profit_gst_rate?: string;
    agent_commission_gst_rate?: string;
    room_rate_plans?: B2BRoomRatePlan[];
    global_rate_plans?: B2BGlobalRatePlan[];
    effective_from?: string | null;
    effective_to?: string | null;
    change_reason?: string;
    created_by?: number | null;
    updated_by?: number | null;
    published_by?: number | null;
    created_by_name?: string | null;
    updated_by_name?: string | null;
    published_by_name?: string | null;
    published_at?: string | null;
    documents?: B2BContractDocument[];
    missing_requirements?: string[];
    created_at?: string;
    updated_at?: string;
}

export interface B2BContractDocument {
    id: number;
    contract: number;
    document_type: 'SIGNED_CONTRACT' | 'ADDENDUM' | 'OTHER';
    original_name: string;
    content_type: string;
    file_size: number;
    sha256: string;
    signed_at?: string | null;
    uploaded_by_name?: string | null;
    uploaded_at: string;
    download_url: string;
}

export interface AdminPropertyListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: HotelPartnerProperty[];
}

export interface B2BPreviewPayload {
    hotel_id: number;
    shambit_discount_rate: Record<string, {value: string, type: 'PERCENTAGE' | 'FLAT' | 'FIXED_NET_RATE'}> | string;
    shambit_profit_margin: string;
    profit_margin_type: ProfitMarginType;
    commission_type: B2BCommissionType;
    value: string;
    tax_application: TaxApplicationType;
    agent_deduction_strategy: AgentDeductionStrategy;
    pricing_mode: B2BPricingMode;
    hotel_gst_rate: string;
    shambit_profit_gst_rate: string;
    agent_commission_gst_rate: string;
    room_rate_plans: B2BRoomRatePlan[];
    global_rate_plans: B2BGlobalRatePlan[];
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
    global_matrices: Array<{
        id: string | number;
        name: string;
        hotel_net_base: number;
        hotel_net_tax: number;
        hotel_net_total: number;
        profit_base: number;
        profit_tax: number;
        profit_total: number;
        agent_tac_base: number;
        agent_tac_tax: number;
        agent_tac_total: number;
        final_b2b_selling_total: number;
        net_shambit_profit_base: number;
    }>;
}
