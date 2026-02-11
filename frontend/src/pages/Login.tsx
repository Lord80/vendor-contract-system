import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Login({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // We need to add this login method to api.ts next!
      const data = await api.login(email, password);
      login(data.access_token, data.user);
    } catch (err) {
      setError('Invalid email or password');
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
      <div className="card" style={{ width: "400px", padding: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: "48px", height: "48px", background: "var(--accent-primary)", borderRadius: "8px", margin: "0 auto 1rem" }}></div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Welcome Back</h1>
          <p style={{ color: "var(--text-secondary)" }}>Sign in to AI Contract Manager</p>
        </div>

        {error && (
          <div style={{ 
            background: "rgba(239, 68, 68, 0.1)", 
            color: "#ef4444", 
            padding: "0.75rem", 
            borderRadius: "6px", 
            marginBottom: "1rem",
            fontSize: "0.9rem",
            textAlign: "center"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "0.75rem", background: "var(--bg-dark)", border: "1px solid #333", color: "white", borderRadius: "6px" }}
            />
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "0.75rem", background: "var(--bg-dark)", border: "1px solid #333", color: "white", borderRadius: "6px" }}
            />
          </div>

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
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.9rem" }}>
          Don't have an account?{" "}
          <button 
            type="button" 
            onClick={onSwitchToRegister}
            style={{ background: "none", border: "none", color: "var(--accent-primary)", cursor: "pointer", textDecoration: "underline" }}
          >
            Sign Up
          </button>
       </div>
        </form>
      </div>
    </div>
  );
}