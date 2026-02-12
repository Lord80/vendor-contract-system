import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Contract } from '../types';
import ContractDetails from './ContractDetails';
import { useAuth } from '../context/AuthContext'; // ✅ Import Auth Hook

export default function Contracts() {
  const { user } = useAuth(); // ✅ Get current user
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState("ALL");

  // Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form Data State for Upload
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    contract_name: "",
    vendor_id: "",
    start_date: "",
    end_date: ""
  });

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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.contract_name || !uploadForm.vendor_id) {
        alert("Please fill in all required fields.");
        return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadForm.file);
      formData.append("contract_name", uploadForm.contract_name);
      formData.append("vendor_id", uploadForm.vendor_id);
      formData.append("start_date", uploadForm.start_date || new Date().toISOString().split('T')[0]);
      formData.append("end_date", uploadForm.end_date || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]);

      await api.uploadContract(formData); 
      
      alert("✅ Contract Uploaded & Analyzed!");
      setShowUploadModal(false);
      setUploadForm({ file: null, contract_name: "", vendor_id: "", start_date: "", end_date: "" }); // Reset
      loadContracts(); 
    } catch (err) {
      alert("Failed to upload contract.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Filter Logic
  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.contract_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === "ALL" || c.risk_level === filterRisk;
    return matchesSearch && matchesRisk;
  });

  const handleExport = () => {
    const headers = ["ID", "Contract Name", "Status", "Risk Level", "End Date"];
    const rows = filteredContracts.map(c => [
      c.id, `"${c.contract_name}"`, c.status, c.risk_level, c.end_date || "N/A"
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `contracts_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (selectedContractId) {
    return <ContractDetails contractId={selectedContractId} onBack={() => { setSelectedContractId(null); loadContracts(); }} />;
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* HEADER */}
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0 }}>Contract Repository</h1>
          <p style={{ color: "var(--text-secondary)" }}>Manage and track all vendor agreements.</p>
        </div>
        
        <div style={{ display: "flex", gap: "1rem" }}>
            {/* ❌ HIDE UPLOAD BUTTON FOR SUPER ADMIN */}
            {user?.role !== 'super_admin' && (
                <button 
                    onClick={() => setShowUploadModal(true)}
                    style={{ background: "#3b82f6", color: "white", border: "none", padding: "0.75rem 1.5rem", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
                >
                    ➕ Upload Contract
                </button>
            )}

            <button 
                onClick={handleExport}
                style={{ background: "#10b981", color: "white", border: "none", padding: "0.75rem 1.5rem", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
            >
                📥 Export CSV
            </button>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="card" style={{ marginBottom: "2rem", display: "flex", gap: "1rem", alignItems: "center", padding: "1rem" }}>
        <input 
            type="text" 
            placeholder="🔍 Search..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, padding: "0.75rem", background: "rgba(0,0,0,0.2)", border: "1px solid #444", color: "white", borderRadius: "6px" }}
        />
        <select 
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            style={{ padding: "0.75rem", background: "rgba(0,0,0,0.2)", border: "1px solid #444", color: "white", borderRadius: "6px" }}
        >
            <option value="ALL">All Risks</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="card">
        {loading ? <p style={{textAlign: "center", padding: "2rem"}}>Loading contracts...</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)" }}>
                <th style={{ padding: "1rem" }}>Contract Name</th>
                <th style={{ padding: "1rem" }}>Status</th>
                <th style={{ padding: "1rem" }}>End Date</th>
                <th style={{ padding: "1rem" }}>Risk</th>
                <th style={{ padding: "1rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center" }}>No contracts found.</td></tr>
              ) : (
                filteredContracts.map(c => (
                  <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "1rem", fontWeight: 500 }}>{c.contract_name}</td>
                    <td style={{ padding: "1rem" }}>{c.status || "ACTIVE"}</td>
                    <td style={{ padding: "1rem", color: "#888" }}>{c.end_date || "N/A"}</td>
                    <td style={{ padding: "1rem" }}>
                        <span style={{ color: c.risk_level === 'HIGH' ? '#ef4444' : c.risk_level === 'MEDIUM' ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
                            {c.risk_level}
                        </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                        <button 
                            onClick={() => setSelectedContractId(c.id)}
                            style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", border: "1px solid #3b82f6", padding: "0.4rem 0.8rem", borderRadius: "4px", cursor: "pointer" }}
                        >
                        View
                        </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ✅ UPLOAD MODAL (Already hides button, but modal logic stays) */}
      {showUploadModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
            <div className="card" style={{ width: "450px", border: "1px solid #3b82f6" }}>
                <h2 style={{ marginTop: 0 }}>📄 Upload Contract</h2>
                <form onSubmit={handleUpload} style={{ display: "grid", gap: "1rem" }}>
                    {/* ... Form inputs ... */}
                    <input 
                        type="file" 
                        accept=".pdf" 
                        required
                        onChange={(e) => setUploadForm({...uploadForm, file: e.target.files ? e.target.files[0] : null})}
                        style={{ width: "100%", padding: "0.5rem", background: "#1e293b", border: "1px solid #333" }}
                    />
                    <input 
                        type="text"
                        placeholder="Contract Name (e.g. Service Agreement)"
                        required
                        value={uploadForm.contract_name}
                        onChange={(e) => setUploadForm({...uploadForm, contract_name: e.target.value})}
                        style={{ padding: "0.8rem", background: "#1e293b", border: "1px solid #333", color: "white" }}
                    />
                    <input 
                        type="number"
                        placeholder="Vendor ID (e.g. 1)"
                        required
                        value={uploadForm.vendor_id}
                        onChange={(e) => setUploadForm({...uploadForm, vendor_id: e.target.value})}
                        style={{ padding: "0.8rem", background: "#1e293b", border: "1px solid #333", color: "white" }}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                            <label style={{fontSize: "0.8rem", color: "#aaa"}}>Start Date</label>
                            <input 
                                type="date"
                                required
                                value={uploadForm.start_date}
                                onChange={(e) => setUploadForm({...uploadForm, start_date: e.target.value})}
                                style={{ width: "100%", padding: "0.8rem", background: "#1e293b", border: "1px solid #333", color: "white" }}
                            />
                        </div>
                        <div>
                            <label style={{fontSize: "0.8rem", color: "#aaa"}}>End Date</label>
                            <input 
                                type="date"
                                required
                                value={uploadForm.end_date}
                                onChange={(e) => setUploadForm({...uploadForm, end_date: e.target.value})}
                                style={{ width: "100%", padding: "0.8rem", background: "#1e293b", border: "1px solid #333", color: "white" }}
                            />
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                        <button 
                            type="button"
                            onClick={() => setShowUploadModal(false)}
                            style={{ background: "transparent", border: "1px solid #555", color: "white", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={!uploadForm.file || uploading}
                            style={{ background: "#3b82f6", border: "none", color: "white", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer", opacity: uploading ? 0.7 : 1 }}
                        >
                            {uploading ? "Analyzing..." : "Upload & Analyze"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}