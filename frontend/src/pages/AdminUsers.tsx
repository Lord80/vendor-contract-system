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

  return (
    <div className="fade-in" style={{ maxWidth: 1000, margin: "0 auto" }}>
      <header style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>
            {user?.role === 'super_admin' ? 'Global User Management' : 'Organization Users'}
        </h1>
        <p style={{ color: "var(--text-secondary)", margin: 0 }}>
            {user?.role === 'super_admin' ? "Manage platform-wide access." : "Manage your team and vendors."}
        </p>
      </header>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div className="skeleton" style={{ height: "300px", margin: "1rem" }}></div> : (
          <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border-subtle)" }}>
              <tr>
                <th style={{ padding: "1.2rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>USER</th>
                <th style={{ padding: "1.2rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>EMAIL</th>
                <th style={{ padding: "1.2rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>ROLE</th>
                <th style={{ padding: "1.2rem", fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "right" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>No users found.</td></tr>
              ) : (
                  users.map(u => (
                    <tr key={u.id} style={{ borderBottom: "1px solid var(--border-subtle)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "1.2rem", fontWeight: 500 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", border: "1px solid var(--border-subtle)" }}>{u.full_name[0]}</div>
                            {u.full_name}
                            {u.id === user?.id && <span style={{ fontSize: "0.7rem", color: "var(--accent-blue)", background: "rgba(59,130,246,0.1)", padding: "2px 6px", borderRadius: "4px" }}>YOU</span>}
                        </div>
                      </td>
                      <td style={{ padding: "1.2rem", color: "var(--text-secondary)" }}>{u.email}</td>
                      <td style={{ padding: "1.2rem" }}>
                        <span className={`badge ${u.role === 'super_admin' ? 'HIGH' : u.role === 'company_admin' ? 'MEDIUM' : 'LOW'}`}>
                            {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: "1.2rem", textAlign: "right" }}>
                        {u.id !== user?.id && (
                            (user?.role === 'super_admin') || 
                            (user?.role === 'company_admin' && u.role !== 'company_admin' && u.role !== 'super_admin')
                        ) && (
                            <button onClick={() => handleDelete(u.id, u.role)} className="btn-danger" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                                Delete
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