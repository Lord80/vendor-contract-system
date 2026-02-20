import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Logo } from '../components/common/logo';
import { motion } from 'framer-motion';

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
    } catch (err) { setError('Invalid credentials.'); } finally { setLoading(false); }
  };

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-void)", position: "relative", overflow: "hidden" }}>
      <div className="aurora-bg"></div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="holo-card" style={{ width: "420px", padding: "3rem 2.5rem", background: "rgba(0,0,0,0.6)" }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}><Logo /></div>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0 0 0.5rem 0", color: "white" }}>Welcome Back</h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.95rem" }}>Sign in to your enterprise workspace</p>
        </div>
        {error && <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", padding: "0.8rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.85rem", textAlign: "center" }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <div><label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>EMAIL ADDRESS</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: "0.9rem", background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "white", outline: "none" }} /></div>
          <div><label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>PASSWORD</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", padding: "0.9rem", background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "white", outline: "none" }} /></div>
          <button type="submit" disabled={loading} className="btn-primary-glow" style={{ marginTop: "1rem", width: "100%", height: "50px", fontSize: "1rem" }}>{loading ? "Authenticating..." : "Sign In"}</button>
          <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>No account? <button type="button" onClick={onSwitchToRegister} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontWeight: 600, padding: 0, marginLeft: "4px" }}>Create one</button></div>
        </form>
      </motion.div>
    </div>
  );
}