export interface Vendor {
  vendor_id: number;
  name: string;
  category: string;
  email: string;
  performance_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
}

export interface Contract {
  id: number;
  vendor_id: number;
  contract_name: string;
  start_date: string;
  end_date: string;
  status: string;
  risk_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  summary: string;
  risk_reasons?: string[]; // Optional, from XGBoost
}

export interface DashboardSummary {
  total_contracts: number;
  risk_distribution: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
}

export interface SLAEvent {
  event_date: string;
  event_type: string;
  metric_name: string;
  severity: string;
}

export interface PredictionResult {
  risk_level: string;
  confidence: number;
  top_features: Array<{ feature: string; contribution: number }>;
}