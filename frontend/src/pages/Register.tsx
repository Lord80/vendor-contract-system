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
  
  const [inviteCode, setInviteCode] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
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
        await api.registerVendor({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          invite_code: inviteCode 
        });
      } else {
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
    <div style={{ 
      height: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      background: "var(--bg-deep)",
      backgroundImage: "radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1), transparent 60%)"
    }}>
      <div className="card fade-in" style={{ width: "480px", padding: "2.5rem 3rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>Create Account</h1>
          <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.95rem" }}>Join the AI Contract Manager</p>
        </div>

        {success ? (
          <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--success)", padding: "1.5rem", borderRadius: "12px", textAlign: "center", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</div>
            <div style={{ fontWeight: 600 }}>Account created!</div>
            <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>Redirecting you to login...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {error && (
              <div style={{ color: "#fca5a5", fontSize: "0.9rem", textAlign: "center", background: "rgba(239, 68, 68, 0.1)", padding: "0.8rem", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                {error}
              </div>
            )}

            <div style={{ display: "grid", gap: "1.2rem" }}>
                <input 
                    type="text" placeholder="Full Name" required 
                    value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                />
                <input 
                    type="email" placeholder="Email Address" required 
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                />
                <input 
                    type="password" placeholder="Password" required 
                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                />
            </div>

            <div style={{ padding: "1.5rem", background: "rgba(0,0,0,0.2)", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
              <label style={{ display: "block", marginBottom: "0.8rem", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>I am registering as a...</label>
              <select 
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value})}
                style={{ marginBottom: "1rem" }}
              >
                <option value="manager">Company Manager</option>
                <option value="vendor">External Vendor</option>
              </select>

              {formData.role === 'manager' && (
                <div className="fade-in">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Select Your Organization</label>
                  <select 
                    required
                    value={formData.company_id}
                    onChange={e => setFormData({...formData, company_id: e.target.value})}
                  >
                    <option value="">-- Choose Company --</option>
                    {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {formData.role === "vendor" && (
                <div className="fade-in">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Invite Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. X7B-9Q2"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    required
                    style={{ letterSpacing: "1px", fontFamily: "monospace", textTransform: "uppercase" }}
                  />
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px", fontStyle: "italic" }}>
                    * Provided by the hiring company manager.
                  </p>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: "0.5rem", height: "48px" }}>
              {loading ? "Creating Account..." : "Create Account"}
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