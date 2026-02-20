import React from 'react';
import { RiskBadge } from '../dashboard/RiskBadge';
import type { Contract } from '../../types';

interface ContractTableProps {
  contracts: Contract[];
  onView: (id: number) => void;
}

export const ContractTable: React.FC<ContractTableProps> = ({ contracts, onView }) => {
  return (
    <div className="holo-card" style={{ padding: 0, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--glass-border)" }}>
          <tr>
            <th style={{ padding: "1rem 1.5rem", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px" }}>CONTRACT NAME</th>
            <th style={{ padding: "1rem 1.5rem", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px" }}>VENDOR ID</th>
            <th style={{ padding: "1rem 1.5rem", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px" }}>STATUS</th>
            <th style={{ padding: "1rem 1.5rem", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", textAlign: "center" }}>RISK</th>
            <th style={{ padding: "1rem 1.5rem", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px" }}>SCORE</th>
            <th style={{ padding: "1rem 1.5rem", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", textAlign: "right" }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {contracts.length === 0 ? (
             <tr><td colSpan={6} style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>No contracts found.</td></tr>
          ) : (
             contracts.map((contract) => (
               <tr key={contract.id} style={{ borderBottom: "1px solid var(--glass-border)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                 <td style={{ padding: "1rem 1.5rem", fontWeight: 500, color: "var(--text-main)" }}>{contract.contract_name}</td>
                 <td style={{ padding: "1rem 1.5rem", color: "var(--text-muted)", fontFamily: "monospace" }}>#{contract.vendor_id}</td>
                 <td style={{ padding: "1rem 1.5rem" }}>
                   <span style={{ fontSize: "0.7rem", padding: "4px 10px", borderRadius: "4px", background: contract.status === 'ACTIVE' ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)", color: contract.status === 'ACTIVE' ? "#10b981" : "var(--text-muted)", border: "1px solid currentColor" }}>
                       {contract.status || "ACTIVE"}
                   </span>
                 </td>
                 <td style={{ padding: "1rem 1.5rem", textAlign: "center" }}><RiskBadge level={contract.risk_level} /></td>
                 <td style={{ padding: "1rem 1.5rem", fontWeight: 700, color: "var(--text-main)", fontFamily: "monospace" }}>{contract.risk_score}</td>
                 <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                   <button 
                     onClick={() => onView(contract.id)}
                     className="btn-neon"
                     style={{ fontSize: "0.75rem", padding: "6px 14px" }}
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