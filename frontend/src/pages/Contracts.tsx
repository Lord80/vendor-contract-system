import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Contract } from '../types';
import ContractDetails from './ContractDetails';
import { useAuth } from '../context/AuthContext';

export default function Contracts() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState("ALL");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    contract_name: "",
    vendor_id: "",
    start_date: "",
    end_date: ""
  });

  useEffect(() => { loadContracts(); }, []);

  async function loadContracts() {
    setLoading(true);
    try {
      const data = await api.getAllContracts();
      setContracts(data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.contract_name || !uploadForm.vendor_id) return alert("Missing fields");

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadForm.file);
      formData.append("contract_name", uploadForm.contract_name);
      formData.append("vendor_id", uploadForm.vendor_id);
      formData.append("start_date", uploadForm.start_date || new Date().toISOString().split('T')[0]);
      formData.append("end_date", uploadForm.end_date || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]);

      await api.uploadContract(formData); 
      alert("✅ Uploaded!");
      setShowUploadModal(false);
      setUploadForm({ file: null, contract_name: "", vendor_id: "", start_date: "", end_date: "" });
      loadContracts(); 
    } catch (err) { alert("Upload failed."); } 
    finally { setUploading(false); }
  };

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
          <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>Contract Repository</h1>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>Manage and analyze all agreements.</p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
            {user?.role !== 'super_admin' && (
                <button onClick={() => setShowUploadModal(true)} className="btn-primary">➕ Upload Contract</button>
            )}
            <button onClick={handleExport} className="btn-ghost" style={{ border: "1px solid var(--border-highlight)" }}>📥 Export CSV</button>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="card" style={{ marginBottom: "2rem", display: "flex", gap: "1rem", alignItems: "center", padding: "1.2rem" }}>
        <input 
            type="text" 
            placeholder="🔍 Search contracts..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, background: "rgba(0,0,0,0.2)" }}
        />
        <select 
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            style={{ width: "200px", background: "rgba(0,0,0,0.2)" }}
        >
            <option value="ALL">All Risk Levels</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
            <div style={{ padding: "2rem", display: "grid", gap: "1rem" }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: "60px" }}></div>)}
            </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border-subtle)" }}>
              <tr>
                <th style={{ padding: "1.2rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>NAME</th>
                <th style={{ padding: "1.2rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>STATUS</th>
                <th style={{ padding: "1.2rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>END DATE</th>
                <th style={{ padding: "1.2rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>RISK</th>
                <th style={{ padding: "1.2rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>No contracts found.</td></tr>
              ) : (
                filteredContracts.map(c => (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--border-subtle)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "1.2rem", fontWeight: 500 }}>{c.contract_name}</td>
                    <td style={{ padding: "1.2rem" }}>
                        <span style={{ fontSize: "0.8rem", padding: "0.2rem 0.6rem", borderRadius: "4px", background: c.status === 'ACTIVE' ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)", color: c.status === 'ACTIVE' ? "var(--success)" : "var(--text-muted)" }}>
                            {c.status || "ACTIVE"}
                        </span>
                    </td>
                    <td style={{ padding: "1.2rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>{c.end_date || "N/A"}</td>
                    <td style={{ padding: "1.2rem" }}>
                        <span className={`badge ${c.risk_level}`}>{c.risk_level}</span>
                    </td>
                    <td style={{ padding: "1.2rem" }}>
                        <button onClick={() => setSelectedContractId(c.id)} className="btn-ghost" style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(5px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
            <div className="card fade-in" style={{ width: "500px", padding: "2rem", border: "1px solid var(--border-highlight)" }}>
                <h2 style={{ marginTop: 0, marginBottom: "1.5rem" }}>📄 Upload Contract</h2>
                <form onSubmit={handleUpload} style={{ display: "grid", gap: "1.2rem" }}>
                    <div style={{ border: "2px dashed var(--border-highlight)", padding: "2rem", textAlign: "center", borderRadius: "8px", cursor: "pointer", background: "rgba(0,0,0,0.2)" }} onClick={() => document.getElementById('fileInput')?.click()}>
                        <input id="fileInput" type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => setUploadForm({...uploadForm, file: e.target.files ? e.target.files[0] : null})} />
                        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📂</div>
                        <div style={{ color: "var(--accent-blue)" }}>{uploadForm.file ? uploadForm.file.name : "Click to select PDF"}</div>
                    </div>
                    <input type="text" placeholder="Contract Name" required value={uploadForm.contract_name} onChange={(e) => setUploadForm({...uploadForm, contract_name: e.target.value})} />
                    <input type="number" placeholder="Vendor ID" required value={uploadForm.vendor_id} onChange={(e) => setUploadForm({...uploadForm, vendor_id: e.target.value})} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div><label style={{fontSize:"0.8rem", color:"var(--text-muted)", marginBottom:"4px", display:"block"}}>Start Date</label><input type="date" required value={uploadForm.start_date} onChange={(e) => setUploadForm({...uploadForm, start_date: e.target.value})} /></div>
                        <div><label style={{fontSize:"0.8rem", color:"var(--text-muted)", marginBottom:"4px", display:"block"}}>End Date</label><input type="date" required value={uploadForm.end_date} onChange={(e) => setUploadForm({...uploadForm, end_date: e.target.value})} /></div>
                    </div>
                    <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                        <button type="button" onClick={() => setShowUploadModal(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
                        <button type="submit" disabled={!uploadForm.file || uploading} className="btn-primary" style={{ flex: 1 }}>{uploading ? "Analyzing..." : "Upload"}</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}