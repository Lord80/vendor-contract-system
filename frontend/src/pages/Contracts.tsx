import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Contract } from '../types';
import ContractDetails from './ContractDetails';
import { useAuth } from '../context/AuthContext';
import { RiskBadge } from '../components/dashboard/RiskBadge';
import { UploadModal } from '../components/contracts/UploadModal'; // ✅ IMPORT

export default function Contracts() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState("ALL");
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => { loadContracts(); }, []);

  async function loadContracts() {
    setLoading(true);
    try {
      const data = await api.getAllContracts();
      setContracts(data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.contract_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === "ALL" || c.risk_level === filterRisk;
    return matchesSearch && matchesRisk;
  });

  const handleExport = () => {
    const headers = ["ID", "Name", "Status", "Risk", "End Date"];
    const rows = filteredContracts.map(c => [c.id, `"${c.contract_name}"`, c.status, c.risk_level, c.end_date || "N/A"]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }));
    link.setAttribute("download", `contracts_report.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (selectedContractId) return <ContractDetails contractId={selectedContractId} onBack={() => { setSelectedContractId(null); loadContracts(); }} />;

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: "0 auto" }}>
      
      {/* HEADER */}
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 0.5rem 0", letterSpacing: "-0.5px" }}>Contract Repository</h1>
          <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "1.1rem" }}>Manage and analyze all agreements.</p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
            {user?.role !== 'super_admin' && (
                <button onClick={() => setShowUploadModal(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>➕</span> Upload Contract
                </button>
            )}
            <button onClick={handleExport} className="btn-ghost" style={{ border: "1px solid var(--border-highlight)" }}>
                📥 Export CSV
            </button>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="card" style={{ marginBottom: "2rem", display: "flex", gap: "1rem", alignItems: "center", padding: "1rem" }}>
        <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }}>🔍</span>
            <input 
                type="text" 
                placeholder="Search contracts by name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: "36px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)" }}
            />
        </div>
        <select 
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            style={{ width: "200px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)" }}
        >
            <option value="ALL">All Risk Levels</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="card" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--border-highlight)" }}>
        {loading ? (
            <div style={{ padding: "2rem", display: "grid", gap: "1rem" }}>
                {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: "48px", borderRadius: "8px" }}></div>)}
            </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--border-subtle)" }}>
              <tr>
                <th style={{ padding: "1rem 1.5rem", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em" }}>CONTRACT NAME</th>
                <th style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em" }}>STATUS</th>
                <th style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", textAlign: "right" }}>END DATE</th>
                <th style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", textAlign: "center" }}>RISK</th>
                <th style={{ padding: "1rem 1.5rem", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", textAlign: "right" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? (
                <tr>
                    <td colSpan={5} style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "1rem", opacity: 0.5 }}>📭</div>
                        No contracts found matching your filters.
                    </td>
                </tr>
              ) : (
                filteredContracts.map(c => (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--border-subtle)", transition: "all 0.15s ease" }} className="hover:bg-white/5">
                    <td style={{ padding: "1rem 1.5rem", fontWeight: 500, color: "var(--text-primary)" }}>
                        {c.contract_name}
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>ID: {c.id} • Vendor #{c.vendor_id}</div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                        <span style={{ 
                            fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", fontWeight: 600,
                            background: c.status === 'ACTIVE' ? "rgba(16,185,129,0.15)" : "rgba(148,163,184,0.15)", 
                            color: c.status === 'ACTIVE' ? "#34d399" : "#94a3b8",
                            border: c.status === 'ACTIVE' ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(148,163,184,0.2)"
                        }}>
                            {c.status || "ACTIVE"}
                        </span>
                    </td>
                    <td style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {c.end_date || "—"}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                        <RiskBadge level={c.risk_level} />
                    </td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                        <button 
                            onClick={() => setSelectedContractId(c.id)}
                            className="btn-ghost" 
                            style={{ fontSize: "0.8rem", padding: "6px 12px", border: "1px solid var(--border-subtle)" }}
                        >
                            View Details
                        </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ✅ NEW: Use the Premium Upload Modal */}
      {showUploadModal && (
        <UploadModal 
            onClose={() => setShowUploadModal(false)} 
            onSuccess={loadContracts} 
        />
      )}
    </div>
  );
}