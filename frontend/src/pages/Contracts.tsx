import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ContractTable } from '../components/contracts/ContractTable';
import ContractDetails from '../pages/ContractDetails'; 
import { UploadModal } from '../components/contracts/UploadModal';
import type { Contract } from '../types';

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const data = await api.getAllContracts();
      setContracts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  // If a contract is selected, show ContractDetails instead of the table
  if (selectedContractId) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* ✅ FIXED COMPONENT NAME: Using ContractDetails */}
        <ContractDetails
          contractId={selectedContractId} 
          onBack={() => setSelectedContractId(null)} 
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Contract Management
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            View, search, and analyze legal agreements.
          </p>
        </div>
        <button 
          onClick={() => setIsUploadOpen(true)}
          style={{ 
            background: "var(--accent-primary)", 
            color: "white", 
            border: "none", 
            padding: "0.75rem 1.5rem", 
            borderRadius: "8px", 
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
          }}
        >
          + New Contract
        </button>
      </header>

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
          Loading Contracts...
        </div>
      ) : (
        <ContractTable 
            contracts={contracts} 
            onView={(id) => setSelectedContractId(id)}
        />
      )}

      {isUploadOpen && (
        <UploadModal 
          onClose={() => setIsUploadOpen(false)} 
          onSuccess={() => {
            loadContracts(); // Refresh list after upload
          }}
        />
      )}
    </div>
  );
}