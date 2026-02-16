// ✅ 1. USER INTERFACE (Fixes the Role Error in App.tsx)
export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  // Standardized Roles
  role: 'super_admin' | 'company_admin' | 'manager' | 'vendor'; 
  vendor_id?: number | null;
  company_id?: number | null;
}
// ✅ 2. COMPANY INTERFACE (For Super Admin Dashboard)
export interface Company {
  id: number;
  name: string;
  subscription_status: string;
  created_at: string;
}

// ✅ 3. VENDOR INTERFACE
export interface Vendor {
  id: number;          // Backend uses 'id'
  name: string;
  category: string;
  email: string;
  performance_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  company_id?: number | null;
}

// ✅ 4. CONTRACT INTERFACE (Updated for Multi-Tenancy & Extraction)
export interface Contract {
  id: number;
  vendor_id: number;
  company_id?: number | null; // Multi-tenant field
  
  contract_name: string;
  start_date: string;
  end_date?: string | null;   // Allow null from backend
  status: string;
  
  risk_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  summary: string;
  risk_reasons?: string[];    // Optional, from XGBoost
  
  // For the "Extracted Entities" card
  entities?: {
    dates: string[];
    money: string[];
    organizations: string[];
  };
}

// ✅ 5. DASHBOARD & ANALYTICS
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

export interface ContractDetail extends Contract {
  raw_text?: string;
  extracted_clauses?: Record<string, string[]>;
}