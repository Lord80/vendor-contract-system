import React from 'react';
import { RiskBadge } from '../dashboard/RiskBadge';
import type { Contract } from '../../types';

interface ContractTableProps {
  contracts: Contract[];
  onView: (id: number) => void;
}

export const ContractTable: React.FC<ContractTableProps> = ({ contracts, onView }) => {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border-subtle)" }}>
          <tr>
            <th style={{ padding: "1.2rem", color: "var(--text-secondary)", fontSize: "0.8rem" }}>CONTRACT NAME</th>
            <th style={{ padding: "1.2rem", color: "var(--text-secondary)", fontSize: "0.8rem" }}>VENDOR ID</th>
            <th style={{ padding: "1.2rem", color: "var(--text-secondary)", fontSize: "0.8rem" }}>STATUS</th>
            <th style={{ padding: "1.2rem", color: "var(--text-secondary)", fontSize: "0.8rem" }}>RISK</th>
            <th style={{ padding: "1.2rem", color: "var(--text-secondary)", fontSize: "0.8rem" }}>SCORE</th>
            <th style={{ padding: "1.2rem", color: "var(--text-secondary)", fontSize: "0.8rem" }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {contracts.length === 0 ? (
             <tr><td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>No contracts found.</td></tr>
          ) : (
             contracts.map((contract) => (
                <tr key={contract.id} style={{ borderBottom: "1px solid var(--border-subtle)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "1.2rem", fontWeight: 500 }}>{contract.contract_name}</td>
                  <td style={{ padding: "1.2rem", color: "var(--text-muted)" }}>#{contract.vendor_id}</td>
                  <td style={{ padding: "1.2rem" }}>
                    <span style={{ fontSize: "0.8rem", padding: "0.2rem 0.6rem", borderRadius: "4px", background: contract.status === 'ACTIVE' ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)", color: contract.status === 'ACTIVE' ? "var(--success)" : "var(--text-muted)" }}>
                        {contract.status || "ACTIVE"}
                    </span>
                  </td>
                  <td style={{ padding: "1.2rem" }}><RiskBadge level={contract.risk_level} /></td>
                  <td style={{ padding: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>{contract.risk_score}</td>
                  <td style={{ padding: "1.2rem" }}>
                    <button 
                      onClick={() => onView(contract.id)}
                      className="btn-ghost"
                      style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
                    >
                      View
                    </button>
                  </td>
                </tr>
             ))
          )}
        </tbody>
      </table>
    </div>
  );
};