import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { X, UploadCloud, Cpu, CheckCircle } from 'lucide-react';

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
  const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'PROCESSING' | 'ANALYZING' | 'SUCCESS'>('IDLE');
  const [progress, setProgress] = useState(0);

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
      if (step <= 30) { setStatus('UPLOADING'); setProgress(step); }
      else if (step <= 70) { setStatus('PROCESSING'); setProgress(step); }
      else if (step <= 95) { setStatus('ANALYZING'); setProgress(step); }
      else { clearInterval(interval); }
    }, 50); 
    return interval;
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const timer = simulateProgress();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("contract_name", contractName);
    formData.append("vendor_id", vendorId || "1"); 
    formData.append("start_date", dates.start);
    formData.append("end_date", dates.end);

    try {
      await api.uploadContract(formData);
      clearInterval(timer);
      setProgress(100);
      setStatus('SUCCESS');
      setTimeout(() => { onSuccess(); onClose(); }, 1200);
    } catch (err) {
      clearInterval(timer);
      setStatus('IDLE');
      alert("Upload failed.");
    }
  };

  const dateInputStyle = {
    width: "100%", padding: "0.9rem", 
    background: "rgba(0,0,0,0.3)", 
    border: "1px solid var(--glass-border)", 
    color: "white", borderRadius: "8px", outline: "none",
    colorScheme: "dark" // Forces dark mode date picker
  };

  if (status !== 'IDLE') {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(2, 6, 23, 0.9)", backdropFilter: "blur(12px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 200 }}>
        <div className="holo-card" style={{ width: "400px", textAlign: "center", padding: "3rem 2rem", border: "1px solid var(--glass-highlight)" }}>
          <div style={{ marginBottom: "2rem", position: "relative", height: "80px", width: "80px", margin: "0 auto 2rem" }}>
             <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid var(--aurora-3)", opacity: 0.5, animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" }}></div>
             <div style={{ position: "absolute", inset: "10px", borderRadius: "50%", background: "rgba(6, 182, 212, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", color: "var(--aurora-3)" }}>
               {status === 'SUCCESS' ? <CheckCircle size={32} /> : <Cpu size={32} className="animate-pulse" />}
             </div>
          </div>
          <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", fontWeight: 700 }}>{status}</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem", fontSize: "0.9rem", fontFamily: "monospace" }}>Processing...</p>
          <div style={{ height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, var(--aurora-1), var(--aurora-3))", transition: "width 0.2s ease" }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
      <div className="holo-card fade-in" style={{ width: "550px", padding: "2.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>Upload Contract</h2>
            <button onClick={onClose} className="btn-ghost" style={{ padding: "0.4rem", borderRadius: "50%" }}><X size={20} /></button>
        </div>
        <form onSubmit={handleUpload} style={{ display: "grid", gap: "1.5rem" }}>
          <div style={{ border: "2px dashed var(--glass-border)", padding: "2rem", textAlign: "center", borderRadius: "16px", cursor: "pointer", background: "rgba(255,255,255,0.02)", transition: "all 0.2s" }} onClick={() => document.getElementById('modal-file')?.click()}>
            <input id="modal-file" type="file" accept=".pdf" style={{ display: "none" }} onChange={handleFileSelect} />
            <div style={{ marginBottom: "1rem", color: "var(--text-muted)", display: "flex", justifyContent: "center" }}><UploadCloud size={48} strokeWidth={1} /></div>
            <div style={{ color: file ? "var(--aurora-3)" : "var(--text-main)", fontWeight: file ? 600 : 500, fontSize: "0.95rem" }}>{file ? file.name : "Click to select PDF document"}</div>
          </div>
          <div style={{ display: "grid", gap: "1rem" }}>
                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.5px" }}>CONTRACT NAME</label>
                <input className="input-field" placeholder="e.g. Service Agreement 2024" required value={contractName} onChange={e => setContractName(e.target.value)} style={{ padding: "0.9rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--glass-border)", color: "white", borderRadius: "8px", outline: "none", fontSize: "0.9rem" }} />
                {!defaultVendorId && (
                   <>
                   <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.5px" }}>VENDOR ID</label>
                   <input className="input-field" type="number" placeholder="Vendor ID" required value={vendorId} onChange={e => setVendorId(e.target.value)} style={{ padding: "0.9rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--glass-border)", color: "white", borderRadius: "8px", outline: "none", fontSize: "0.9rem" }} />
                   </>
                )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.5px" }}>EFFECTIVE DATE</label>
              <input type="date" required value={dates.start} onChange={e => setDates({ ...dates, start: e.target.value })} style={dateInputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.5px" }}>EXPIRATION DATE</label>
              <input type="date" required value={dates.end} onChange={e => setDates({ ...dates, end: e.target.value })} style={dateInputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button type="button" onClick={onClose} className="btn-neon" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
            <button type="submit" disabled={!file} className="btn-primary-glow" style={{ flex: 1, justifyContent: "center" }}>Start Analysis</button>
          </div>
        </form>
      </div>
    </div>
  );
};