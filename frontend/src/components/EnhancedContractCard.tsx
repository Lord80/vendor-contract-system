// frontend/src/components/EnhancedContractCard.tsx
interface EnhancedContract {
  id: number;
  contract_name: string;
  ai_insights: {
    clause_types: string[];
    similarity_score: number;
    risk_factors: Array<{
      feature: string;
      impact: number;
      direction: string;
      description: string;
    }>;
    anomalies: string[];
  };
}

export function EnhancedContractCard({ contract }: { contract: EnhancedContract }) {
  return (
    <div className="contract-card">
      <h3>{contract.contract_name}</h3>
      
      {/* AI Insights Badges */}
      <div className="ai-badges">
        {contract.ai_insights.clause_types.map(type => (
          <span key={type} className="clause-badge">{type}</span>
        ))}
      </div>
      
      {/* Risk Factors Visualization */}
      <div className="risk-factors">
        <h4>Top Risk Factors:</h4>
        {contract.ai_insights.risk_factors.map((factor, idx) => (
          <div key={idx} className="risk-factor">
            <div className="factor-bar" style={{
              width: `${Math.abs(factor.impact) * 100}%`,
              backgroundColor: factor.impact > 0 ? '#ef4444' : '#10b981'
            }} />
            <span>{factor.description}</span>
            <span className="impact">
              {factor.direction} risk by {Math.abs(factor.impact * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
      
      {/* Similar Clauses */}
      <div className="similarity">
        <h4>Similar to {contract.ai_insights.similarity_score} known clauses</h4>
      </div>
    </div>
  );
}