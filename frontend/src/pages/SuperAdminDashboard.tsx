import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SuperAdminDashboard() {
  const { logout } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    admin_email: "",
    admin_name: "",
    admin_password: ""
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    try {
      const data = await api.getAllCompanies();
      setCompanies(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createCompany(formData);
      alert("✅ Company & Admin Created Successfully!");
      setShowForm(false);
      loadCompanies(); // Refresh list
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "2rem" }}>👑 Platform Overview</h1>
          <p style={{ color: "var(--text-secondary)" }}>Multi-Tenant Management Console</p>
        </div>
        <button onClick={logout} style={{ background: "#333", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "4px" }}>
          Logout
        </button>
      </header>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "3rem" }}>
        <div className="card" style={{ textAlign: "center", borderTop: "4px solid #7c3aed" }}>
          <h3 style={{ fontSize: "3rem", margin: "1rem 0", color: "#7c3aed" }}>{companies.length}</h3>
          <p>Active Tenants</p>
        </div>
        <div className="card" style={{ textAlign: "center", borderTop: "4px solid #10b981", cursor: "pointer" }} onClick={() => setShowForm(!showForm)}>
          <div style={{ fontSize: "3rem", margin: "1rem 0" }}>+</div>
          <p>Onboard New Company</p>
        </div>
      </div>

      {/* Create Company Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: "2rem", border: "1px solid #7c3aed" }}>
          <h3>🚀 Onboard New Tenant</h3>
          <form onSubmit={handleCreate} style={{ display: "grid", gap: "1rem", maxWidth: "500px" }}>
            <input 
              placeholder="Company Name (e.g. Acme Corp)" 
              required 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              style={{ padding: "0.8rem", background: "#222", border: "1px solid #444", color: "white" }}
            />
            <input 
              placeholder="Admin Name (e.g. Alice)" 
              required 
              value={formData.admin_name}
              onChange={e => setFormData({...formData, admin_name: e.target.value})}
              style={{ padding: "0.8rem", background: "#222", border: "1px solid #444", color: "white" }}
            />
            <input 
              placeholder="Admin Email" 
              type="email"
              required 
              value={formData.admin_email}
              onChange={e => setFormData({...formData, admin_email: e.target.value})}
              style={{ padding: "0.8rem", background: "#222", border: "1px solid #444", color: "white" }}
            />
            <input 
              placeholder="Admin Password" 
              type="password"
              required 
              value={formData.admin_password}
              onChange={e => setFormData({...formData, admin_password: e.target.value})}
              style={{ padding: "0.8rem", background: "#222", border: "1px solid #444", color: "white" }}
            />
            <button type="submit" style={{ padding: "1rem", background: "#7c3aed", color: "white", border: "none", fontWeight: "bold", cursor: "pointer" }}>
              Create Tenant Environment
            </button>
          </form>
        </div>
      )}

      {/* Companies List */}
      <h3>🏢 Registered Companies</h3>
      <div className="card">
        <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #444", color: "#888" }}>
              <th style={{ padding: "1rem" }}>ID</th>
              <th style={{ padding: "1rem" }}>Company Name</th>
              <th style={{ padding: "1rem" }}>Status</th>
              <th style={{ padding: "1rem" }}>Created At</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(c => (
              <tr key={c.id} style={{ borderBottom: "1px solid #333" }}>
                <td style={{ padding: "1rem" }}>{c.id}</td>
                <td style={{ padding: "1rem", fontWeight: "bold" }}>{c.name}</td>
                <td style={{ padding: "1rem" }}>
                  <span style={{ padding: "4px 8px", background: "rgba(16, 185, 129, 0.2)", color: "#10b981", borderRadius: "4px", fontSize: "0.8rem" }}>
                    {c.subscription_status}
                  </span>
                </td>
                <td style={{ padding: "1rem", color: "#888" }}>{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}