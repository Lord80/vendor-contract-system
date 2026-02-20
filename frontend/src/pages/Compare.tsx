import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { RiskBadge } from '../components/dashboard/RiskBadge';
import type { Contract } from '../types';
import { ArrowLeftRight, FileCheck } from 'lucide-react';

export default function Compare() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedId1, setSelectedId1] = useState<string>("");
  const [selectedId2, setSelectedId2] = useState<string>("");
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.getAllContracts().then(setContracts).catch(console.error); }, []);

  const handleCompare = async () => {
    if (!selectedId1 || !selectedId2) return;
    setLoading(true);
    setComparison(null);
    try {
      const result = await api.compareContracts(Number(selectedId1), Number(selectedId2));
      setComparison(result);
    } catch (err) { alert("Comparison failed."); } finally { setLoading(false); }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 1400, margin: "0 auto", height: "calc(100vh - 4rem)", display: "flex", flexDirection: "column" }}>
      
      {/* CONTROLS */}
      <div className="holo-card" style={{ padding: "1.5rem", marginBottom: "2rem", display: "grid", gridTemplateColumns: "1fr auto 1fr auto", gap: "1.5rem", alignItems: "end" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>BASE DOCUMENT</label>
            <select value={selectedId1} onChange={(e) => setSelectedId1(e.target.value)} style={{ width: "100%", padding: "0.8rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "white" }}>
              <option value="">Select Contract A</option>
              {contracts.map(c => <option key={c.id} value={c.id}>{c.contract_name}</option>)}
            </select>
          </div>
          <ArrowLeftRight size={24} color="var(--text-muted)" style={{ marginBottom: "10px" }} />
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>COMPARISON TARGET</label>
            <select value={selectedId2} onChange={(e) => setSelectedId2(e.target.value)} style={{ width: "100%", padding: "0.8rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "white" }}>
              <option value="">Select Contract B</option>
              {contracts.filter(c => String(c.id) !== selectedId1).map(c => <option key={c.id} value={c.id}>{c.contract_name}</option>)}
            </select>
          </div>
          <button onClick={handleCompare} disabled={loading || !selectedId1 || !selectedId2} className="btn-primary-glow" style={{ height: "46px" }}>
            {loading ? "Analyzing..." : "Compare"}
          </button>
      </div>

      {/* RESULTS */}
      {comparison && (
        <div className="fade-in" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* HEADER METRICS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
             <div className="holo-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.5rem" }}>
                <div style={{ height: "50px", width: "50px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}><FileCheck /></div>
                <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>SIMILARITY</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{(comparison.overall_comparison?.similarity_score * 100).toFixed(1)}%</div>
                </div>
             </div>
             <div className="holo-card" style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>DOC A RISK</div><div style={{ fontSize: "1.2rem", fontWeight: 600 }}>{comparison.contract1}</div></div>
                <RiskBadge level={comparison.risk_comparison?.contract1_risk} />
             </div>
             <div className="holo-card" style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>DOC B RISK</div><div style={{ fontSize: "1.2rem", fontWeight: 600 }}>{comparison.contract2}</div></div>
                <RiskBadge level={comparison.risk_comparison?.contract2_risk} />
             </div>
          </div>

          {/* DIFF VIEWER */}
          <div className="holo-card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.5rem", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--glass-border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                <div style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: "0.75rem", letterSpacing: "1px" }}>BASE CLAUSES</div>
                <div style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: "0.75rem", letterSpacing: "1px" }}>MATCHED TARGET CLAUSES</div>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
                {comparison.clause_comparison?.clause_comparisons?.length > 0 ? (
                    comparison.clause_comparison.clause_comparisons.map((match: any, i: number) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid var(--glass-border)" }}>
                            <div style={{ padding: "1.5rem", borderRight: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.01)" }}>
                                <div style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "var(--text-dim)" }}>{match.clause}</div>
                            </div>
                            <div style={{ padding: "1.5rem", position: "relative" }}>
                                <div style={{ position: "absolute", top: "10px", right: "10px", fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: match.similarity > 0.9 ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", color: match.similarity > 0.9 ? "#34d399" : "#fbbf24" }}>
                                    {(match.similarity * 100).toFixed(0)}% MATCH
                                </div>
                                <div style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>{match.best_match}</div>
                            </div>
                        </div>
                    ))
                ) : <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>No matches found.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}