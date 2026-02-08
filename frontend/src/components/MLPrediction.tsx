// frontend/src/components/MLPrediction.tsx
import { useState } from 'react';

export function MLPrediction() {
  const [contractText, setContractText] = useState('');
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<any>(null);

  const predictRisk = async () => {
    if (!contractText.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/ml/predict/risk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw_text: contractText,
          contract_name: "User Input Contract"
        }),
      });
      
      const data = await response.json();
      setPrediction(data.prediction);
      setExplanation(null); // Clear previous explanation
    } catch (error) {
      console.error('Prediction failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExplanation = async () => {
    if (!prediction) return;
    
    try {
      const response = await fetch('http://localhost:8000/ml/explain/prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contract_data: { raw_text: contractText },
          prediction_result: prediction
        }),
      });
      
      const data = await response.json();
      setExplanation(data.explanation);
    } catch (error) {
      console.error('Explanation failed:', error);
    }
  };

  return (
    <div className="ml-prediction">
      <h2>🤖 ML Risk Prediction</h2>
      
      <div className="prediction-container">
        <div className="input-section">
          <h3>Analyze Contract Text</h3>
          <textarea
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            placeholder="Paste contract text here..."
            rows={8}
          />
          <button onClick={predictRisk} disabled={loading || !contractText.trim()}>
            {loading ? 'Analyzing...' : 'Predict Risk'}
          </button>
        </div>

        {prediction && (
          <div className="result-section">
            <h3>Prediction Results</h3>
            
            <div className="prediction-card">
              <div className={`prediction-badge risk-${prediction.predicted_risk_level.toLowerCase()}`}>
                {prediction.predicted_risk_level} RISK
              </div>
              
              <div className="confidence">
                Confidence: {(prediction.confidence * 100).toFixed(1)}%
              </div>
              
              <div className="probabilities">
                <h4>Probability Distribution:</h4>
                {Object.entries(prediction.probabilities).map(([risk, prob]) => (
                  <div key={risk} className="probability-bar">
                    <div className="risk-label">{risk}</div>
                    <div className="bar-container">
                      <div 
                        className={`bar-fill risk-${risk.toLowerCase()}`}
                        style={{ width: `${(prob as number) * 100}%` }}
                      />
                      <span className="prob-value">{(prob as number * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={getExplanation}
                className="explain-button"
              >
                🔍 Explain This Prediction
              </button>
            </div>
          </div>
        )}

        {explanation && (
          <div className="explanation-section">
            <h3>AI Explanation</h3>
            <p className="interpretation">{explanation.interpretation}</p>
            
            <div className="feature-contributions">
              <h4>Top Contributing Factors:</h4>
              {explanation.top_features.map((feature: any, index: number) => (
                <div key={index} className="feature-item">
                  <div className="feature-header">
                    <span className="feature-name">{feature.feature}</span>
                    <span className={`contribution ${feature.direction}`}>
                      {feature.direction} risk
                    </span>
                  </div>
                  <div className="feature-description">{feature.description}</div>
                  <div className="feature-value">Value: {feature.value.toFixed(2)}</div>
                  <div className="contribution-bar">
                    <div 
                      className="contribution-fill"
                      style={{ 
                        width: `${Math.abs(feature.contribution) * 100}%`,
                        backgroundColor: feature.contribution > 0 ? '#ef4444' : '#10b981'
                      }}
                    />
                    <span className="contribution-value">
                      Impact: {(feature.contribution * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}