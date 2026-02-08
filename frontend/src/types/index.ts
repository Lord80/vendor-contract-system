export interface DashboardSummary {
  total_contracts: number;
  risk_distribution: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
}

export interface Alert {
  type: string;
  message: string;
}

export interface Vendor {
  vendor_id: number;
  name: string;
  performance_score: number;
  risk_level: string;
}

export interface Contract {
  id: number;
  vendor_id: number;
  contract_name: string;
  risk_level: string;
  risk_score: number;
  summary: string;
}
