import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Contract } from '../types';
import ContractDetails from './ContractDetails'; // Ensure this matches your file name

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);

  // 🔍 1. Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState("ALL"); // Options: ALL, HIGH, MEDIUM, LOW

  useEffect(() => {
    loadContracts();
  }, []);

  async function loadContracts() {
    setLoading(true);
    try {
      const data = await api.getAllContracts();
      setContracts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // 🔍 2. Filter Logic
  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.contract_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === "ALL" || c.risk_level === filterRisk;
    return matchesSearch && matchesRisk;
  });

  // 📥 3. Export to Excel (CSV) Function
  const handleExport = () => {
    const headers = ["ID", "Contract Name", "Vendor ID", "Status", "Risk Level", "Risk Score", "End Date"];
    
    // Map data to CSV rows
    const rows = filteredContracts.map(c => [
      c.id,
      `"${c.contract_name.replace(/"/g, '""')}"`, // Handle commas/quotes in names
      c.vendor_id,
      c.status || "ACTIVE",
      c.risk_level,
      c.risk_score,
      c.end_date || "N/A"
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `contracts_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (selectedContractId) {
    return (
      <ContractDetails 
        contractId={selectedContractId} 
        onBack={() => {
            setSelectedContractId(null);
            console.log("Returning to list... reloading data."); // <--- Add this log
            setLoading(true); // <--- Force loading state
            loadContracts();  // <--- This MUST be called
        }} 
      />
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* HEADER */}
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0 }}>Contract Repository</h1>
          <p style={{ color: "var(--text-secondary)" }}>Manage and track all vendor agreements.</p>
        </div>
        
        {/* EXPORT BUTTON */}
        <button 
            onClick={handleExport}
            style={{ 
                background: "#10b981", 
                color: "white", 
                border: "none", 
                padding: "0.75rem 1.5rem", 
                borderRadius: "6px", 
                cursor: "pointer", 
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
            }}
        >
            📥 Export to Excel
        </button>
      </header>

      {/* FILTER BAR */}
      <div className="card" style={{ marginBottom: "2rem", display: "flex", gap: "1rem", alignItems: "center", padding: "1rem" }}>
        <div style={{ flex: 1 }}>
            <input 
                type="text" 
                placeholder="🔍 Search contracts..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                    width: "100%", 
                    padding: "0.75rem", 
                    background: "rgba(0,0,0,0.2)", 
                    border: "1px solid #444", 
                    color: "white", 
                    borderRadius: "6px" 
                }}
            />
        </div>
        
        <div>
            <select 
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                style={{ 
                    padding: "0.75rem", 
                    background: "rgba(0,0,0,0.2)", 
                    border: "1px solid #444", 
                    color: "white", 
                    borderRadius: "6px" 
                }}
            >
                <option value="ALL">All Risk Levels</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk</option>
            </select>
        </div>
      </div>

      {/* CONTRACT TABLE */}
      <div className="card">
        {loading ? <p style={{textAlign: "center", padding: "2rem"}}>Loading contracts...</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                <th style={{ padding: "1rem" }}>Contract Name</th>
                <th style={{ padding: "1rem" }}>Status</th>
                <th style={{ padding: "1rem" }}>End Date</th>
                <th style={{ padding: "1rem" }}>Risk Level</th>
                <th style={{ padding: "1rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? (
                <tr>
                    <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                        No contracts found matching your filters.
                    </td>
                </tr>
              ) : (
                filteredContracts.map(c => (
                    <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "1rem", fontWeight: 500 }}>{c.contract_name}</td>
                    <td style={{ padding: "1rem" }}>
                        <span style={{ 
                            padding: "4px 8px", 
                            borderRadius: "4px", 
                            fontSize: "0.8rem",
                            background: c.status === 'TERMINATED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                            color: c.status === 'TERMINATED' ? '#ef4444' : 'white'
                        }}>
                        {c.status || "ACTIVE"}
                        </span>
                    </td>
                    <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>{c.end_date || "N/A"}</td>
                    <td style={{ padding: "1rem" }}>
                        <span style={{ 
                            color: c.risk_level === 'HIGH' ? '#ef4444' : c.risk_level === 'MEDIUM' ? '#f59e0b' : '#10b981',
                            fontWeight: 600 
                        }}>
                        {c.risk_level}
                        </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                        <button 
                            onClick={() => setSelectedContractId(c.id)}
                            style={{ 
                                background: "rgba(59, 130, 246, 0.1)", 
                                color: "#3b82f6", 
                                border: "1px solid #3b82f6", 
                                padding: "0.4rem 0.8rem", 
                                borderRadius: "4px", 
                                cursor: "pointer",
                                fontSize: "0.85rem"
                            }}
                        >
                        View & Manage
                        </button>
                    </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}