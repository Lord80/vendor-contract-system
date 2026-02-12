import { useEffect, useState } from 'react';
import { RiskBadge } from '../components/dashboard/RiskBadge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';


// ✅ FIXED: Added 'status' and 'end_date' to the interface
interface ContractDetail {
  id: number;
  contract_name: string;
  vendor_id: number;
  summary: string;
  risk_level: string;
  risk_score: number;
  status?: string;      // <--- Added
  end_date?: string;    // <--- Added
  risk_reasons?: string[];
  entities?: {
    dates: string[];
    money: string[];
    organizations: string[];
  };
  extracted_clauses?: Record<string, string[]>;
}

export default function ContractDetails({ contractId, onBack }: { contractId: number, onBack: () => void }) {
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  // Removed unused 'newDate' state

  useEffect(() => {
    async function loadDetails() {
      setLoading(true);
      try {
        const data = await fetch(`http://localhost:8000/contracts/${contractId}`, {
             headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } // Ensure auth headers if needed
        }).then(res => res.json());
        setContract(data);

        const forecastData = await fetch(`http://localhost:8000/forecast/sla/violations/${contractId}`, {
             headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        }).then(res => res.json());
        
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

  const handleStatusChange = async (newStatus: string) => {
    if (!contract) return;
    
    let dateToUpdate = undefined;
    if (newStatus === "RENEWED") {
        const date = prompt("Enter new End Date (YYYY-MM-DD):", "2026-12-31");
        if (!date) return; 
        dateToUpdate = date;
    } else {
        if (!confirm(`Are you sure you want to mark this contract as ${newStatus}?`)) return;
    }

    setUpdating(true);
    try {
      const updated = await api.updateContractStatus(contract.id, newStatus, dateToUpdate);
      // ✅ Now TypeScript knows 'status' and 'end_date' exist!
      setContract({ ...contract, status: updated.status, end_date: updated.end_date }); 
      alert("Status updated successfully!");
    } catch (err) {
      alert("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

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
          <div style={{ marginTop: "1rem" }}>
             <span style={{ 
                 padding: "4px 8px", 
                 borderRadius: "4px", 
                 background: contract.status === 'TERMINATED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                 color: contract.status === 'TERMINATED' ? '#ef4444' : 'white',
                 border: `1px solid ${contract.status === 'TERMINATED' ? '#ef4444' : '#555'}`
             }}>
                 Status: {contract.status || 'ACTIVE'}
             </span>
             {contract.end_date && <span style={{ marginLeft: "1rem", color: "#aaa" }}>Expires: {contract.end_date}</span>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <RiskBadge level={contract.risk_level} />
          <div style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.5rem" }}>
            {contract.risk_score}<span style={{ fontSize: "1rem", color: "var(--text-secondary)" }}>/100</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        
        {/* LEFT COLUMN */}
        <div>
          {/* ACTIONS BAR */}
          <div className="card" style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1rem", background: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 600 }}>ACTIONS:</span>
            
            <button 
                disabled={updating}
                onClick={() => handleStatusChange("RENEWED")}
                style={{ padding: "0.5rem 1rem", background: "#10b981", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 600, opacity: updating ? 0.5 : 1 }}
            >
                🔄 Renew
            </button>

            <button 
                disabled={updating}
                onClick={() => handleStatusChange("TERMINATED")}
                style={{ padding: "0.5rem 1rem", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 600, opacity: updating ? 0.5 : 1 }}
            >
                ⛔ Terminate
            </button>

            <button 
                disabled={updating}
                onClick={() => handleStatusChange("ON_HOLD")}
                style={{ padding: "0.5rem 1rem", background: "#f59e0b", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 600, opacity: updating ? 0.5 : 1 }}
            >
                ⏸️ Hold
            </button>
          </div>

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
                {!contract.entities?.money?.length && !contract.entities?.dates?.length && <p>No entities found.</p>}
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
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