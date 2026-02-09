import type { DashboardSummary, Vendor, Contract } from "../types/index";
const API_BASE = "http://localhost:8000";


// Helper to handle response
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `API Error: ${response.statusText}`);
  }
  return response.json();
}

export const api = {
  // --- Dashboard ---
  getDashboardSummary: () => 
    fetch(`${API_BASE}/contracts/dashboard/summary`).then(handleResponse<DashboardSummary>),

  // --- Vendors ---
  getTopVendors: () => 
    fetch(`${API_BASE}/vendors/top`).then(handleResponse<Vendor[]>),
  
  getAllVendors: () => 
    fetch(`${API_BASE}/vendors/`).then(handleResponse<Vendor[]>),

  // --- Contracts ---
  getAllContracts: () => 
    fetch(`${API_BASE}/contracts/`).then(handleResponse<Contract[]>),
  
  uploadContract: async (formData: FormData) => {
    const response = await fetch(`${API_BASE}/contracts/upload`, {
      method: "POST",
      body: formData, // Auto-sets Content-Type to multipart/form-data
    });
    return handleResponse<Contract>(response);
  },

  // --- AI Tools ---
  compareContracts: (id1: number, id2: number) =>
    fetch(`${API_BASE}/similarity/compare/contracts?contract1_id=${id1}&contract2_id=${id2}`, {
      method: "POST"
    }).then(handleResponse),

  trainModel: () =>
    fetch(`${API_BASE}/ml/train`, { method: "POST" }).then(handleResponse),
};