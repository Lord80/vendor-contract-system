import React, { useState } from 'react';
import { api } from '../../services/api';

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [vendorId, setVendorId] = useState("1"); // Default to ID 1 for now
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("vendor_id", vendorId);
    formData.append("contract_name", file.name.replace(".pdf", ""));
    formData.append("start_date", new Date().toISOString().split('T')[0]);
    // Default end date +1 year
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    formData.append("end_date", endDate.toISOString().split('T')[0]);

    try {
      await api.uploadContract(formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError("Upload failed. Ensure backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div className="card" style={{ width: "400px", background: "var(--bg-card)" }}>
        <h2 style={{ marginTop: 0 }}>Upload Contract</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Upload a PDF. LegalBERT & XGBoost will analyze it instantly.
        </p>

        {error && <div style={{ color: "var(--accent-danger)", marginBottom: "1rem", fontSize: "0.9rem" }}>{error}</div>}

        <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem" }}>Vendor ID</label>
            <input 
              type="number" 
              value={vendorId} 
              onChange={e => setVendorId(e.target.value)}
              style={{ width: "100%", padding: "0.5rem", background: "var(--bg-dark)", border: "1px solid #333", color: "white", borderRadius: "4px" }}
            />
          </div>

          <div style={{ border: "2px dashed #444", padding: "2rem", textAlign: "center", borderRadius: "8px", cursor: "pointer" }}>
            <input 
              type="file" 
              accept=".pdf"
              onChange={e => setFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
              id="file-upload"
            />
            <label htmlFor="file-upload" style={{ cursor: "pointer", color: "var(--accent-primary)" }}>
              {file ? file.name : "Click to Select PDF"}
            </label>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "0.75rem", background: "transparent", border: "1px solid #444", color: "white", borderRadius: "6px", cursor: "pointer" }}>
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || !file}
              style={{ 
                flex: 1, 
                padding: "0.75rem", 
                background: loading ? "#555" : "var(--accent-primary)", 
                border: "none", 
                color: "white", 
                borderRadius: "6px", 
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600
              }}
            >
              {loading ? "Analyzing..." : "Analyze & Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};