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
      setError('Invalid credentials. Please try again.');
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
      backgroundImage: "radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.2), transparent 50%)"
    }}>
      <div className="card fade-in" style={{ width: "400px", padding: "3rem 2.5rem" }}>
        
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ 
            width: "64px", height: "64px", 
            background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))", 
            borderRadius: "16px", 
            margin: "0 auto 1.5rem",
            boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem"
          }}>⚡</div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>Welcome Back</h1>
          <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.95rem" }}>Sign in to your enterprise workspace</p>
        </div>

        {error && (
          <div className="fade-in" style={{ 
            background: "rgba(239, 68, 68, 0.1)", 
            color: "#fca5a5", 
            padding: "0.75rem", 
            borderRadius: "8px", 
            marginBottom: "1.5rem",
            fontSize: "0.85rem",
            textAlign: "center",
            border: "1px solid rgba(239, 68, 68, 0.2)"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@company.com"
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
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary"
            style={{ marginTop: "0.5rem", width: "100%", height: "48px" }}
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>

          <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
            No account?{" "}
            <button 
              type="button" 
              onClick={onSwitchToRegister}
              style={{ background: "none", border: "none", color: "var(--accent-blue)", cursor: "pointer", fontWeight: 600, padding: 0 }}
            >
              Get Started
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}