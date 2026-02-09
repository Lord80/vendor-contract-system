import { useEffect, useState } from 'react';
// REMOVED unused react-router-dom import
import { RiskBadge } from '../components/dashboard/RiskBadge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Interface for the detailed view
interface ContractDetail {
  id: number;
  contract_name: string;
  vendor_id: number;
  summary: string;
  risk_level: string;
  risk_score: number;
  risk_reasons?: string[]; // From XGBoost
  entities?: {
    dates: string[];
    money: string[];
    organizations: string[];
  };
  extracted_clauses?: Record<string, string[]>; // ✅ Fixed 'str' to 'string'
}

export default function ContractDetails({ contractId, onBack }: { contractId: number, onBack: () => void }) {
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDetails() {
      setLoading(true);
      try {
        // 1. Fetch Contract Details
        const data = await fetch(`http://localhost:8000/contracts/${contractId}`).then(res => res.json());
        setContract(data);

        // 2. Fetch Forecasting Data
        const forecastData = await fetch(`http://localhost:8000/forecast/sla/violations/${contractId}`).then(res => res.json());
        
        // Transform for Recharts
        if (forecastData.forecast && forecastData.forecast.predictions) {
          setForecast(forecastData.forecast.predictions);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [contractId]);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading AI Insights...</div>;
  if (!contract) return <div>Contract not found</div>;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>
      {/* HEADER */}
      <button onClick={onBack} style={{ marginBottom: "1rem", background: "none", border: "none", color: "var(--accent-primary)", cursor: "pointer" }}>← Back to List</button>
      
      <div className="card" style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div>
          <h1 style={{ marginTop: 0 }}>{contract.contract_name}</h1>
          <p style={{ color: "var(--text-secondary)" }}>{contract.summary}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <RiskBadge level={contract.risk_level} />
          <div style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.5rem" }}>
            {contract.risk_score}<span style={{ fontSize: "1rem", color: "var(--text-secondary)" }}>/100</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        
        {/* LEFT: AI RISK FACTORS */}
        <div>
          <h3 style={{ borderBottom: "1px solid #333", paddingBottom: "0.5rem" }}>⚠️ AI Risk Assessment</h3>
          <div className="card">
            {contract.risk_reasons && contract.risk_reasons.length > 0 ? (
              <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                {contract.risk_reasons.map((reason, i) => (
                  <li key={i} style={{ marginBottom: "0.5rem", color: "var(--text-primary)" }}>{reason}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: "var(--text-secondary)" }}>No specific high-risk clauses detected.</p>
            )}
          </div>

          <h3 style={{ borderBottom: "1px solid #333", paddingBottom: "0.5rem", marginTop: "2rem" }}>📄 Extracted Entities</h3>
          <div className="card">
             <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                {contract.entities?.money?.map((m, i) => (
                  <span key={i} className="badge" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>💰 {m}</span>
                ))}
                {contract.entities?.dates?.map((d, i) => (
                  <span key={i} className="badge" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>📅 {d}</span>
                ))}
             </div>
          </div>
        </div>

        {/* RIGHT: FORECASTING CHART */}
        <div>
          <h3 style={{ borderBottom: "1px solid #333", paddingBottom: "0.5rem" }}>📈 SLA Violation Forecast</h3>
          <div className="card" style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" fontSize={12} tickFormatter={(str) => str.slice(5)} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #333' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="predicted_violations" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center", marginTop: "1rem" }}>
              Predicted SLA violations over the next 30 days (Prophet Model)
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}