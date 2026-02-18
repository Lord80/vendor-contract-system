import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Company } from '../types';

export default function Register({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'manager', // Default
    company_id: ''   
  });
  
  // ✅ FIX: Added state for Invite Code
  const [inviteCode, setInviteCode] = useState('');

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // We only need to fetch companies for Managers.
        // Vendors use an invite code, so no need to fetch a list.
        if (formData.role === 'manager') {
          const data = await api.getAllCompanies();
          setCompanies(data);
        }
      } catch (err) {
        console.error("Failed to load dropdown data.", err);
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
        // ✅ NEW VENDOR FLOW (Invite Code)
        await api.registerVendor({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          invite_code: inviteCode 
        });
      } else {
        // ✅ EXISTING MANAGER FLOW
        const payload = {
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          company_id: formData.company_id ? Number(formData.company_id) : null
        };
        await api.register(payload);
      }

      setSuccess(true);
      setTimeout(() => onSwitchToLogin(), 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-deep)", backgroundImage: "radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1), transparent 70%)" }}>
      <div className="card fade-in" style={{ width: "480px", padding: "2.5rem", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15, 23, 42, 0.6)" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>Create Account</h1>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>Join the AI Contract Manager</p>
        </div>

        {success ? (
          <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--success)", padding: "1rem", borderRadius: "8px", textAlign: "center", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            ✅ Account created! Redirecting...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {error && <div style={{ color: "var(--danger)", fontSize: "0.9rem", textAlign: "center", background: "rgba(239, 68, 68, 0.1)", padding: "0.5rem", borderRadius: "6px" }}>{error}</div>}

            <input 
                type="text" placeholder="Full Name" required 
                value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                style={{ background: "rgba(0,0,0,0.2)" }}
                className="input-field"
            />
            <input 
                type="email" placeholder="Email Address" required 
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                style={{ background: "rgba(0,0,0,0.2)" }}
                className="input-field"
            />
            <input 
                type="password" placeholder="Password" required 
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                style={{ background: "rgba(0,0,0,0.2)" }}
                className="input-field"
            />

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>I am a...</label>
              <select 
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value})}
                style={{ background: "rgba(0,0,0,0.2)" }}
                className="input-field"
              >
                <option value="manager">Company Manager (Employee)</option>
                <option value="vendor">External Vendor</option>
              </select>
            </div>

            {formData.role === 'manager' && (
              <div className="fade-in">
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Join Company</label>
                <select 
                  required
                  value={formData.company_id}
                  onChange={e => setFormData({...formData, company_id: e.target.value})}
                  style={{ background: "rgba(0,0,0,0.2)" }}
                  className="input-field"
                >
                  <option value="">-- Select Your Company --</option>
                  {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            {formData.role === "vendor" && (
              <div className="fade-in">
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                  Vendor Invite Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. X7B-9Q2"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  style={{ background: "rgba(0,0,0,0.2)" }}
                  className="input-field"
                  required
                />
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Enter the code provided by your hiring manager.
                </p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: "1rem", width: "100%" }}>
              {loading ? "Creating..." : "Create Account"}
            </button>

            <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
              Already have an account? <button type="button" onClick={onSwitchToLogin} style={{ background: "none", border: "none", color: "var(--accent-blue)", cursor: "pointer", fontWeight: 600, padding: 0 }}>Sign In</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}