import api from '@/lib/api';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

function unwrapPaginatedResults<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results || [];
}

export interface PricingMetaOption {
  value?: string;
  code?: string;
  label: string;
}

export interface PricingMeta {
  gst_states: PricingMetaOption[];
  component_types: PricingMetaOption[];
  formula_types: PricingMetaOption[];
  rule_types: PricingMetaOption[];
  rate_plan_types: PricingMetaOption[];
  rate_plan_adjustments: PricingMetaOption[];
  allowed_channels: PricingMetaOption[];
  competitor_source_types: PricingMetaOption[];
  competitor_verification_statuses: PricingMetaOption[];
}

export interface PricingComponent {
  id: number;
  code: string;
  name: string;
  component_type: 'TAX' | 'FEE' | 'DISCOUNT' | 'SURCHARGE';
  formula_type: 'PERCENTAGE' | 'FIXED' | 'PERCENTAGE_OF_TOTAL';
  value: string;
  is_taxable: boolean;
  is_deductible_from_tax_base: boolean;
  is_withheld: boolean;
  sac_hsn_code: string;
  is_active: boolean;
  effective_from: string | null;
  effective_to: string | null;
  display_priority: number;
}

export interface PricingSlab {
  id: number;
  name: string;
  min_tariff: string;
  max_tariff: string;
  components: PricingComponent[];
  property_categories: string[];
  is_active: boolean;
  effective_from: string | null;
  effective_to: string | null;
}

export interface PricingRuleSet {
  id: number;
  name: string;
  priority: number;
  condition_json: Record<string, string | boolean | string[]>;
  applicable_slabs: PricingSlab[];
  is_active: boolean;
  effective_from: string | null;
  effective_to: string | null;
}

export interface CommissionStrategy {
  id: number;
  name: string;
  strategy_type: 'MARKUP' | 'DEDUCTION' | 'FIXED';
  value: string;
  is_active: boolean;
  effective_from: string | null;
  effective_to: string | null;
}

export interface RevenueManagementProfile {
  id: number;
  hotel: number;
  hotel_name: string;
  room_type: number | null;
  room_type_name?: string | null;
  name: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED';
  strategy: 'CONSERVATIVE' | 'BALANCED' | 'ASSERTIVE';
  partner_opted_in: boolean;
  admin_approved: boolean;
  apply_to_manual_overrides: boolean;
  enabled_factors: Record<string, boolean>;
  is_effective: boolean;
  min_multiplier: string;
  max_multiplier: string;
  max_daily_rate_change_percent: string;
  min_rate: string | null;
  max_rate: string | null;
  customer_disclosure: string;
  partner_disclosure: string;
  ethical_guardrails: string[];
  updated_at: string;
}

export interface RatePlan {
  id: number;
  hotel: number;
  hotel_name: string;
  room_type: number;
  room_type_name: string;
  parent_plan: number | null;
  parent_plan_code?: string;
  code: string;
  name: string;
  plan_type: string;
  adjustment_type: string;
  adjustment_value: string;
  requires_advance_purchase_days: number | null;
  min_length_of_stay: number | null;
  max_length_of_stay: number | null;
  is_refundable: boolean;
  cancellation_deadline_hours: number;
  requires_membership: boolean;
  allowed_channels: string[];
  inclusions: string[];
  customer_disclosure: string;
  partner_notes: string;
  is_public: boolean;
  is_active: boolean;
}

export interface LocalDemandEvent {
  id: number;
  city: number | null;
  city_name?: string | null;
  hotel: number | null;
  hotel_name?: string | null;
  name: string;
  starts_on: string;
  ends_on: string;
  impact_multiplier: string;
  source_label: string;
  source_url: string;
  is_active: boolean;
}

export interface PricingCalculationLog {
  id: number;
  quote_reference: string;
  context: string;
  hotel_name?: string | null;
  room_type_name?: string | null;
  final_payable_amount: string;
  tax_basis_amount: string;
  platform_fee_amount: string;
  partner_payout_amount: string;
  created_by_email?: string | null;
  created_at: string;
}

export interface PricingAdminAuditLog {
  id: number;
  actor_email?: string | null;
  action: string;
  model_name: string;
  object_id: string;
  hotel_name?: string | null;
  quote_reference: string;
  change_reason: string;
  created_at: string;
}

export interface PricingSimulationResult {
  quote_reference?: string;
  pricing_calculation_log_id?: number;
  total_amount: string;
  base_subtotal: string;
  net_revenue_amount: string;
  room_taxable_value: string;
  hotel_gst_amount: string;
  platform_fee_amount: string;
  total_taxes_and_fees: string;
  partner_payout_amount?: string;
  place_of_supply: string;
  slab_name: string;
  component_breakdown: Array<{
    code: string;
    name: string;
    component_type: string;
    amount: string;
  }>;
  dynamic_pricing?: {
    enabled: boolean;
    total_adjustment_amount: string;
    factors: Array<{ code: string; label: string }>;
    guardrails: Array<{ code: string; message: string }>;
    customer_disclosure: string;
  };
  pricing_warnings?: string[];
}

export interface PricingDashboardData {
  meta: PricingMeta;
  components: PricingComponent[];
  slabs: PricingSlab[];
  ruleSets: PricingRuleSet[];
  commissionStrategies: CommissionStrategy[];
  profiles: RevenueManagementProfile[];
  ratePlans: RatePlan[];
  demandEvents: LocalDemandEvent[];
  calculationLogs: PricingCalculationLog[];
  auditLogs: PricingAdminAuditLog[];
}

async function list<T>(path: string): Promise<T[]> {
  const response = await api.get<PaginatedResponse<T> | T[]>(path);
  return unwrapPaginatedResults(response.data);
}

export const pricingService = {
  getDashboard: async (): Promise<PricingDashboardData> => {
    const [
      meta,
      components,
      slabs,
      ruleSets,
      commissionStrategies,
      profiles,
      ratePlans,
      demandEvents,
      calculationLogs,
      auditLogs,
    ] = await Promise.all([
      api.get<PricingMeta>('/pricing/meta/'),
      list<PricingComponent>('/pricing/components/'),
      list<PricingSlab>('/pricing/slabs/'),
      list<PricingRuleSet>('/pricing/rule-sets/'),
      list<CommissionStrategy>('/pricing/commission-strategies/'),
      list<RevenueManagementProfile>('/pricing/revenue-management-profiles/'),
      list<RatePlan>('/pricing/rate-plans/'),
      list<LocalDemandEvent>('/pricing/demand-events/'),
      list<PricingCalculationLog>('/pricing/calculation-logs/'),
      list<PricingAdminAuditLog>('/pricing/admin-audit-logs/'),
    ]);

    return {
      meta: meta.data,
      components,
      slabs,
      ruleSets,
      commissionStrategies,
      profiles,
      ratePlans,
      demandEvents,
      calculationLogs,
      auditLogs,
    };
  },

  createComponent: async (
    data: Partial<PricingComponent> & { change_reason: string },
  ) => (await api.post<PricingComponent>('/pricing/components/', data)).data,

  updateComponent: async (
    id: number,
    data: Partial<PricingComponent> & { change_reason?: string },
  ) => (await api.patch<PricingComponent>(`/pricing/components/${id}/`, data)).data,

  deactivateComponent: async (id: number, changeReason: string) =>
    api.delete(`/pricing/components/${id}/`, {
      data: { change_reason: changeReason },
      headers: { 'X-Change-Reason': changeReason },
    }),

  createSlab: async (
    data: Partial<PricingSlab> & { component_ids: number[]; change_reason: string },
  ) => (await api.post<PricingSlab>('/pricing/slabs/', data)).data,

  createRuleSet: async (
    data: Partial<PricingRuleSet> & { slab_ids: number[]; change_reason: string },
  ) => (await api.post<PricingRuleSet>('/pricing/rule-sets/', data)).data,

  updateProfile: async (
    id: number,
    data: Partial<RevenueManagementProfile> & { change_reason?: string },
  ) =>
    (
      await api.patch<RevenueManagementProfile>(
        `/pricing/revenue-management-profiles/${id}/`,
        data,
      )
    ).data,

  createRatePlan: async (data: Partial<RatePlan>) =>
    (await api.post<RatePlan>('/pricing/rate-plans/', data)).data,

  updateRatePlan: async (id: number, data: Partial<RatePlan>) =>
    (await api.patch<RatePlan>(`/pricing/rate-plans/${id}/`, data)).data,

  createDemandEvent: async (data: Partial<LocalDemandEvent>) =>
    (await api.post<LocalDemandEvent>('/pricing/demand-events/', data)).data,

  updateDemandEvent: async (id: number, data: Partial<LocalDemandEvent>) =>
    (await api.patch<LocalDemandEvent>(`/pricing/demand-events/${id}/`, data)).data,

  simulate: async (data: {
    room_type_id: number;
    check_in: string;
    check_out: string;
    num_rooms: number;
    guest_state?: string;
  }) => (await api.post<PricingSimulationResult>('/pricing/engine/simulate/', data)).data,
};
