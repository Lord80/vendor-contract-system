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
        <thead style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <tr>
            <th style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.75rem" }}>CONTRACT NAME</th>
            <th style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.75rem" }}>VENDOR ID</th>
            <th style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.75rem" }}>STATUS</th>
            <th style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.75rem" }}>RISK</th>
            <th style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.75rem" }}>SCORE</th>
            <th style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.75rem" }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => (
            <tr key={contract.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <td style={{ padding: "1rem", fontWeight: 500 }}>{contract.contract_name}</td>
              <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>#{contract.vendor_id}</td>
              <td style={{ padding: "1rem" }}>
                <span style={{ 
                  padding: "0.25rem 0.5rem", 
                  borderRadius: "4px", 
                  background: "rgba(255,255,255,0.1)", 
                  fontSize: "0.75rem" 
                }}>
                  {contract.status}
                </span>
              </td>
              <td style={{ padding: "1rem" }}>
                <RiskBadge level={contract.risk_level} />
              </td>
              <td style={{ padding: "1rem", fontWeight: 700 }}>{contract.risk_score}</td>
              <td style={{ padding: "1rem" }}>
                <button 
                  onClick={() => onView(contract.id)}
                  style={{ 
                    background: "none", 
                    border: "1px solid var(--accent-primary)", 
                    color: "var(--accent-primary)", 
                    borderRadius: "4px",
                    padding: "0.25rem 0.75rem",
                    cursor: "pointer"
                  }}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};