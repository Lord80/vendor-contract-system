import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RiskBadge } from '../components/dashboard/RiskBadge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import type { DashboardSummary, Vendor, Contract } from '../types';

// Sleek Stat Card
const StatCard = ({ title, value, color = "blue", icon }: any) => {
  const gradients: any = {
    blue: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0))",
    green: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0))",
    red: "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0))",
    yellow: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0))"
  };
  const accentColor: any = {
    blue: "var(--accent-blue)", green: "var(--success)", red: "var(--danger)", yellow: "var(--warning)"
  };

  return (
    <div className="card" style={{ background: gradients[color], position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", position: "relative", zIndex: 1 }}>
        <div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "0.5px", marginBottom: "4px" }}>
            {title.toUpperCase()}
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{value}</div>
        </div>
        <div style={{ 
          width: "40px", height: "40px", 
          borderRadius: "10px", 
          background: "rgba(255,255,255,0.05)", 
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.2rem",
          color: accentColor[color],
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [sum, vend, cont] = await Promise.all([
          api.getDashboardSummary(),
          api.getTopVendors(),
          api.getAllContracts()
        ]);
        setSummary(sum);
        setVendors(vend);
        setContracts(cont);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    loadData();
  }, []);

  const handleRetrain = async () => {
    if (!confirm("Retrain AI model? This may take a minute.")) return;
    setIsTraining(true);
    try { await api.trainModel(); alert("Training Started!"); } catch(e) { alert("Failed"); } finally { setIsTraining(false); }
  };

  if (loading) return (
    <div style={{ display: "grid", gap: "2rem", padding: "2rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem" }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: "140px" }} />)}
      </div>
      <div className="skeleton" style={{ height: "300px" }} />
    </div>
  );

  const riskData = [
    { name: 'Low', value: summary?.risk_distribution.LOW || 0, color: '#10b981' },
    { name: 'Med', value: summary?.risk_distribution.MEDIUM || 0, color: '#f59e0b' },
    { name: 'High', value: summary?.risk_distribution.HIGH || 0, color: '#ef4444' },
  ];

  return (
    <div className="fade-in">
      <header style={{ marginBottom: "3rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 800, margin: "0 0 0.5rem 0", letterSpacing: "-1px" }}>
            Welcome back, {user?.full_name.split(' ')[0]}
          </h1>
          <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "1.1rem" }}>Here's what's happening with your contracts today.</p>
        </div>
        {user?.role === 'super_admin' && (
          <button onClick={handleRetrain} disabled={isTraining} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {isTraining ? <span className="loader"></span> : "⚡"} Retrain AI Model
          </button>
        )}
      </header>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
        <StatCard title="Contracts" value={summary?.total_contracts} color="blue" icon="📄" />
        <StatCard title="Critical" value={summary?.risk_distribution.HIGH} color="red" icon="⚠️" />
        <StatCard title="Vendors" value={vendors.length} color="yellow" icon="🏢" />
        <StatCard title="Safe" value={summary?.risk_distribution.LOW} color="green" icon="🛡️" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
        
        {/* RECENT ACTIVITY */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Recent Uploads</h3>
            <button className="btn-ghost" style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>View All</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {contracts.slice(0, 5).map(c => (
              <div key={c.id} style={{ 
                display: "flex", alignItems: "center", justifyContent: "space-between", 
                padding: "1rem", 
                background: "rgba(255,255,255,0.02)", 
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "10px",
                transition: "background 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
              >
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div style={{ 
                    width: "40px", height: "40px", borderRadius: "8px", 
                    background: "rgba(30, 41, 59, 0.8)", border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>📄</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>{c.contract_name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Vendor #{c.vendor_id} • {c.end_date || 'No Date'}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <RiskBadge level={c.risk_level} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RISK ANALYTICS */}
        <div className="card">
          <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.1rem" }}>Risk Overview</h3>
          <div style={{ height: "220px", width: "100%", marginBottom: "2rem" }}>
            <ResponsiveContainer>
              <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {riskData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div>
            <h4 style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Top Performing Vendors</h4>
            {vendors.map((v, i) => (
              <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: i < vendors.length -1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <span style={{ fontSize: "0.9rem" }}>{v.name}</span>
                <span style={{ fontSize: "0.9rem", fontWeight: "700", color: v.performance_score > 90 ? "var(--success)" : "var(--warning)" }}>
                  {v.performance_score.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}