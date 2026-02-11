import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Contract } from '../types';

export default function VendorDashboard() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // The backend now automatically filters this list!
        const data = await api.getAllContracts();
        setContracts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Vendor Portal
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Welcome, {user?.full_name}. Here are your active agreements.
        </p>
      </header>

      {/* Stats Card */}
      <div className="card" style={{ marginBottom: "2rem", display: "inline-block", paddingRight: "4rem" }}>
        <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
          ACTIVE CONTRACTS
        </div>
        <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--accent-primary)" }}>
          {contracts.length}
        </div>
      </div>

      {/* Simple Contract List */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>My Contracts</h3>
        {loading ? <p>Loading...</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <th style={{ padding: "1rem" }}>Name</th>
                <th style={{ padding: "1rem" }}>Status</th>
                <th style={{ padding: "1rem" }}>Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map(c => (
                <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "1rem" }}>{c.contract_name}</td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{ padding: "4px 8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", fontSize: "0.8rem" }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>{c.risk_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}