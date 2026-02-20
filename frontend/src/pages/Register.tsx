import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Logo } from '../components/common/logo'; // Ensure Logo exists
import type { Company } from '../types';
import { motion } from 'framer-motion';

export default function Register({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', role: 'manager', company_id: '' });
  const [inviteCode, setInviteCode] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (formData.role === 'manager') {
        try {
            const data = await api.getAllCompanies();
            setCompanies(data);
        } catch(e) { console.error("Failed to load companies", e); }
      }
    }
    fetchData();
  }, [formData.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (formData.role === 'vendor') {
        await api.registerVendor({ ...formData, invite_code: inviteCode });
      } else {
        await api.register({ ...formData, company_id: formData.company_id ? Number(formData.company_id) : null });
      }
      setSuccess(true);
      setTimeout(() => onSwitchToLogin(), 2000);
    } catch (err: any) { setError(err.message || 'Registration failed.'); } finally { setLoading(false); }
  };

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: "var(--bg-void)" }}>
      <div className="aurora-bg"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="holo-card" 
        style={{ width: "480px", padding: "3rem", background: "rgba(0,0,0,0.6)" }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}><Logo /></div>
        
        {success ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
            <h2 style={{ fontSize: "1.2rem", color: "white" }}>Account Created</h2>
            <p style={{ color: "var(--text-muted)" }}>Redirecting to secure login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem 0", color: "white" }}>Create Account</h1>
            </div>

            {error && <div style={{ color: "#fca5a5", fontSize: "0.85rem", textAlign: "center", background: "rgba(239, 68, 68, 0.15)", padding: "0.5rem", borderRadius: "6px" }}>{error}</div>}
            
            <div style={{ display: "grid", gap: "1rem" }}>
                <input type="text" placeholder="Full Name" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "white", outline: "none" }} />
                <input type="email" placeholder="Email Address" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "white", outline: "none" }} />
                <input type="password" placeholder="Password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "white", outline: "none" }} />
            </div>

            <div style={{ padding: "1.2rem", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid var(--glass-border)" }}>
              <label style={{ display: "block", marginBottom: "0.8rem", fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>ACCOUNT TYPE</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={{ width: "100%", padding: "0.8rem", background: "rgba(0,0,0,0.5)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "white", outline: "none", marginBottom: "1rem" }}>
                <option value="manager">Internal Manager</option>
                <option value="vendor">External Vendor</option>
              </select>

              {formData.role === 'manager' && (
                  <select required value={formData.company_id} onChange={e => setFormData({...formData, company_id: e.target.value})} style={{ width: "100%", padding: "0.8rem", background: "rgba(0,0,0,0.5)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "white", outline: "none" }}>
                    <option value="">Select Organization...</option>
                    {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
              )}

              {formData.role === "vendor" && (
                  <input type="text" placeholder="ENTER INVITE CODE" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required style={{ width: "100%", padding: "0.8rem", background: "rgba(0,0,0,0.5)", border: "1px solid var(--aurora-1)", borderRadius: "8px", color: "white", outline: "none", letterSpacing: "2px", textAlign: "center", fontFamily: "monospace" }} />
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary-glow" style={{ marginTop: "0.5rem", width: "100%" }}>{loading ? "Processing..." : "Create Account"}</button>
            <button type="button" onClick={onSwitchToLogin} className="btn-neon" style={{width: "100%"}}>Back to Login</button>
          </form>
        )}
      </motion.div>
    </div>
  );
}