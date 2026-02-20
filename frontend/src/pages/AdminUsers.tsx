import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Trash2, Shield, User } from 'lucide-react';

interface UserData {
  id: number;
  full_name: string;
  email: string;
  role: string;
  vendor_id?: number;
  company_id?: number;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getAllUsers();
      setUsers(data);
    } catch { alert("Failed to load users."); } finally { setLoading(false); }
  };

  const handleDelete = async (targetId: number, targetRole: string) => {
    if (user?.role === 'company_admin' && targetRole === 'super_admin') return alert("Cannot delete Super Admin.");
    if (user?.id === targetId) return alert("Cannot delete yourself.");
    if (!confirm("Permanently delete user?")) return;
    try {
      await api.deleteUser(targetId);
      setUsers(users.filter(u => u.id !== targetId));
    } catch (err: any) { alert("Failed to delete."); }
  };

  // Helper for Badge Colors
  const getRoleStyle = (role: string) => {
      switch(role) {
          case 'super_admin': return { bg: "rgba(236, 72, 153, 0.15)", color: "#f472b6", border: "rgba(236, 72, 153, 0.3)" };
          case 'company_admin': return { bg: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", border: "rgba(59, 130, 246, 0.3)" };
          case 'vendor': return { bg: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "rgba(16, 185, 129, 0.3)" };
          default: return { bg: "rgba(148, 163, 184, 0.15)", color: "#94a3b8", border: "rgba(148, 163, 184, 0.3)" };
      }
  }

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ marginBottom: "2.5rem" }}>
        <h1 className="glow-text" style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 0.5rem 0", letterSpacing: "-0.5px" }}>
            {user?.role === 'super_admin' ? 'Global Access' : 'Team Management'}
        </h1>
        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "1.1rem" }}>
            {user?.role === 'super_admin' ? "Platform-wide user directory." : "Manage internal team and external vendors."}
        </p>
      </header>

      <div className="holo-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div style={{ padding: "2rem", color: "var(--text-muted)" }}>Loading directory...</div> : (
          <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--glass-border)" }}>
              <tr>
                <th style={{ padding: "1.2rem 1.5rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 800, letterSpacing: "0.05em" }}>USER IDENTITY</th>
                <th style={{ padding: "1.2rem 1.5rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 800, letterSpacing: "0.05em" }}>EMAIL ADDRESS</th>
                <th style={{ padding: "1.2rem 1.5rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 800, letterSpacing: "0.05em" }}>ROLE / PERMISSIONS</th>
                <th style={{ padding: "1.2rem 1.5rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 800, textAlign: "right", letterSpacing: "0.05em" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>No users found.</td></tr>
              ) : (
                  users.map(u => {
                    const roleStyle = getRoleStyle(u.role);
                    return (
                    <tr key={u.id} style={{ borderBottom: "1px solid var(--glass-border)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 700, border: "1px solid var(--glass-border)", color: "var(--text-main)" }}>
                                {u.full_name[0]}
                            </div>
                            <div>
                                <div style={{ color: "var(--text-main)", fontWeight: 600 }}>{u.full_name} {u.id === user?.id && <span style={{ fontSize: "0.65rem", color: "var(--aurora-3)", marginLeft: "6px" }}>(YOU)</span>}</div>
                            </div>
                        </div>
                      </td>
                      <td style={{ padding: "1rem 1.5rem", color: "var(--text-dim)", fontFamily: "monospace", fontSize: "0.9rem" }}>{u.email}</td>
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <span style={{ 
                            display: "inline-flex", alignItems: "center", gap: "6px", 
                            padding: "4px 10px", borderRadius: "20px", 
                            background: roleStyle.bg, color: roleStyle.color, 
                            fontSize: "0.7rem", fontWeight: 700, border: `1px solid ${roleStyle.border}`, textTransform: "uppercase" 
                        }}>
                            <Shield size={10} /> {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                        {u.id !== user?.id && (
                            (user?.role === 'super_admin') || 
                            (user?.role === 'company_admin' && u.role !== 'company_admin' && u.role !== 'super_admin')
                        ) && (
                            <button onClick={() => handleDelete(u.id, u.role)} className="btn-neon" style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.3)" }}>
                                <Trash2 size={14} style={{ marginRight: "4px" }} /> Revoke
                            </button>
                        )}
                      </td>
                    </tr>
                  )})
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}