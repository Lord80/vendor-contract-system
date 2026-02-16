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
      background: "var(--bg-deep)",
      backgroundImage: "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1), transparent 70%)"
    }}>
      <div className="card fade-in" style={{ width: "420px", padding: "2.5rem", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15, 23, 42, 0.6)" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ 
            width: "56px", height: "56px", 
            background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))", 
            borderRadius: "14px", 
            margin: "0 auto 1.5rem",
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)"
          }}></div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>Welcome Back</h1>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>Sign in to ContractAI</p>
        </div>

        {error && (
          <div style={{ 
            background: "rgba(239, 68, 68, 0.1)", 
            color: "#fca5a5", 
            padding: "0.8rem", 
            borderRadius: "8px", 
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
            textAlign: "center",
            border: "1px solid rgba(239, 68, 68, 0.2)"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@company.com"
              style={{ background: "rgba(0, 0, 0, 0.2)" }}
            />
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ background: "rgba(0, 0, 0, 0.2)" }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary"
            style={{ marginTop: "1rem", width: "100%", justifyContent: "center" }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Don't have an account?{" "}
            <button 
              type="button" 
              onClick={onSwitchToRegister}
              style={{ background: "none", border: "none", color: "var(--accent-blue)", cursor: "pointer", fontWeight: 600, padding: 0 }}
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}