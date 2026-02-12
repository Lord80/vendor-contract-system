import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface UserData {
  id: number;
  full_name: string;
  email: string;
  role: string;
  vendor_id?: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getAllUsers();
      setUsers(data);
    } catch (err) {
      alert("Failed to load users. Are you an Admin?");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    try {
      await api.deleteUser(id);
      setUsers(users.filter(u => u.id !== id)); // Remove from UI
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h1>👮‍♂️ User Management</h1>
      <div className="card">
        {loading ? <p>Loading...</p> : (
          <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #444", color: "#888" }}>
                <th style={{ padding: "1rem" }}>ID</th>
                <th style={{ padding: "1rem" }}>Name</th>
                <th style={{ padding: "1rem" }}>Email</th>
                <th style={{ padding: "1rem" }}>Role</th>
                <th style={{ padding: "1rem" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid #333" }}>
                  <td style={{ padding: "1rem" }}>{u.id}</td>
                  <td style={{ padding: "1rem", fontWeight: "bold" }}>{u.full_name}</td>
                  <td style={{ padding: "1rem" }}>{u.email}</td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{ 
                        padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem",
                        background: u.role === 'admin' ? '#7c3aed' : u.role === 'vendor' ? '#2563eb' : '#059669'
                    }}>
                        {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <button 
                        onClick={() => handleDelete(u.id)}
                        style={{ background: "#ef4444", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}
                    >
                        Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}