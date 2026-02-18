import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
  defaultVendorId?: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({ onClose, onSuccess, defaultVendorId = "" }) => {
  const [file, setFile] = useState<File | null>(null);
  const [contractName, setContractName] = useState("");
  const [vendorId, setVendorId] = useState(defaultVendorId);
  const [dates, setDates] = useState({ start: new Date().toISOString().split('T')[0], end: "" });
  
  // AI Simulation States
  const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'PROCESSING' | 'ANALYZING' | 'SUCCESS'>('IDLE');
  const [progress, setProgress] = useState(0);

  // Auto-fill end date
  useEffect(() => {
    const d = new Date(dates.start);
    d.setFullYear(d.getFullYear() + 1);
    setDates(prev => ({ ...prev, end: d.toISOString().split('T')[0] }));
  }, [dates.start]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setContractName(e.target.files[0].name.replace(".pdf", ""));
    }
  };

  const simulateProgress = () => {
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      // Simulation logic: Fast at first, slows down for "AI analysis"
      if (step <= 30) {
        setStatus('UPLOADING');
        setProgress(step);
      } else if (step <= 70) {
        setStatus('PROCESSING');
        setProgress(step);
      } else if (step <= 95) {
        setStatus('ANALYZING');
        setProgress(step);
      } else {
        clearInterval(interval);
      }
    }, 50); // Adjust speed
    return interval;
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const timer = simulateProgress();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("contract_name", contractName);
    formData.append("vendor_id", vendorId || "1"); // Default fallback
    formData.append("start_date", dates.start);
    formData.append("end_date", dates.end);

    try {
      await api.uploadContract(formData);
      clearInterval(timer);
      setProgress(100);
      setStatus('SUCCESS');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      clearInterval(timer);
      setStatus('IDLE');
      alert("Upload failed. Please try again.");
    }
  };

  // Render the AI Processing View
  if (status !== 'IDLE') {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(2, 6, 23, 0.9)", backdropFilter: "blur(12px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 200 }}>
        <div className="card" style={{ width: "400px", textAlign: "center", padding: "3rem 2rem" }}>
          
          <div style={{ marginBottom: "2rem", position: "relative", height: "80px", width: "80px", margin: "0 auto 2rem" }}>
             {/* Pulse Animation */}
             <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid var(--accent-blue)", opacity: 0.5, animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" }}></div>
             <div style={{ position: "absolute", inset: "10px", borderRadius: "50%", background: "var(--accent-blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>
               {status === 'SUCCESS' ? '✅' : '🤖'}
             </div>
          </div>

          <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            {status === 'UPLOADING' && "Uploading Document..."}
            {status === 'PROCESSING' && "Extracting Clauses..."}
            {status === 'ANALYZING' && "Running Risk Models..."}
            {status === 'SUCCESS' && "Analysis Complete!"}
          </h3>
          
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
            {status === 'PROCESSING' && "LegalBERT is identifying key entities."}
            {status === 'ANALYZING' && "XGBoost is calculating risk scores."}
          </p>

          {/* Progress Bar */}
          <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden", marginBottom: "1rem" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "var(--accent-blue)", transition: "width 0.2s ease" }}></div>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{progress}% Processed</div>
        </div>
      </div>
    );
  }

  // Render the Form View
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(5px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
      <div className="card fade-in" style={{ width: "500px", padding: "2rem", border: "1px solid var(--border-highlight)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ margin: 0 }}>📄 Upload Contract</h2>
            <button onClick={onClose} className="btn-ghost" style={{ padding: "0.4rem", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        
        <form onSubmit={handleUpload} style={{ display: "grid", gap: "1.2rem" }}>
          
          {/* Drag & Drop Visual */}
          <div 
            style={{ border: "2px dashed var(--border-highlight)", padding: "2rem", textAlign: "center", borderRadius: "12px", cursor: "pointer", background: "rgba(0,0,0,0.2)", transition: "all 0.2s" }} 
            onClick={() => document.getElementById('modal-file')?.click()}
            onMouseOver={e => e.currentTarget.style.borderColor = "var(--accent-blue)"}
            onMouseOut={e => e.currentTarget.style.borderColor = "var(--border-highlight)"}
          >
            <input id="modal-file" type="file" accept=".pdf" style={{ display: "none" }} onChange={handleFileSelect} />
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📂</div>
            <div style={{ color: file ? "var(--accent-blue)" : "var(--text-secondary)", fontWeight: file ? 600 : 400 }}>
              {file ? file.name : "Click to select PDF"}
            </div>
          </div>

          <input className="input-field" placeholder="Contract Name" required value={contractName} onChange={e => setContractName(e.target.value)} />
          
          {!defaultVendorId && (
             <input className="input-field" type="number" placeholder="Vendor ID" required value={vendorId} onChange={e => setVendorId(e.target.value)} />
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "4px", display: "block" }}>Effective Date</label>
              <input className="input-field" type="date" required value={dates.start} onChange={e => setDates({ ...dates, start: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "4px", display: "block" }}>Expiration Date</label>
              <input className="input-field" type="date" required value={dates.end} onChange={e => setDates({ ...dates, end: e.target.value })} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={!file} className="btn-primary" style={{ flex: 1 }}>Start Analysis</button>
          </div>
        </form>
      </div>
    </div>
  );
};