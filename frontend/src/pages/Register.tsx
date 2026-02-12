import { useState, useEffect } from 'react';
import { api } from '../services/api'; // We'll simulate navigation since we aren't using Router yet
import type { Vendor } from '../types';

export default function Register({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'manager', // Default role
    vendor_id: ''
  });
  
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load vendors if the user selects "vendor" role
  useEffect(() => {
    if (formData.role === 'vendor') {
      api.getAllVendors().then(setVendors).catch(console.error);
    }
  }, [formData.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Debugging: Check what ID is currently selected
    console.log("Selected Vendor ID:", formData.vendor_id); 

    try {
      const payload = {
        ...formData,
        // Ensure we convert string "1" to number 1, but keep null if empty
        vendor_id: (formData.role === 'vendor' && formData.vendor_id) 
          ? Number(formData.vendor_id) 
          : null
      };

      console.log("Sending Payload:", payload); // <--- Check your browser console for this!

      await api.register(payload);
      setSuccess(true);
      setTimeout(() => {
        onSwitchToLogin(); 
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
      background: "var(--bg-dark)" 
    }}>
      <div className="card" style={{ width: "450px", padding: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Create Account</h1>
          <p style={{ color: "var(--text-secondary)" }}>Join the AI Contract Manager</p>
        </div>

        {success ? (
          <div style={{ 
            background: "rgba(16, 185, 129, 0.1)", 
            color: "#10b981", 
            padding: "1rem", 
            borderRadius: "6px", 
            textAlign: "center" 
          }}>
            ✅ Account created! Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            
            {error && <div style={{ color: "#ef4444", fontSize: "0.9rem", textAlign: "center" }}>{error}</div>}

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Full Name</label>
              <input 
                type="text" 
                required
                value={formData.full_name}
                onChange={e => setFormData({...formData, full_name: e.target.value})}
                style={{ width: "100%", padding: "0.75rem", background: "var(--bg-dark)", border: "1px solid #333", color: "white", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Email</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                style={{ width: "100%", padding: "0.75rem", background: "var(--bg-dark)", border: "1px solid #333", color: "white", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Password</label>
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                style={{ width: "100%", padding: "0.75rem", background: "var(--bg-dark)", border: "1px solid #333", color: "white", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Role</label>
              <select 
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                style={{ width: "100%", padding: "0.75rem", background: "var(--bg-dark)", border: "1px solid #333", color: "white", borderRadius: "6px" }}
              >
                <option value="manager">Manager (Standard)</option>
                <option value="admin">Admin (Full Access)</option>
                <option value="vendor">Vendor (Restricted)</option>
              </select>
            </div>

            {/* Show Vendor Dropdown ONLY if "Vendor" role is selected */}
            {formData.role === 'vendor' && (
              <div className="fade-in">
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Select Company</label>
                <select 
                  required
                  value={formData.vendor_id}
                  onChange={e => setFormData({...formData, vendor_id: e.target.value})}
                  style={{ width: "100%", padding: "0.75rem", background: "var(--bg-dark)", border: "1px solid #333", color: "white", borderRadius: "6px" }}
                >
                  <option value="">-- Choose Company --</option>
                  {vendors.map((v: any) => (
                    <option key={v.id} value={v.id}>
                        {v.name}
                    </option>
                ))}
                </select>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                marginTop: "1rem",
                padding: "0.75rem", 
                background: "var(--accent-primary)", 
                color: "white", 
                border: "none", 
                borderRadius: "6px", 
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "Creating Account..." : "Register"}
            </button>

            <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.9rem" }}>
              Already have an account?{" "}
              <button 
                type="button" 
                onClick={onSwitchToLogin}
                style={{ background: "none", border: "none", color: "var(--accent-primary)", cursor: "pointer", textDecoration: "underline" }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}