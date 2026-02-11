import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/dashboard/StatCard';
import { RiskBadge } from '../components/dashboard/RiskBadge';
import type { DashboardSummary, Vendor, Contract } from '../types';

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTraining, setIsTraining] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Fetch all data in parallel for speed
        const [summaryData, vendorsData, contractsData] = await Promise.all([
          api.getDashboardSummary(),
          api.getTopVendors(),
          api.getAllContracts()
        ]);

        setSummary(summaryData);
        setVendors(vendorsData);
        setContracts(contractsData);
      } catch (err: any) {
        console.error("Dashboard Error:", err);
        setError("Failed to load dashboard data. Check backend connection.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Function to trigger AI Retraining
  const handleRetrain = async () => {
    if (!confirm("Are you sure? This will retrain the risk model on all current contracts.")) return;
    setIsTraining(true);
    try {
      await api.trainModel();
      alert("AI Model Retraining Started! Check backend logs for progress.");
    } catch (err) {
      alert("Failed to start training.");
    } finally {
      setIsTraining(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading AI Insights...</div>;
  if (error) return <div style={{ padding: 40, color: "var(--accent-danger)" }}>{error}</div>;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* HEADER */}
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "end" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Executive Overview
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Real-time AI analysis of vendor performance and contract risk.
          </p>
        </div>

        {/* 🔒 RBAC: ONLY SHOW TO ADMINS */}
        {user?.role === 'admin' && (
          <button 
            onClick={handleRetrain}
            disabled={isTraining}
            style={{ 
              background: "rgba(59, 130, 246, 0.1)", 
              color: "#3b82f6", 
              border: "1px solid #3b82f6", 
              padding: "0.5rem 1rem", 
              borderRadius: "6px", 
              cursor: isTraining ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: "0.85rem"
            }}
          >
            {isTraining ? "Training AI..." : "⚡ Retrain AI Model"}
          </button>
        )}
      </header>

      {/* METRICS GRID */}
      {summary && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "1.5rem",
          marginBottom: "2rem" 
        }}>
          <StatCard title="Total Contracts" value={summary.total_contracts} color="blue" />
          <StatCard title="Low Risk" value={summary.risk_distribution.LOW} color="green" />
          <StatCard title="Medium Risk" value={summary.risk_distribution.MEDIUM} color="yellow" />
          <StatCard title="High Risk" value={summary.risk_distribution.HIGH} color="red" />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
        
        {/* LEFT COLUMN: CONTRACTS */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0 }}>Recent Contracts</h3>
            <button className="badge" style={{ border: "1px solid var(--text-secondary)", cursor: "pointer" }}>View All</button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {contracts.slice(0, 5).map(contract => (
              <div key={contract.id} className="card" style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{contract.contract_name}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Vendor ID: {contract.vendor_id} • Expires: {contract.end_date}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <RiskBadge level={contract.risk_level} />
                  <div style={{ fontSize: "0.75rem", marginTop: "0.25rem", color: "var(--text-secondary)" }}>
                    Score: {contract.risk_score}/100
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT COLUMN: VENDORS */}
        <section>
          <h3 style={{ marginBottom: "1rem" }}>Top Vendors</h3>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <tr>
                  <th style={{ padding: "1rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>NAME</th>
                  <th style={{ padding: "1rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>SCORE</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map(vendor => (
                  <tr key={vendor.vendor_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 500 }}>{vendor.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{vendor.category}</div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{ 
                        fontWeight: 700, 
                        color: vendor.performance_score > 90 ? "var(--accent-success)" : "var(--accent-warning)" 
                      }}>
                        {vendor.performance_score.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}