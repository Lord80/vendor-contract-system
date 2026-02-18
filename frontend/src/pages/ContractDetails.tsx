import { useEffect, useState } from 'react';
import { RiskBadge } from '../components/dashboard/RiskBadge';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { api } from '../services/api';
import type { ContractDetail } from '../types';

const TabButton = ({ active, onClick, label }: any) => (
  <button 
    onClick={onClick}
    style={{
      padding: "0.6rem 1.5rem",
      background: active ? "rgba(255,255,255,0.1)" : "transparent",
      border: "1px solid transparent",
      borderColor: active ? "rgba(255,255,255,0.1)" : "transparent",
      borderRadius: "20px",
      color: active ? "white" : "var(--text-muted)",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: "0.9rem",
      transition: "all 0.2s ease"
    }}
  >
    {label}
  </button>
);

// Custom Glass Tooltip for Charts
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(255,255,255,0.1)", padding: "12px", borderRadius: "8px", backdropFilter: "blur(4px)", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: "0 0 4px 0" }}>{label}</p>
          <p style={{ color: "#f87171", fontSize: "1rem", fontWeight: "bold", margin: 0 }}>
            {payload[0].value.toFixed(1)} Violations
          </p>
        </div>
      );
    }
    return null;
};

export default function ContractDetails({ contractId, onBack }: { contractId: number, onBack: () => void }) {
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [cData, fData] = await Promise.all([
            api.getContractDetails(contractId),
            api.getContractForecast(contractId)
        ]);
        setContract(cData);
        
        const forecastRes = fData as any;
        if(forecastRes.forecast?.predictions) {
            setForecast(forecastRes.forecast.predictions);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    load();
  }, [contractId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!contract) return;
    let dateToUpdate = undefined;
    if (newStatus === "RENEWED") {
        const date = prompt("Enter new End Date (YYYY-MM-DD):", "2026-12-31");
        if (!date) return; 
        dateToUpdate = date;
    } else if (!confirm(`Confirm mark as ${newStatus}?`)) return;

    setUpdating(true);
    try {
      const updated = await api.updateContractStatus(contract.id, newStatus, dateToUpdate);
      setContract({ ...contract, status: updated.status, end_date: updated.end_date }); 
      alert("Updated!");
    } catch { alert("Failed update."); } finally { setUpdating(false); }
  };

  if (loading) return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>
        <div className="skeleton" style={{ height: "100px", marginBottom: "2rem", borderRadius: "16px" }}></div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
            <div className="skeleton" style={{ height: "400px" }}></div>
            <div className="skeleton" style={{ height: "400px" }}></div>
        </div>
    </div>
  );
  if (!contract) return <div>Contract not found</div>;

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: "3rem" }}>
      
      {/* HEADER CARD */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", padding: "1.5rem", background: "var(--glass-bg)", borderRadius: "16px", border: "var(--glass-border)", backdropFilter: "blur(24px)", boxShadow: "var(--shadow-md)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <button onClick={onBack} className="btn-ghost" style={{ padding: "0.5rem 1rem" }}>← Back</button>
            <div style={{ height: "32px", width: "1px", background: "rgba(255,255,255,0.1)" }}></div>
            <div>
                <h1 style={{ margin: "0 0 0.25rem 0", fontSize: "1.5rem", fontWeight: 700 }}>{contract.contract_name}</h1>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", gap: "12px" }}>
                    <span>Vendor ID: <span style={{fontFamily: "monospace", color: "var(--text-primary)"}}>#{contract.vendor_id}</span></span>
                    <span>•</span>
                    <span>Status: <span style={{ color: contract.status === 'ACTIVE' ? "var(--success)" : "var(--text-muted)", fontWeight: 600 }}>{contract.status || 'Active'}</span></span>
                </div>
            </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
            <button disabled={updating} onClick={() => handleStatusChange("RENEWED")} className="btn-primary" style={{ background: "var(--success)", border: "none", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)" }}>Renew Contract</button>
            <button disabled={updating} onClick={() => handleStatusChange("TERMINATED")} className="btn-danger">Terminate</button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", padding: "4px", background: "rgba(0,0,0,0.3)", borderRadius: "24px", width: "fit-content", border: "1px solid var(--border-subtle)" }}>
        <TabButton label="Analysis & Risk" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <TabButton label="Clauses" active={activeTab === 'clauses'} onClick={() => setActiveTab('clauses')} />
        <TabButton label="SLA Forecast" active={activeTab === 'forecast'} onClick={() => setActiveTab('forecast')} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
        
        {/* LEFT CONTENT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {activeTab === 'overview' && (
                <>
                    <div className="card">
                        <h3 style={{ marginTop: 0, fontSize: "1.2rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem", marginBottom: "1rem" }}>Executive Summary</h3>
                        <p style={{ lineHeight: "1.8", color: "var(--text-secondary)", fontSize: "1.05rem" }}>{contract.summary}</p>
                    </div>
                    
                    <div className="card" style={{ borderLeft: "4px solid var(--danger)", background: "linear-gradient(90deg, rgba(239,68,68,0.05) 0%, transparent 100%)" }}>
                        <h3 style={{ marginTop: 0, color: "var(--danger)", display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem" }}>
                            <span>⚠️</span> Risk Factors Detected
                        </h3>
                        {contract.risk_reasons?.length ? (
                            <ul style={{ paddingLeft: "1.5rem", margin: "1rem 0 0 0", color: "var(--text-primary)" }}>
                                {contract.risk_reasons.map((r, i) => (
                                    <li key={i} style={{ marginBottom: "0.8rem", lineHeight: "1.5" }}>{r}</li>
                                ))}
                            </ul>
                        ) : <p style={{color: "var(--success)", margin: "1rem 0 0 0"}}>No significant risks detected by AI.</p>}
                    </div>
                </>
            )}

            {activeTab === 'clauses' && (
                <div className="card">
                    <h3 style={{ marginTop: 0, fontSize: "1.2rem", marginBottom: "1.5rem" }}>AI Extracted Clauses</h3>
                    {contract.extracted_clauses && Object.entries(contract.extracted_clauses).map(([type, texts]) => (
                        <div key={type} style={{ marginBottom: "2rem" }}>
                            <div className="badge" style={{ background: "rgba(59,130,246,0.1)", color: "var(--accent-blue)", marginBottom: "1rem", fontSize: "0.75rem", border: "1px solid rgba(59,130,246,0.2)" }}>{type.toUpperCase()}</div>
                            {texts.map((t, i) => (
                                <div key={i} style={{ padding: "1.2rem", background: "rgba(2, 6, 23, 0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "0.8rem" }}>
                                    "{t}"
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

             {activeTab === 'forecast' && (
                <div className="card">
                    <h3 style={{ marginTop: 0, marginBottom: "2rem" }}>Projected SLA Violations (Next 30 Days)</h3>
                    <div style={{ height: "350px", width: "100%" }}>
                        <ResponsiveContainer>
                        <AreaChart data={forecast}>
                            <defs>
                                <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="date" stroke="#64748b" tickFormatter={(str) => str.slice(5)} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="predicted_violations" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorViolations)" />
                        </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>

        {/* SIDEBAR: METRICS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="card" style={{ textAlign: "center", position: "relative", overflow: "hidden", padding: "2.5rem 1.5rem" }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 0%, rgba(59,130,246,0.1), transparent 70%)" }}></div>
                
                <h4 style={{ margin: "0 0 1.5rem 0", color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px" }}>AI RISK SCORE</h4>
                <div style={{ position: "relative", width: "180px", height: "180px", margin: "0 auto" }}>
                    <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={contract.risk_level === 'HIGH' ? '#ef4444' : contract.risk_level === 'MEDIUM' ? '#f59e0b' : '#10b981'} strokeWidth="2.5" strokeDasharray={`${contract.risk_score}, 100`} strokeLinecap="round" style={{ filter: "drop-shadow(0 0 8px rgba(0,0,0,0.5))" }} />
                    </svg>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                        <div style={{ fontSize: "3rem", fontWeight: "800", color: "white", lineHeight: 1 }}>{contract.risk_score}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>/100</div>
                    </div>
                </div>
                <div style={{ marginTop: "1.5rem" }}><RiskBadge level={contract.risk_level} /></div>
            </div>

            <div className="card">
                <h4 style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Extracted Entities</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                    {contract.entities?.money?.map((m,i) => <span key={i} className="badge" style={{background: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)"}}>💰 {m}</span>)}
                    {contract.entities?.dates?.map((d,i) => <span key={i} className="badge" style={{background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)"}}>📅 {d}</span>)}
                    {(!contract.entities?.money?.length && !contract.entities?.dates?.length) && <span style={{color: "var(--text-muted)", fontSize: "0.9rem"}}>No entities found.</span>}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}