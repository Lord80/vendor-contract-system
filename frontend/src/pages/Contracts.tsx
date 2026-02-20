import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Contract } from '../types';
import ContractDetails from './ContractDetails';
import { useAuth } from '../context/AuthContext';
import { RiskBadge } from '../components/dashboard/RiskBadge';
import { UploadModal } from '../components/contracts/UploadModal';
import { Search, Plus, Download } from 'lucide-react';

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
    try { const data = await api.getAllContracts(); setContracts(data); } 
    catch (err) { console.error(err); } finally { setLoading(false); }
  }

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.contract_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === "ALL" || c.risk_level === filterRisk;
    return matchesSearch && matchesRisk;
  });

  const handleExport = () => {
    const headers = ["ID", "Name", "Status", "Risk", "End Date", "Vendor ID"];
    const rows = filteredContracts.map(c => [c.id, `"${c.contract_name}"`, c.status, c.risk_level, c.end_date || "N/A", c.vendor_id]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }));
    link.setAttribute("download", `contracts_report.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (selectedContractId) return <ContractDetails contractId={selectedContractId} onBack={() => { setSelectedContractId(null); loadContracts(); }} />;

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="glow-text" style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 0.5rem 0", letterSpacing: "-0.5px" }}>Contracts</h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "1rem" }}>Centralized repository with AI risk scoring.</p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
            {user?.role !== 'super_admin' && (
                <button onClick={() => setShowUploadModal(true)} className="btn-primary-glow" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Plus size={18} /> Upload Contract
                </button>
            )}
            <button onClick={handleExport} className="btn-neon" style={{ display: "flex", alignItems: "center", gap: "8px", color: "white", borderColor: "var(--glass-border)" }}>
                <Download size={18} /> Export CSV
            </button>
        </div>
      </header>
      <div className="holo-card" style={{ marginBottom: "2rem", display: "flex", gap: "1rem", alignItems: "center", padding: "0.8rem 1rem" }}>
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={18} style={{ position: "absolute", left: "12px", color: "var(--text-muted)" }} />
            <input type="text" placeholder="Search contracts by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: "100%", padding: "0.8rem 1rem 0.8rem 2.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "white", outline: "none", height: "42px", fontSize: "0.9rem" }} />
        </div>
        <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} style={{ width: "200px", padding: "0 1rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "white", outline: "none", height: "42px", cursor: "pointer", fontSize: "0.9rem" }}>
            <option value="ALL">All Risk Levels</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
        </select>
      </div>
      <div className="holo-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div style={{ padding: "2rem" }}>Loading...</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid var(--glass-border)" }}>
              <tr>
                <th style={{ padding: "1.2rem 1.5rem", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.05em" }}>CONTRACT NAME</th>
                <th style={{ padding: "1.2rem", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.05em" }}>STATUS</th>
                <th style={{ padding: "1.2rem", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.05em", textAlign: "right" }}>END DATE</th>
                <th style={{ padding: "1.2rem", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.05em", textAlign: "center" }}>RISK</th>
                <th style={{ padding: "1.2rem 1.5rem", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.05em", textAlign: "right" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? <tr><td colSpan={5} style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>No contracts found.</td></tr> : 
                filteredContracts.map(c => (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--glass-border)", transition: "all 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: 500, color: "var(--text-main)" }}>{c.contract_name}<div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "2px", fontFamily: "monospace" }}>ID: {c.id} • Vendor #{c.vendor_id}</div></td>
                    <td style={{ padding: "1rem" }}><span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "4px", fontWeight: 600, background: c.status === 'ACTIVE' ? "rgba(16,185,129,0.1)" : "rgba(148,163,184,0.1)", color: c.status === 'ACTIVE' ? "#10b981" : "#94a3b8" }}>{c.status || "ACTIVE"}</span></td>
                    <td style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "right", fontFamily: "monospace" }}>{c.end_date || "—"}</td>
                    <td style={{ padding: "1rem", textAlign: "center" }}><RiskBadge level={c.risk_level} /></td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}><button onClick={() => setSelectedContractId(c.id)} className="btn-neon" style={{ fontSize: "0.75rem", padding: "6px 12px" }}>View</button></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
      </div>
      {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} onSuccess={loadContracts} />}
    </div>
  );
}