import { useEffect, useState } from 'react';
import { api } from '../services/api';

const AdminStat = ({ label, value, color }: any) => (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.5rem", padding: "1.5rem" }}>
        <div style={{ width: "50px", height: "50px", borderRadius: "12px", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", boxShadow: `0 4px 15px ${color}40` }}>
            🏢
        </div>
        <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>{label}</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, marginTop: "4px" }}>{value}</div>
        </div>
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
      setFormData({ name: "", admin_email: "", admin_name: "", admin_password: "" });
      loadCompanies();
    } catch (err: any) { alert("Error: " + err.message); }
  }

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
        <div>
          <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "2rem", fontWeight: 800 }}>Platform Administration</h1>
          <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "1.1rem" }}>Multi-Tenant Oversight Console</p>
        </div>
        <button 
            onClick={() => setShowForm(!showForm)} 
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
            {showForm ? "Cancel Deployment" : "➕ Deploy New Tenant"}
        </button>
      </header>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", marginBottom: "3rem" }}>
        <AdminStat label="Active Tenants" value={companies.length} color="rgba(139, 92, 246, 0.2)" />
        <AdminStat label="Global Users" value="--" color="rgba(59, 130, 246, 0.2)" /> {/* Placeholder for future metric */}
        <AdminStat label="System Status" value="Healthy" color="rgba(16, 185, 129, 0.2)" />
      </div>

      {/* CREATE FORM - Collapsible Glass Panel */}
      {showForm && (
        <div className="card fade-in" style={{ marginBottom: "3rem", border: "1px solid var(--accent-purple)", background: "rgba(139, 92, 246, 0.05)" }}>
          <h3 style={{ marginTop: 0, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.5rem" }}>🚀</span> Initialize New Tenant Environment
          </h3>
          <form onSubmit={handleCreate} style={{ display: "grid", gap: "1.5rem", maxWidth: "600px" }}>
            <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 600 }}>Company Name</label>
                <input className="input-field" placeholder="e.g. Acme Corp" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 600 }}>Admin Full Name</label>
                    <input className="input-field" placeholder="John Doe" required value={formData.admin_name} onChange={e => setFormData({...formData, admin_name: e.target.value})} />
                </div>
                <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 600 }}>Admin Email</label>
                    <input className="input-field" placeholder="admin@acme.com" type="email" required value={formData.admin_email} onChange={e => setFormData({...formData, admin_email: e.target.value})} />
                </div>
            </div>

            <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 600 }}>Initial Password</label>
                <input className="input-field" placeholder="••••••••" type="password" required value={formData.admin_password} onChange={e => setFormData({...formData, admin_password: e.target.value})} />
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
                <button type="submit" className="btn-primary" style={{ background: "var(--accent-purple)", border: "none" }}>Deploy Environment</button>
            </div>
          </form>
        </div>
      )}

      {/* TABLE */}
      <div className="card" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--border-highlight)" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-subtle)" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Registered Tenants</h3>
        </div>
        <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
          <thead style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--border-subtle)" }}>
            <tr>
              <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700 }}>TENANT ID</th>
              <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700 }}>COMPANY NAME</th>
              <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700 }}>SUBSCRIPTION</th>
              <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700, textAlign: "right" }}>DEPLOYED ON</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(c => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--border-subtle)", transition: "background 0.15s" }} className="hover:bg-white/5">
                <td style={{ padding: "1rem 1.5rem", color: "var(--text-muted)", fontFamily: "monospace" }}>#{c.id.toString().padStart(3, '0')}</td>
                <td style={{ padding: "1rem 1.5rem", fontWeight: 600, color: "var(--text-primary)" }}>{c.name}</td>
                <td style={{ padding: "1rem 1.5rem" }}>
                  <span className="badge LOW" style={{ fontSize: "0.7rem" }}>{c.subscription_status}</span>
                </td>
                <td style={{ padding: "1rem 1.5rem", color: "var(--text-secondary)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {new Date(c.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}