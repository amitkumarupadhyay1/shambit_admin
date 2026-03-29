export interface CloudinaryUsage {
  storage_used: number;
  storage_limit: number;
  storage_percent: number;
  bandwidth_used: number;
  bandwidth_limit: number;
  bandwidth_percent: number;
  transformations_used: number;
  transformations_limit: number;
  transformations_percent: number;
  credits_used: number;
  credits_limit: number;
  credits_percent: number;
  status: 'safe' | 'warning' | 'critical';
  alerts: string[];
  last_updated?: string;
}

export interface CloudinaryStats {
  total_images: number;
  total_size: number;
  average_size: number;
  by_format: Record<string, number>;
  by_month: Array<{
    month: string;
    count: number;
    size: number;
  }>;
}

export interface CloudinarySummary extends CloudinaryUsage {
  stats: CloudinaryStats;
  recommendations: string[];
  cost_projection: {
    current_plan: string;
    estimated_monthly_cost: number;
    upgrade_recommended: boolean;
  };
}
