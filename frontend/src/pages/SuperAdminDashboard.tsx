import { useEffect, useState } from 'react';
import { api } from '../services/api';
// ✅ FIX: Removed unused import since Sidebar handles logout
// import { useAuth } from '../context/AuthContext'; 

const AdminStat = ({ label, value, color }: any) => (
    <div className="card" style={{ textAlign: "center", borderTop: `4px solid ${color}` }}>
        <div style={{ fontSize: "3rem", fontWeight: 800, margin: "1rem 0", color: "var(--text-primary)" }}>{value}</div>
        <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 600 }}>{label}</div>
    </div>
);

export default function SuperAdminDashboard() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", admin_email: "", admin_name: "", admin_password: "" });

  useEffect(() => { loadCompanies(); }, []);

  async function loadCompanies() {
    try {
      const data = await api.getAllCompanies();
      setCompanies(data);
    } catch (err) { console.error(err); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createCompany(formData);
      alert("✅ Tenant Environment Created!");
      setShowForm(false);
      loadCompanies();
    } catch (err: any) { alert("Error: " + err.message); }
  }

  return (
    <div className="fade-in" style={{ maxWidth: 1000, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
        <div>
          <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "2rem", fontWeight: 800 }}>Platform Administration</h1>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>Multi-Tenant Management Console</p>
        </div>
      </header>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "3rem" }}>
        <AdminStat label="Active Tenant Companies" value={companies.length} color="var(--accent-purple)" />
        <div className="card" style={{ textAlign: "center", borderTop: "4px solid var(--success)", cursor: "pointer", transition: "transform 0.2s" }} onClick={() => setShowForm(!showForm)}>
            <div style={{ fontSize: "3rem", margin: "1rem 0", color: "var(--success)" }}>+</div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 600 }}>Deploy New Tenant</div>
        </div>
      </div>

      {/* CREATE FORM */}
      {showForm && (
        <div className="card fade-in" style={{ marginBottom: "2rem", border: "1px solid var(--accent-purple)" }}>
          <h3 style={{ marginTop: 0 }}>🚀 Initialize New Tenant</h3>
          <form onSubmit={handleCreate} style={{ display: "grid", gap: "1rem", maxWidth: "500px" }}>
            <input placeholder="Company Name (e.g. Acme Corp)" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <input placeholder="Admin Name" required value={formData.admin_name} onChange={e => setFormData({...formData, admin_name: e.target.value})} />
                <input placeholder="Admin Email" type="email" required value={formData.admin_email} onChange={e => setFormData({...formData, admin_email: e.target.value})} />
            </div>
            <input placeholder="Initial Password" type="password" required value={formData.admin_password} onChange={e => setFormData({...formData, admin_password: e.target.value})} />
            <button type="submit" className="btn-primary" style={{ marginTop: "1rem" }}>Deploy Environment</button>
          </form>
        </div>
      )}

      {/* TABLE */}
      <h3 style={{ marginBottom: "1.5rem" }}>Registered Tenants</h3>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
          <thead style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border-subtle)" }}>
            <tr>
              <th style={{ padding: "1.2rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>ID</th>
              <th style={{ padding: "1.2rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>COMPANY NAME</th>
              <th style={{ padding: "1.2rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>STATUS</th>
              <th style={{ padding: "1.2rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>DEPLOYED ON</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(c => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "1.2rem", color: "var(--text-muted)" }}>#{c.id}</td>
                <td style={{ padding: "1.2rem", fontWeight: 600 }}>{c.name}</td>
                <td style={{ padding: "1.2rem" }}>
                  <span className="badge LOW" style={{ fontSize: "0.75rem" }}>{c.subscription_status}</span>
                </td>
                <td style={{ padding: "1.2rem", color: "var(--text-secondary)" }}>{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}