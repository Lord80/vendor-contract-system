import type { DashboardSummary, Vendor, Contract } from "../types/index";

const API_BASE = "http://localhost:8000";

// 1. Helper to get the Token from LocalStorage
const getAuthHeaders = (isMultipart = false) => {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {};
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  // Only set Content-Type if it's NOT a file upload (fetch handles multipart boundaries automatically)
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  
  return headers;
};

// Helper to handle response
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // If token is invalid (401), force logout
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.reload(); 
    }
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `API Error: ${response.statusText}`);
  }
  return response.json();
}

export const api = {
  // --- Auth ---
  login: async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, // Login is special
      body: formData,
    });
    return handleResponse<any>(response);
  },

  register: async (userData: any) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // No token needed to register
      body: JSON.stringify(userData),
    });
    return handleResponse<any>(response);
  },

  updateContractStatus: async (id: number, status: string, newDate?: string) => {
    // 1. Prepare the payload
    const payload = {
      status: status,
      new_end_date: newDate // This must match the Pydantic field name exactly
    };
    
    console.log("Sending Update Payload:", payload); // Debug log

    const response = await fetch(`${API_BASE}/contracts/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        status: status, 
        // 🚨 CRITICAL: The key on the left MUST be "new_end_date" to match Python
        new_end_date: newDate 
      }),
    });
    return handleResponse<Contract>(response);
  },

  // --- Dashboard ---
  getDashboardSummary: () => 
    fetch(`${API_BASE}/contracts/dashboard/summary`, {
      headers: getAuthHeaders() // <--- Added Token
    }).then(handleResponse<DashboardSummary>),

  // --- Vendors ---
  getTopVendors: () => 
    fetch(`${API_BASE}/vendors/top`, {
      headers: getAuthHeaders() // <--- Added Token
    }).then(handleResponse<Vendor[]>),
  
  getAllVendors: () => 
    fetch(`${API_BASE}/vendors/`, {
      headers: getAuthHeaders() // <--- Added Token
    }).then(handleResponse<Vendor[]>),

  // --- Contracts ---
  getAllContracts: () => 
    fetch(`${API_BASE}/contracts/`, {
      headers: getAuthHeaders() // <--- Added Token!! This fixes your 401 error
    }).then(handleResponse<Contract[]>),

  getAllUsers: () => 
    fetch(`${API_BASE}/auth/users/`, {
      headers: getAuthHeaders()
    }).then(handleResponse<any[]>), // Replace 'any' with User type if you have it

  // Admin: Delete User
  deleteUser: (id: number) => 
    fetch(`${API_BASE}/auth/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(handleResponse),

  getAllCompanies: () => 
    fetch(`${API_BASE}/companies/`, {
      headers: getAuthHeaders()
    }).then(handleResponse<any[]>),

  createCompany: (data: any) => 
    fetch(`${API_BASE}/companies/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),
  
  uploadContract: async (formData: FormData) => {
    const response = await fetch(`${API_BASE}/contracts/upload`, {
      method: "POST",
      headers: getAuthHeaders(true), // true = Is Multipart (Don't set Content-Type manually)
      body: formData,
    });
    return handleResponse<Contract>(response);
  },

  // --- AI Tools ---
  compareContracts: (id1: number, id2: number) =>
    fetch(`${API_BASE}/similarity/compare/contracts?contract1_id=${id1}&contract2_id=${id2}`, {
      method: "POST",
      headers: getAuthHeaders()
    }).then(handleResponse),

  trainModel: () =>
    fetch(`${API_BASE}/ml/train`, { 
      method: "POST",
      headers: getAuthHeaders()
    }).then(handleResponse),
};