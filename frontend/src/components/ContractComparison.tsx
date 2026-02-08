// frontend/src/components/ContractComparison.tsx
import { useState, useEffect } from 'react';
import type { Contract } from '../types';

export function ContractComparison() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contract1, setContract1] = useState<number | null>(null);
  const [contract2, setContract2] = useState<number | null>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    const response = await fetch('http://localhost:8000/contracts/');
    const data = await response.json();
    setContracts(data);
  };

  const compareContracts = async () => {
    if (!contract1 || !contract2) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/similarity/compare/contracts?contract1_id=${contract1}&contract2_id=${contract2}`,
        { method: 'POST' }
      );
      
      const data = await response.json();
      setComparison(data);
    } catch (error) {
      console.error('Comparison failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contract-comparison">
      <h2>📊 Compare Contracts</h2>
      
      <div className="comparison-controls">
        <select value={contract1 || ''} onChange={(e) => setContract1(Number(e.target.value))}>
          <option value="">Select first contract</option>
          {contracts.map(c => (
            <option key={c.id} value={c.id}>
              {c.contract_name} ({c.risk_level})
            </option>
          ))}
        </select>
        
        <span className="vs">vs</span>
        
        <select value={contract2 || ''} onChange={(e) => setContract2(Number(e.target.value))}>
          <option value="">Select second contract</option>
          {contracts.map(c => (
            <option key={c.id} value={c.id}>
              {c.contract_name} ({c.risk_level})
            </option>
          ))}
        </select>
        
        <button onClick={compareContracts} disabled={!contract1 || !contract2 || loading}>
          {loading ? 'Comparing...' : 'Compare'}
        </button>
      </div>

      {comparison && (
        <div className="comparison-results">
          <h3>Comparison Results</h3>
          
          <div className="similarity-score">
            <div className="score-circle">
              {(comparison.overall_comparison.similarity_score * 100).toFixed(0)}%
            </div>
            <p>Overall Similarity</p>
            <p className="interpretation">
              {comparison.overall_comparison.interpretation}
            </p>
          </div>

          <div className="risk-comparison">
            <h4>Risk Comparison</h4>
            <div className="risk-bars">
              <div className="risk-bar">
                <div className="bar-label">{comparison.contract1}</div>
                <div className={`bar-fill risk-${comparison.risk_comparison.contract1_risk.toLowerCase()}`}>
                  {comparison.risk_comparison.contract1_risk}
                </div>
              </div>
              <div className="risk-bar">
                <div className="bar-label">{comparison.contract2}</div>
                <div className={`bar-fill risk-${comparison.risk_comparison.contract2_risk.toLowerCase()}`}>
                  {comparison.risk_comparison.contract2_risk}
                </div>
              </div>
            </div>
          </div>

          {comparison.clause_comparison.clause_comparisons?.length > 0 && (
            <div className="clause-matches">
              <h4>Matching Clauses</h4>
              {comparison.clause_comparison.clause_comparisons.map((match: any, idx: number) => (
                <div key={idx} className="clause-match">
                  <div className="match-score">
                    {(match.similarity * 100).toFixed(0)}% match
                  </div>
                  <div className="clause-pair">
                    <div className="clause">{match.clause}</div>
                    <div className="arrow">→</div>
                    <div className="clause">{match.best_match}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}