import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Building, Globe, Server, Plus, X, Layers } from 'lucide-react';

const AdminStat = ({ label, value, icon, color }: any) => (
    <div className="holo-card" style={{ display: "flex", alignItems: "center", gap: "1.5rem", padding: "1.5rem" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: `linear-gradient(135deg, ${color}20, ${color}05)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", border: `1px solid ${color}40`, color: color }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>{label}</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-main)", lineHeight: 1, marginTop: "4px" }}>{value}</div>
        </div>
    </div>
);

export default function SuperAdminDashboard() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", admin_email: "", admin_name: "", admin_password: "" });

  useEffect(() => { loadCompanies(); }, []);

  async function loadCompanies() {
    try { const data = await api.getAllCompanies(); setCompanies(data); } catch (err) { console.error(err); }
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
    <div className="fade-in" style={{ maxWidth: 1400, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
        <div>
          <h1 className="glow-text" style={{ margin: "0 0 0.5rem 0", fontSize: "2.5rem", fontWeight: 800 }}>Platform Admin</h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "1.1rem" }}>Multi-Tenant Oversight Console</p>
        </div>
        <button 
            onClick={() => setShowForm(!showForm)} 
            className="btn-primary-glow"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
            {showForm ? <X size={18}/> : <Plus size={18}/>} {showForm ? "Cancel" : "Deploy Tenant"}
        </button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", marginBottom: "3rem" }}>
        <AdminStat label="Active Tenants" value={companies.length} icon={<Building size={24} />} color="#8b5cf6" />
        <AdminStat label="Global Users" value="--" icon={<Globe size={24} />} color="#06b6d4" />
        <AdminStat label="System Status" value="Healthy" icon={<Server size={24} />} color="#10b981" />
      </div>

      {showForm && (
        <div className="holo-card fade-in" style={{ marginBottom: "3rem", padding: "2rem", border: "1px solid var(--aurora-1)" }}>
          <h3 style={{ marginTop: 0, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "10px", fontSize: "1.2rem" }}>
            🚀 Initialize New Tenant
          </h3>
          <form onSubmit={handleCreate} style={{ display: "grid", gap: "1.5rem", maxWidth: "600px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.5px" }}>COMPANY NAME</label>
                <input className="input-field" placeholder="e.g. Acme Corp" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: "100%", padding: "0.9rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "white", outline: "none" }} />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.5px" }}>ADMIN NAME</label>
                    <input className="input-field" placeholder="John Doe" required value={formData.admin_name} onChange={e => setFormData({...formData, admin_name: e.target.value})} style={{ width: "100%", padding: "0.9rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "white", outline: "none" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.5px" }}>ADMIN EMAIL</label>
                    <input className="input-field" placeholder="admin@acme.com" type="email" required value={formData.admin_email} onChange={e => setFormData({...formData, admin_email: e.target.value})} style={{ width: "100%", padding: "0.9rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "white", outline: "none" }} />
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.5px" }}>INITIAL PASSWORD</label>
                <input className="input-field" placeholder="••••••••" type="password" required value={formData.admin_password} onChange={e => setFormData({...formData, admin_password: e.target.value})} style={{ width: "100%", padding: "0.9rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "white", outline: "none" }} />
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
                <button type="submit" className="btn-primary-glow">Deploy Environment</button>
            </div>
          </form>
        </div>
      )}

      {/* TABLE */}
      <div className="holo-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.02)" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Registered Tenants</h3>
        </div>
        <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
          <thead style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--glass-border)" }}>
            <tr>
              <th style={{ padding: "1.2rem 1.5rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 800, letterSpacing: "0.05em" }}>TENANT ID</th>
              <th style={{ padding: "1.2rem 1.5rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 800, letterSpacing: "0.05em" }}>COMPANY NAME</th>
              <th style={{ padding: "1.2rem 1.5rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 800, letterSpacing: "0.05em" }}>SUBSCRIPTION</th>
              <th style={{ padding: "1.2rem 1.5rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 800, textAlign: "right", letterSpacing: "0.05em" }}>DEPLOYED ON</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(c => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--glass-border)", transition: "background 0.15s" }} className="hover:bg-white/5">
                <td style={{ padding: "1rem 1.5rem", color: "var(--text-dim)", fontFamily: "monospace" }}>#{c.id.toString().padStart(3, '0')}</td>
                <td style={{ padding: "1rem 1.5rem", fontWeight: 600, color: "var(--text-main)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ padding: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "6px" }}><Layers size={14}/></div>
                        {c.name}
                    </div>
                </td>
                <td style={{ padding: "1rem 1.5rem" }}>
                  <span style={{ fontSize: "0.7rem", padding: "4px 10px", borderRadius: "4px", background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)", fontWeight: 700 }}>{c.subscription_status}</span>
                </td>
                <td style={{ padding: "1rem 1.5rem", color: "var(--text-muted)", textAlign: "right", fontFamily: "monospace" }}>
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