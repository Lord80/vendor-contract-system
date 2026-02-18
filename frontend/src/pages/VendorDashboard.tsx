import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Contract } from '../types';
import { RiskBadge } from '../components/dashboard/RiskBadge';
import ContractDetails from './ContractDetails';

// Icons
const DashboardIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect></svg>;

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
      
      {/* --- VENDOR SIDEBAR --- */}
      <aside style={{ 
        width: "260px", 
        background: "rgba(15, 23, 42, 0.8)", // Darker for distinction
        backdropFilter: "blur(20px)",
        borderRight: "var(--border-subtle)",
        display: "flex", flexDirection: "column",
        padding: "2rem 0",
        position: "fixed", height: "100vh", zIndex: 50
      }}>
        <div style={{ padding: "0 1.5rem", marginBottom: "3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "32px", height: "32px", background: "var(--accent-cyan)", borderRadius: "8px", boxShadow: "0 0 15px rgba(6, 182, 212, 0.4)" }}></div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>ContractAI</h2>
              <span style={{ fontSize: "0.65rem", color: "var(--accent-cyan)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Vendor Portal</span>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, paddingRight: "1rem" }}>
          <button
            onClick={() => setSelectedContractId(null)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: "12px",
              padding: "12px 16px", 
              background: !selectedContractId ? "linear-gradient(90deg, rgba(6, 182, 212, 0.15), transparent)" : "transparent",
              border: "none", borderLeft: !selectedContractId ? "3px solid var(--accent-cyan)" : "3px solid transparent",
              color: !selectedContractId ? "white" : "var(--text-secondary)",
              cursor: "pointer", textAlign: "left", fontWeight: !selectedContractId ? 600 : 500,
              borderRadius: "0 8px 8px 0"
            }}
          >
            <span style={{ color: !selectedContractId ? "var(--accent-cyan)" : "currentColor", opacity: !selectedContractId ? 1 : 0.7 }}>{DashboardIcon}</span>
            Dashboard
          </button>
        </nav>

        <div style={{ padding: "0 1.5rem" }}>
           <div style={{ background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "12px", border: "var(--border-subtle)" }}>
             <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
               <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", border: "1px solid var(--border-highlight)", color: "var(--text-primary)", fontSize: "0.8rem" }}>
                 {user?.full_name?.charAt(0)}
               </div>
               <div style={{ overflow: "hidden" }}>
                 <div style={{ fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap" }}>{user?.full_name}</div>
                 <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Vendor</div>
               </div>
             </div>
             <button onClick={logout} className="btn-danger" style={{ width: "100%", padding: "0.5rem", fontSize: "0.8rem" }}>Sign Out</button>
           </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main style={{ flex: 1, padding: "3rem", marginLeft: "260px", overflowY: "auto" }}>
        {selectedContractId ? (
          <ContractDetails contractId={selectedContractId} onBack={() => setSelectedContractId(null)} />
        ) : (
          <div className="fade-in" style={{ maxWidth: 1000, margin: "0 auto" }}>
            <header style={{ marginBottom: "2.5rem" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 0.5rem 0", letterSpacing: "-0.5px" }}>Vendor Dashboard</h1>
                <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "1.1rem" }}>Track your active agreements and compliance status.</p>
            </header>

            {/* STATS OVERVIEW */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
                <div className="card" style={{ background: "linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(6, 182, 212, 0))" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "0.5rem", letterSpacing: "0.5px" }}>ACTIVE AGREEMENTS</div>
                    <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--text-primary)" }}>{contracts.length}</div>
                </div>
                <div className="card">
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "0.5rem", letterSpacing: "0.5px" }}>PENDING ACTIONS</div>
                    <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--text-primary)" }}>0</div>
                </div>
                <div className="card">
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "0.5rem", letterSpacing: "0.5px" }}>AVG RISK SCORE</div>
                    <div style={{ fontSize: "2.5rem", fontWeight: 800, color: avgRisk > 70 ? "var(--danger)" : avgRisk > 40 ? "var(--warning)" : "var(--success)" }}>
                        {avgRisk}
                    </div>
                </div>
            </div>

            {/* CONTRACTS LIST */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-subtle)" }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem" }}>My Contracts</h3>
                </div>
                
                {loading ? (
                    <div style={{ padding: "2rem", display: "grid", gap: "1rem" }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: "60px" }}></div>)}</div>
                ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--border-subtle)" }}>
                    <tr>
                        <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700 }}>NAME</th>
                        <th style={{ padding: "1rem", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700 }}>STATUS</th>
                        <th style={{ padding: "1rem", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700, textAlign: "center" }}>RISK LEVEL</th>
                        <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700, textAlign: "right" }}>ACTION</th>
                    </tr>
                    </thead>
                    <tbody>
                    {contracts.length === 0 ? (
                        <tr><td colSpan={4} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>No contracts found.</td></tr>
                    ) : (
                        contracts.map(c => (
                            <tr key={c.id} style={{ borderBottom: "1px solid var(--border-subtle)", transition: "background 0.2s" }} className="hover:bg-white/5">
                            <td style={{ padding: "1rem 1.5rem", fontWeight: 500 }}>
                                {c.contract_name}
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Expires: {c.end_date || "N/A"}</div>
                            </td>
                            <td style={{ padding: "1rem" }}>
                                <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", background: c.status === 'ACTIVE' ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)", color: c.status === 'ACTIVE' ? "var(--success)" : "var(--text-muted)" }}>
                                    {c.status || "ACTIVE"}
                                </span>
                            </td>
                            <td style={{ padding: "1rem", textAlign: "center" }}><RiskBadge level={c.risk_level} /></td>
                            <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                                <button 
                                    onClick={() => setSelectedContractId(c.id)}
                                    className="btn-ghost" 
                                    style={{ fontSize: "0.8rem", padding: "6px 12px", border: "1px solid var(--border-subtle)" }}
                                >
                                    View
                                </button>
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