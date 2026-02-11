import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { RiskBadge } from '../components/dashboard/RiskBadge';
import type { Contract } from '../types';

export default function Compare() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedId1, setSelectedId1] = useState<string>("");
  const [selectedId2, setSelectedId2] = useState<string>("");
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load contracts for the dropdowns
  useEffect(() => {
    api.getAllContracts().then(setContracts).catch(console.error);
  }, []);

  const handleCompare = async () => {
    if (!selectedId1 || !selectedId2) return;
    setLoading(true);
    try {
      const result = await api.compareContracts(Number(selectedId1), Number(selectedId2));
      setComparison(result);
    } catch (err) {
      console.error(err);
      alert("Comparison failed. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          AI Contract Comparison
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Select two contracts to detect deviations and analyzing semantic similarity.
        </p>
      </header>

      {/* SELECTION CARD */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "2rem", alignItems: "end" }}>
          
          {/* Contract 1 Selector */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Base Contract</label>
            <select 
              value={selectedId1} 
              onChange={(e) => setSelectedId1(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", background: "var(--bg-dark)", color: "white", border: "1px solid #333", borderRadius: "6px" }}
            >
              <option value="">-- Select Contract --</option>
              {contracts.map(c => <option key={c.id} value={c.id}>{c.contract_name}</option>)}
            </select>
          </div>

          <div style={{ textAlign: "center", paddingBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 700 }}>VS</div>

          {/* Contract 2 Selector */}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Comparison Contract</label>
            <select 
              value={selectedId2} 
              onChange={(e) => setSelectedId2(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", background: "var(--bg-dark)", color: "white", border: "1px solid #333", borderRadius: "6px" }}
            >
              <option value="">-- Select Contract --</option>
              {contracts.filter(c => String(c.id) !== selectedId1).map(c => <option key={c.id} value={c.id}>{c.contract_name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
          <button 
            onClick={handleCompare}
            disabled={loading || !selectedId1 || !selectedId2}
            style={{ 
              background: "var(--accent-primary)", 
              color: "white", 
              border: "none", 
              padding: "0.75rem 2rem", 
              borderRadius: "6px", 
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Analyzing Vectors..." : "Run AI Comparison"}
          </button>
        </div>
      </div>

      {/* RESULTS DISPLAY */}
      {comparison && (
        <div className="fade-in">
          
          {/* OVERALL SCORE */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem", marginBottom: "2rem" }}>
            <div className="card" style={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>SIMILARITY SCORE</div>
              <div style={{ fontSize: "3rem", fontWeight: 800, color: "var(--accent-success)" }}>
                {(comparison.overall_comparison.similarity_score * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                {comparison.overall_comparison.interpretation}
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0, borderBottom: "1px solid #333", paddingBottom: "0.5rem" }}>Risk Variance</h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{comparison.contract1}</div>
                  <div style={{ marginTop: "0.5rem" }}><RiskBadge level={comparison.risk_comparison.contract1_risk} /></div>
                </div>
                <div style={{ fontSize: "1.5rem", color: "#555" }}>→</div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{comparison.contract2}</div>
                  <div style={{ marginTop: "0.5rem" }}><RiskBadge level={comparison.risk_comparison.contract2_risk} /></div>
                </div>
              </div>
            </div>
          </div>

          {/* CLAUSE MATCHING */}
          <h3 style={{ marginBottom: "1rem" }}>Clause-by-Clause Analysis</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {comparison.clause_comparison.clause_comparisons.map((match: any, i: number) => (
              <div key={i} className="card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <span className="badge" style={{ background: "#334155", color: "#cbd5e1" }}>Clause Pair #{i+1}</span>
                  <span style={{ fontWeight: 600, color: match.similarity > 0.9 ? "var(--accent-success)" : "var(--accent-warning)" }}>
                    {(match.similarity * 100).toFixed(0)}% Match
                  </span>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                  <div style={{ fontSize: "0.9rem", color: "#cbd5e1", lineHeight: 1.6 }}>
                    <strong style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>Base Contract:</strong>
                    "{match.clause}"
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#cbd5e1", lineHeight: 1.6, borderLeft: "1px solid #333", paddingLeft: "2rem" }}>
                    <strong style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>Comparison Contract:</strong>
                    "{match.best_match}"
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}