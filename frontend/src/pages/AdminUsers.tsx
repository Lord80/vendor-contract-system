import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

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

  const getRoleBadgeColor = (role: string) => {
      switch(role) {
          case 'super_admin': return 'HIGH';
          case 'company_admin': return 'MEDIUM';
          case 'vendor': return 'UNKNOWN';
          default: return 'LOW';
      }
  }

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 0.5rem 0", letterSpacing: "-0.5px" }}>
            {user?.role === 'super_admin' ? 'Global Access Control' : 'Team Management'}
        </h1>
        <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "1.1rem" }}>
            {user?.role === 'super_admin' ? "Manage all platform users across tenants." : "Manage your employees and external vendors."}
        </p>
      </header>

      <div className="card" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--border-highlight)" }}>
        {loading ? <div className="skeleton" style={{ height: "300px", margin: "1rem" }}></div> : (
          <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--border-subtle)" }}>
              <tr>
                <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700 }}>USER IDENTITY</th>
                <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700 }}>EMAIL ADDRESS</th>
                <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700 }}>ROLE / PERMISSIONS</th>
                <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700, textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>No users found.</td></tr>
              ) : (
                  users.map(u => (
                    <tr key={u.id} style={{ borderBottom: "1px solid var(--border-subtle)", transition: "background 0.2s" }} className="hover:bg-white/5">
                      <td style={{ padding: "1rem 1.5rem", fontWeight: 500 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 700, border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                                {u.full_name[0]}
                            </div>
                            <div>
                                <div style={{ color: "var(--text-primary)" }}>{u.full_name}</div>
                                {u.id === user?.id && <span style={{ fontSize: "0.65rem", color: "var(--accent-blue)", fontWeight: 700 }}>CURRENT USER</span>}
                            </div>
                        </div>
                      </td>
                      <td style={{ padding: "1rem 1.5rem", color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>{u.email}</td>
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <span className={`badge ${getRoleBadgeColor(u.role)}`}>
                            {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                        {u.id !== user?.id && (
                            (user?.role === 'super_admin') || 
                            (user?.role === 'company_admin' && u.role !== 'company_admin' && u.role !== 'super_admin')
                        ) && (
                            <button onClick={() => handleDelete(u.id, u.role)} className="btn-danger" style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }}>
                                Revoke Access
                            </button>
                        )}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}