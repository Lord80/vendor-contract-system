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
    setComparison(null);
    try {
      const result = await api.compareContracts(Number(selectedId1), Number(selectedId2));
      setComparison(result);
    } catch (err) {
      alert("Comparison failed. Ensure backend AI services are running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 1400, margin: "0 auto", height: "calc(100vh - 4rem)", display: "flex", flexDirection: "column" }}>
      
      {/* HEADER & CONTROLS */}
      <header style={{ flexShrink: 0, marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: "0 0 1rem 0" }}>AI Legal Comparison</h1>
        
        {/* SELECTION BAR */}
        <div className="card" style={{ padding: "1.2rem", display: "grid", gridTemplateColumns: "1fr auto 1fr auto", gap: "1rem", alignItems: "end", background: "var(--glass-bg)", border: "var(--glass-border)" }}>
          
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>Base Contract</label>
            <select 
              value={selectedId1} onChange={(e) => setSelectedId1(e.target.value)}
              style={{ background: "rgba(0,0,0,0.3)", width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-subtle)", color: "white" }}
            >
              <option value="">Select Document A</option>
              {contracts.map(c => <option key={c.id} value={c.id}>{c.contract_name}</option>)}
            </select>
          </div>

          <div style={{ paddingBottom: "0.8rem", color: "var(--text-muted)", fontSize: "1.2rem", fontWeight: "300" }}>VS</div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>Comparison Target</label>
            <select 
              value={selectedId2} onChange={(e) => setSelectedId2(e.target.value)}
              style={{ background: "rgba(0,0,0,0.3)", width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-subtle)", color: "white" }}
            >
              <option value="">Select Document B</option>
              {contracts.filter(c => String(c.id) !== selectedId1).map(c => <option key={c.id} value={c.id}>{c.contract_name}</option>)}
            </select>
          </div>

          <button 
            onClick={handleCompare}
            disabled={loading || !selectedId1 || !selectedId2}
            className="btn-primary"
            style={{ height: "42px", padding: "0 2rem" }}
          >
            {loading ? "Processing..." : "Run Analysis"}
          </button>
        </div>
      </header>

      {/* RESULTS AREA */}
      {comparison && (
        <div className="fade-in" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          
          {/* METRICS HEADER */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem", flexShrink: 0 }}>
             <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.5rem" }}>
                <div style={{ height: "50px", width: "50px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                    📊
                </div>
                <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700 }}>SIMILARITY SCORE</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>{(comparison.overall_comparison?.similarity_score * 100).toFixed(1)}%</div>
                </div>
             </div>

             <div className="card" style={{ padding: "1rem 1.5rem" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700, marginBottom: "0.5rem" }}>DOCUMENT A RISK</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.9rem" }}>{comparison.contract1}</span>
                    <RiskBadge level={comparison.risk_comparison?.contract1_risk} />
                </div>
             </div>

             <div className="card" style={{ padding: "1rem 1.5rem" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700, marginBottom: "0.5rem" }}>DOCUMENT B RISK</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.9rem" }}>{comparison.contract2}</span>
                    <RiskBadge level={comparison.risk_comparison?.contract2_risk} />
                </div>
             </div>
          </div>

          {/* SIDE-BY-SIDE DIFF VIEW */}
          <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.5rem", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--border-subtle)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                <div style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.85rem", letterSpacing: "0.5px" }}>BASE CONTRACT CLAUSES</div>
                <div style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.85rem", letterSpacing: "0.5px" }}>MATCHED CLAUSES (TARGET)</div>
            </div>
            
            <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
                {comparison.clause_comparison?.clause_comparisons?.length > 0 ? (
                    comparison.clause_comparison.clause_comparisons.map((match: any, i: number) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid var(--border-subtle)" }}>
                            
                            {/* Left Pane */}
                            <div style={{ padding: "1.5rem", borderRight: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.01)" }}>
                                <div style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>{match.clause}</div>
                            </div>

                            {/* Right Pane */}
                            <div style={{ padding: "1.5rem", position: "relative" }}>
                                <div style={{ 
                                    position: "absolute", top: "10px", right: "10px", fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px",
                                    background: match.similarity > 0.9 ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                                    color: match.similarity > 0.9 ? "var(--success)" : "var(--warning)"
                                }}>
                                    {(match.similarity * 100).toFixed(0)}% MATCH
                                </div>
                                <div style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--text-primary)" }}>{match.best_match}</div>
                            </div>

                        </div>
                    ))
                ) : (
                    <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
                        No structured clause matches found.
                    </div>
                )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}