import type { DashboardSummary, Vendor, Contract, ContractDetail } from "../types/index";

const API_BASE = "http://localhost:8000";

const getAuthHeaders = (isMultipart = false) => {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isMultipart) headers["Content-Type"] = "application/json";
  return headers;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.clear();
      window.location.href = "/"; // Redirect to login
    }
    const error = await response.json().catch(() => ({ detail: "Unknown Error" }));
    throw new Error(error.detail || `API Error: ${response.status}`);
  }
  return response.json();
}

export const api = {
  // --- Auth ---
  login: async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });
    return handleResponse<any>(res);
  },

  register: async (userData: any) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse<any>(res);
  },

  getAllUsers: () => fetch(`${API_BASE}/auth/users/`, { headers: getAuthHeaders() }).then(handleResponse<any[]>),
  
  deleteUser: (id: number) => 
    fetch(`${API_BASE}/auth/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse),

  // --- Companies (Super Admin) ---
  getAllCompanies: () => fetch(`${API_BASE}/companies/`, { headers: getAuthHeaders() }).then(handleResponse<any[]>),
  
  createCompany: (data: any) => 
    fetch(`${API_BASE}/companies/`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(handleResponse),

  // --- Vendors ---
  getTopVendors: () => fetch(`${API_BASE}/vendors/top`, { headers: getAuthHeaders() }).then(handleResponse<Vendor[]>),
  getAllVendors: () => fetch(`${API_BASE}/vendors/`, { headers: getAuthHeaders() }).then(handleResponse<Vendor[]>),

  // --- Contracts ---
  getAllContracts: () => fetch(`${API_BASE}/contracts/`, { headers: getAuthHeaders() }).then(handleResponse<Contract[]>),
  
  getDashboardSummary: () => fetch(`${API_BASE}/contracts/dashboard/summary`, { headers: getAuthHeaders() }).then(handleResponse<DashboardSummary>),
  
  getContractDetails: (id: number) => fetch(`${API_BASE}/contracts/${id}`, { headers: getAuthHeaders() }).then(handleResponse<ContractDetail>),
  
  getContractForecast: (id: number) => fetch(`${API_BASE}/forecast/sla/violations/${id}`, { headers: getAuthHeaders() }).then(handleResponse),

  uploadContract: async (formData: FormData) => {
    const res = await fetch(`${API_BASE}/contracts/upload`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: formData,
    });
    return handleResponse<Contract>(res);
  },

  updateContractStatus: async (id: number, status: string, newDate?: string) => {
    const res = await fetch(`${API_BASE}/contracts/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, new_end_date: newDate }),
    });
    return handleResponse<Contract>(res);
  },

  // --- AI ---
  compareContracts: (id1: number, id2: number) =>
    fetch(`${API_BASE}/similarity/compare/contracts?contract1_id=${id1}&contract2_id=${id2}`, {
      method: "POST",
      headers: getAuthHeaders()
    }).then(handleResponse),

  trainModel: () =>
    fetch(`${API_BASE}/ml/train`, { method: "POST", headers: getAuthHeaders() }).then(handleResponse),
};