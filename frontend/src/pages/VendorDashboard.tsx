import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Contract } from '../types';
import { RiskBadge } from '../components/dashboard/RiskBadge';
import { StatCard } from '../components/dashboard/StatCard';
import ContractDetails from './ContractDetails';
import { LayoutDashboard, LogOut, FileText, Shield, AlertCircle } from 'lucide-react';
import { Logo } from '../components/common/logo';

export default function VendorDashboard() {
  const { user, logout } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getAllContracts();
        setContracts(data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    loadData();
  }, []);

  const avgRisk = contracts.length > 0 ? Math.round(contracts.reduce((acc, c) => acc + c.risk_score, 0) / contracts.length) : 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-deep)" }}>
      
      {/* VENDOR SIDEBAR */}
      <aside style={{ 
        width: "260px", 
        background: "rgba(10, 10, 10, 0.6)", 
        backdropFilter: "blur(20px)", 
        border: "1px solid var(--glass-border)", 
        borderRadius: "24px", 
        display: "flex", flexDirection: "column", 
        padding: "1.5rem", 
        position: "fixed", 
        top: "1rem", left: "1rem", bottom: "1rem", 
        zIndex: 50, 
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)" 
      }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ paddingBottom: "2rem", marginBottom: "1rem" }}>
                <Logo subtitle="Vendor Portal" />
            </div>

            <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <button
                    onClick={() => setSelectedContractId(null)}
                    style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "12px",
                    padding: "12px 16px", 
                    background: !selectedContractId ? "rgba(6, 182, 212, 0.15)" : "transparent",
                    border: "none", borderRadius: "12px",
                    color: !selectedContractId ? "white" : "var(--text-muted)",
                    cursor: "pointer", textAlign: "left", fontWeight: !selectedContractId ? 600 : 500,
                    transition: "all 0.2s"
                    }}
                >
                    <LayoutDashboard size={18} color={!selectedContractId ? "#22d3ee" : "currentColor"} /> 
                    Dashboard
                </button>
            </nav>
        </div>

        <div style={{ marginTop: "auto", background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "16px", border: "1px solid var(--glass-border)" }}>
             <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
               <div style={{ width: "36px", height: "36px", flexShrink: 0, borderRadius: "50%", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "0.9rem" }}>
                 {user?.full_name?.charAt(0)}
               </div>
               <div style={{ overflow: "hidden", minWidth: 0 }}>
                 <div style={{ fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap", color: "white", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.full_name}</div>
                 <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>External Vendor</div>
               </div>
             </div>
             <button onClick={logout} className="btn-neon" style={{ width: "100%", padding: "0.6rem", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "#f87171", borderColor: "rgba(248, 113, 113, 0.2)" }}>
                <LogOut size={16} /> Sign Out
             </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT (GAP DECREASED) --- */}
      <main style={{ 
          flex: 1, 
          // Changed left padding from 300px to 285px to decrease the gap
          padding: "3rem 3rem 3rem 285px", 
          overflowY: "auto" 
      }}>
        {selectedContractId ? (
          <ContractDetails contractId={selectedContractId} onBack={() => setSelectedContractId(null)} />
        ) : (
          <div className="fade-in" style={{ maxWidth: 1100, margin: "0 auto" }}>
            <header style={{ marginBottom: "2.5rem" }}>
                <h1 className="glow-text" style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0 0 0.5rem 0", letterSpacing: "-1px" }}>Vendor Dashboard</h1>
                <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "1.1rem" }}>Overview of your active agreements and compliance status.</p>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
                <StatCard title="Active Agreements" value={contracts.length} icon={<FileText size={24}/>} color="#06b6d4" />
                <StatCard title="Avg Risk Score" value={avgRisk} icon={<Shield size={24}/>} color={avgRisk > 70 ? "#ef4444" : avgRisk > 40 ? "#f59e0b" : "#10b981"} />
                <StatCard title="Pending Actions" value="0" icon={<AlertCircle size={24}/>} color="#f59e0b" />
            </div>

            <div className="holo-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.02)" }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>My Contracts</h3>
                </div>
                
                {loading ? <div style={{ padding: "2rem" }}>Loading...</div> : (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--glass-border)" }}>
                    <tr>
                        <th style={{ padding: "1.2rem 1.5rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 800, letterSpacing: "0.05em" }}>NAME</th>
                        <th style={{ padding: "1.2rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 800, letterSpacing: "0.05em" }}>STATUS</th>
                        <th style={{ padding: "1.2rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 800, textAlign: "center", letterSpacing: "0.05em" }}>RISK LEVEL</th>
                        <th style={{ padding: "1.2rem 1.5rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 800, textAlign: "right", letterSpacing: "0.05em" }}>ACTION</th>
                    </tr>
                    </thead>
                    <tbody>
                    {contracts.length === 0 ? (
                        <tr><td colSpan={4} style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>No contracts found.</td></tr>
                    ) : (
                        contracts.map(c => (
                            <tr key={c.id} style={{ borderBottom: "1px solid var(--glass-border)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <td style={{ padding: "1rem 1.5rem", fontWeight: 500, color: "var(--text-main)" }}>
                                {c.contract_name}
                                <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "4px" }}>Expires: {c.end_date || "N/A"}</div>
                            </td>
                            <td style={{ padding: "1rem" }}>
                                <span style={{ fontSize: "0.7rem", padding: "4px 8px", borderRadius: "4px", background: c.status === 'ACTIVE' ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)", color: c.status === 'ACTIVE' ? "#34d399" : "var(--text-muted)", fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)" }}>
                                    {c.status || "ACTIVE"}
                                </span>
                            </td>
                            <td style={{ padding: "1rem", textAlign: "center" }}><RiskBadge level={c.risk_level} /></td>
                            <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                                <button onClick={() => setSelectedContractId(c.id)} className="btn-neon" style={{ fontSize: "0.75rem", padding: "6px 12px" }}>View Details</button>
                            </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
                )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}