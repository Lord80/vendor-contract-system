const API_BASE = "http://127.0.0.1:8000";

export const api = {
  getDashboardSummary: async () =>
    fetch(`${API_BASE}/contracts/dashboard/summary`).then(res => res.json()),

  getAlerts: async () =>
    fetch(`${API_BASE}/contracts/alerts`).then(res => res.json()),

  getTopVendors: async () =>
    fetch(`${API_BASE}/vendors/top`).then(res => res.json()),

  getContracts: async () =>
    fetch(`${API_BASE}/contracts`).then(res => res.json())
};
