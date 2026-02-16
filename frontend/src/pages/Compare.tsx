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
      alert("Comparison failed. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>AI Comparison</h1>
        <p style={{ color: "var(--text-secondary)", margin: 0 }}>Detect deviations and analyze clause similarity.</p>
      </header>

      {/* SELECTION BAR */}
      <div className="card" style={{ marginBottom: "2rem", border: "1px solid var(--border-highlight)" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
          
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Base Contract</label>
            <select 
              value={selectedId1} onChange={(e) => setSelectedId1(e.target.value)}
              style={{ background: "rgba(0,0,0,0.3)" }}
            >
              <option value="">-- Select Contract --</option>
              {contracts.map(c => <option key={c.id} value={c.id}>{c.contract_name}</option>)}
            </select>
          </div>

          <div style={{ paddingBottom: "0.8rem", color: "var(--text-muted)", fontWeight: 700, fontSize: "1.2rem" }}>VS</div>

          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Comparison Target</label>
            <select 
              value={selectedId2} onChange={(e) => setSelectedId2(e.target.value)}
              style={{ background: "rgba(0,0,0,0.3)" }}
            >
              <option value="">-- Select Contract --</option>
              {contracts.filter(c => String(c.id) !== selectedId1).map(c => <option key={c.id} value={c.id}>{c.contract_name}</option>)}
            </select>
          </div>

          <button 
            onClick={handleCompare}
            disabled={loading || !selectedId1 || !selectedId2}
            className="btn-primary"
            style={{ marginBottom: "2px", height: "46px" }}
          >
            {loading ? "Analyzing..." : "Run Comparison"}
          </button>
        </div>
      </div>

      {/* RESULTS */}
      {comparison && (
        <div className="fade-in">
          
          {/* SUMMARY GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.5rem", marginBottom: "2rem" }}>
            <div className="card" style={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", background: "linear-gradient(135deg, rgba(16,185,129,0.1), transparent)" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "1px" }}>SIMILARITY MATCH</div>
              <div style={{ fontSize: "3.5rem", fontWeight: 800, color: "var(--success)", lineHeight: 1, margin: "0.5rem 0" }}>
                {(comparison.overall_comparison.similarity_score * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{comparison.overall_comparison.interpretation}</div>
            </div>

            <div className="card">
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-secondary)" }}>Risk Variance</h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>{comparison.contract1}</div>
                  <RiskBadge level={comparison.risk_comparison.contract1_risk} />
                </div>
                <div style={{ fontSize: "1.5rem", color: "var(--text-muted)" }}>→</div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>{comparison.contract2}</div>
                  <RiskBadge level={comparison.risk_comparison.contract2_risk} />
                </div>
              </div>
            </div>
          </div>

          {/* CLAUSE ANALYSIS */}
          <h3 style={{ marginBottom: "1rem", fontSize: "1.2rem" }}>Clause Deviation Analysis</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {comparison.clause_comparison.clause_comparisons.map((match: any, i: number) => (
              <div key={i} className="card" style={{ padding: "0", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
                <div style={{ padding: "0.8rem 1.5rem", background: "rgba(255,255,255,0.03)", display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>CLAUSE PAIR #{i+1}</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: match.similarity > 0.9 ? "var(--success)" : "var(--warning)" }}>
                    {(match.similarity * 100).toFixed(0)}% MATCH
                  </span>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                  <div style={{ padding: "1.5rem", borderRight: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: 600 }}>BASE CONTRACT</div>
                    <div style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>"{match.clause}"</div>
                  </div>
                  <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.01)" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: 600 }}>COMPARISON</div>
                    <div style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--text-primary)" }}>"{match.best_match}"</div>
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