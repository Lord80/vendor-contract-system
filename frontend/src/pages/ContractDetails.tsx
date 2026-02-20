import { useEffect, useState } from 'react';
import { RiskBadge } from '../components/dashboard/RiskBadge';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { api } from '../services/api';
import type { ContractDetail } from '../types';
import { ArrowLeft, ShieldAlert, Calendar } from 'lucide-react';

const TabButton = ({ active, onClick, label }: any) => (
  <button 
    onClick={onClick}
    style={{
      padding: "0.6rem 1.5rem",
      background: active ? "var(--glass-highlight)" : "transparent",
      border: "1px solid transparent",
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

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: "rgba(0,0,0,0.9)", border: "1px solid var(--glass-border)", padding: "12px", borderRadius: "12px", backdropFilter: "blur(10px)" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: "0 0 4px 0" }}>{label}</p>
          <p style={{ color: "#f87171", fontSize: "1rem", fontWeight: "bold", margin: 0 }}>
            {payload[0].value.toFixed(2)} Violations
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
        if(forecastRes.forecast?.predictions) setForecast(forecastRes.forecast.predictions);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    load();
  }, [contractId]);

  if (loading) return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>
        <div className="skeleton" style={{ height: "100px", marginBottom: "2rem", borderRadius: "16px", background: "rgba(255,255,255,0.05)" }}></div>
    </div>
  );
  if (!contract) return <div>Contract not found</div>;

  return (
    <div className="fade-in" style={{ maxWidth: 1400, margin: "0 auto", paddingBottom: "3rem" }}>
      
      {/* HEADER CARD */}
      <div className="holo-card" style={{ marginBottom: "2rem", padding: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <button onClick={onBack} className="btn-neon" style={{ padding: "0.6rem", borderRadius: "50%" }}><ArrowLeft size={20}/></button>
            <div>
                <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "1.5rem", fontWeight: 700 }}>{contract.contract_name}</h1>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", gap: "12px", fontFamily: "monospace" }}>
                    <span>ID: #{contract.id}</span>
                    <span>•</span>
                    <span>VENDOR: #{contract.vendor_id}</span>
                </div>
            </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
            <button className="btn-primary-glow" onClick={() => alert("Renewed!")}>Renew Contract</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
        
        {/* MAIN CONTENT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
                <TabButton label="Analysis" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                <TabButton label="Clauses" active={activeTab === 'clauses'} onClick={() => setActiveTab('clauses')} />
                <TabButton label="Forecast" active={activeTab === 'forecast'} onClick={() => setActiveTab('forecast')} />
            </div>

            {activeTab === 'overview' && (
                <>
                    <div className="holo-card" style={{ padding: "2rem" }}>
                        <h3 style={{ marginTop: 0, fontSize: "1.1rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Executive Summary</h3>
                        <p style={{ lineHeight: "1.8", fontSize: "1.05rem" }}>{contract.summary}</p>
                    </div>
                    
                    <div className="holo-card" style={{ padding: "2rem", borderLeft: "4px solid #ef4444" }}>
                        <h3 style={{ marginTop: 0, color: "#ef4444", display: "flex", alignItems: "center", gap: "8px" }}>
                            <ShieldAlert size={20} /> Detected Risk Factors
                        </h3>
                        {contract.risk_reasons?.length ? (
                            <ul style={{ paddingLeft: "1.5rem", margin: "1rem 0 0 0" }}>
                                {contract.risk_reasons.map((r, i) => (
                                    <li key={i} style={{ marginBottom: "0.8rem", lineHeight: "1.5" }}>{r}</li>
                                ))}
                            </ul>
                        ) : <p style={{color: "#10b981"}}>No significant risks detected.</p>}
                    </div>
                </>
            )}

            {activeTab === 'clauses' && (
                <div className="holo-card" style={{ padding: "2rem" }}>
                    <h3 style={{ marginTop: 0 }}>Extracted Clauses</h3>
                    {contract.extracted_clauses && Object.entries(contract.extracted_clauses).map(([type, texts]) => (
                        <div key={type} style={{ marginBottom: "2rem" }}>
                            <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: "12px", background: "rgba(59,130,246,0.1)", color: "#60a5fa", fontSize: "0.75rem", fontWeight: 700, marginBottom: "1rem", textTransform: "uppercase" }}>{type}</div>
                            {texts.map((t, i) => (
                                <div key={i} style={{ padding: "1.2rem", background: "rgba(255,255,255,0.03)", borderRadius: "12px", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "0.8rem", border: "1px solid var(--glass-border)" }}>
                                    "{t}"
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

             {activeTab === 'forecast' && (
                <div className="holo-card" style={{ padding: "2rem" }}>
                    <h3 style={{ marginTop: 0, marginBottom: "2rem" }}>Projected SLA Violations</h3>
                    <div style={{ height: "300px", width: "100%" }}>
                        <ResponsiveContainer>
                        <AreaChart data={forecast}>
                            <defs>
                                <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="date" stroke="#64748b" tickFormatter={(str) => str.slice(5)} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="predicted_violations" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorViolations)" />
                        </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>

        {/* SIDEBAR METRICS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="holo-card" style={{ textAlign: "center", padding: "3rem 1.5rem", position: "relative" }}>
                <h4 style={{ margin: "0 0 2rem 0", color: "var(--text-muted)", fontSize: "0.8rem", letterSpacing: "1px" }}>AI RISK SCORE</h4>
                <div style={{ position: "relative", width: "160px", height: "160px", margin: "0 auto" }}>
                    <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={contract.risk_level === 'HIGH' ? '#ef4444' : contract.risk_level === 'MEDIUM' ? '#f59e0b' : '#10b981'} strokeWidth="2.5" strokeDasharray={`${contract.risk_score}, 100`} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 10px ${contract.risk_level === 'HIGH' ? '#ef4444' : '#10b981'})` }} />
                    </svg>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
                        <div style={{ fontSize: "3rem", fontWeight: "800", lineHeight: 1 }}>{contract.risk_score}</div>
                    </div>
                </div>
                <div style={{ marginTop: "1.5rem" }}><RiskBadge level={contract.risk_level} /></div>
            </div>

            <div className="holo-card" style={{ padding: "1.5rem" }}>
                <h4 style={{ margin: "0 0 1rem 0", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Key Entities</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {contract.entities?.money?.map((m,i) => <span key={i} style={{ fontSize: "0.75rem", padding: "4px 8px", borderRadius: "6px", background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)" }}>{m}</span>)}
                    {contract.entities?.dates?.map((d,i) => <span key={i} style={{ fontSize: "0.75rem", padding: "4px 8px", borderRadius: "6px", background: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }}>{d}</span>)}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}