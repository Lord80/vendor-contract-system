// 1. USER
export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  role: 'super_admin' | 'company_admin' | 'manager' | 'vendor'; 
  vendor_id?: number | null;
  company_id?: number | null;
}

// 2. COMPANY
export interface Company {
  id: number;
  name: string;
  subscription_status: string;
  created_at: string;
}

// 3. VENDOR
export interface Vendor {
  id: number;
  name: string;
  category: string;
  email: string;
  invite_code?: string;
  performance_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  company_id?: number | null;
}

// 4. CONTRACT
export interface Contract {
  id: number;
  vendor_id: number;
  company_id?: number | null;
  contract_name: string;
  start_date: string;
  end_date?: string | null;
  status: string;
  risk_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  summary: string;
  risk_reasons?: string[];
  entities?: {
    dates: string[];
    money: string[];
    organizations: string[];
  };
}

// 5. EXTENDED DETAILS
export interface ContractDetail extends Contract {
  raw_text?: string;
  extracted_clauses?: Record<string, string[]>;
}

// 6. DASHBOARD
export interface DashboardSummary {
  total_contracts: number;
  risk_distribution: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
}