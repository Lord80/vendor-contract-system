import React, { useState } from 'react';
import { api } from '../../services/api';

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [vendorId, setVendorId] = useState("1");
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
      position: "fixed", inset: 0,
      backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div className="card fade-in" style={{ width: "450px", border: "1px solid var(--border-highlight)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
        <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.5rem" }}>📄 Upload Contract</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
            AI analysis (LegalBERT + XGBoost) starts automatically.
            </p>
        </div>

        {error && (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#fca5a5", padding: "0.8rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.9rem", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                {error}
            </div>
        )}

        <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Vendor ID</label>
            <input 
              type="number" 
              value={vendorId} 
              onChange={e => setVendorId(e.target.value)}
              placeholder="Enter ID..."
            />
          </div>

          <div 
            style={{ 
                border: "2px dashed var(--border-highlight)", 
                background: "rgba(0,0,0,0.2)",
                padding: "2rem", 
                textAlign: "center", 
                borderRadius: "12px", 
                cursor: "pointer",
                transition: "all 0.2s"
            }}
            onClick={() => document.getElementById('modal-file-upload')?.click()}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-blue)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-highlight)"}
          >
            <input 
              type="file" 
              accept=".pdf"
              onChange={e => setFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
              id="modal-file-upload"
            />
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📂</div>
            <div style={{ color: file ? "var(--text-primary)" : "var(--text-secondary)", fontSize: "0.9rem" }}>
              {file ? (
                  <span style={{ color: "var(--accent-blue)", fontWeight: 600 }}>{file.name}</span>
              ) : "Click to select PDF"}
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || !file}
              className="btn-primary"
              style={{ flex: 1 }}
            >
              {loading ? "Analyzing..." : "Upload & Analyze"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};