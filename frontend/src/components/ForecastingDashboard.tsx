import { useState, useEffect } from 'react';

export function ForecastingDashboard() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState<number | null>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [timeHorizon, setTimeHorizon] = useState(30);
  const [recommendations, setRecommendations] = useState<Record<number, any>>({});

  useEffect(() => {
    fetchContracts();
  }, []);

  useEffect(() => {
    if (contracts.length > 0) {
      fetchRecommendations();
    }
  }, [contracts]);

  const fetchContracts = async () => {
    try {
      const response = await fetch('http://localhost:8000/contracts/');
      const data = await response.json();
      setContracts(data);
      if (data.length > 0 && !selectedContract) {
        setSelectedContract(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    }
  };

  const getForecast = async () => {
    if (!selectedContract) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/forecast/sla/violations/${selectedContract}?days_ahead=${timeHorizon}`
      );
      const data = await response.json();
      setForecast(data);
    } catch (error) {
      console.error('Forecast failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRenewalRecommendation = async (contractId: number) => {
    try {
      const response = await fetch(
        `http://localhost:8000/forecast/contract/renewal/${contractId}`
      );
      return await response.json();
    } catch (error) {
      console.error('Renewal recommendation failed:', error);
      return null;
    }
  };

  const fetchRecommendations = async () => {
    const results: Record<number, any> = {};
    for (const contract of contracts.slice(0, 3)) {
      const rec = await getRenewalRecommendation(contract.id);
      if (rec) {
        results[contract.id] = rec;
      }
    }
    setRecommendations(results);
  };

  return (
    <div className="forecasting-dashboard">
      <h2>📈 AI Forecasting & Predictions</h2>

      <div className="forecast-controls">
        <div className="control-group">
          <label>Select Contract:</label>
          <select 
            value={selectedContract || ''} 
            onChange={(e) => setSelectedContract(Number(e.target.value))}
          >
            {contracts.map(c => (
              <option key={c.id} value={c.id}>
                {c.contract_name} ({c.risk_level})
              </option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label>Forecast Horizon:</label>
          <select 
            value={timeHorizon} 
            onChange={(e) => setTimeHorizon(Number(e.target.value))}
          >
            <option value={7}>1 Week</option>
            <option value={30}>1 Month</option>
            <option value={90}>3 Months</option>
          </select>
        </div>
        
        <button onClick={getForecast} disabled={loading || !selectedContract}>
          {loading ? 'Forecasting...' : '🚀 Generate Forecast'}
        </button>
      </div>

      {forecast && (
        <div className="forecast-results">
          <div className="forecast-header">
            <h3>SLA Violation Forecast: {forecast.contract_name}</h3>
            <div className={`risk-badge risk-${forecast.forecast.risk_level.toLowerCase()}`}>
              {forecast.forecast.risk_level} RISK
            </div>
          </div>
          
          <div className="forecast-summary">
            <div className="summary-card">
              <h4>📊 Forecast Summary</h4>
              <p>Average predicted violations: <strong>{forecast.forecast.avg_predicted_violations.toFixed(2)} per day</strong></p>
              <p>Trend: <strong>{forecast.forecast.trend.toUpperCase()}</strong></p>
              <p>Model: <code>{forecast.forecast.model}</code></p>
            </div>
            
            <div className="summary-card">
              <h4>🎯 Recommendations</h4>
              {forecast.forecast.risk_level === 'HIGH' ? (
                <p className="warning">⚠️ High risk of SLA violations. Consider proactive measures.</p>
              ) : forecast.forecast.risk_level === 'MEDIUM' ? (
                <p className="info">ℹ️ Moderate risk. Monitor performance closely.</p>
              ) : (
                <p className="success">✓ Low risk. Continue current monitoring.</p>
              )}
            </div>
          </div>

          <div className="predictions-chart">
            <h4>Daily Violation Predictions</h4>
            <div className="chart-container">
              {forecast.forecast.predictions.slice(0, 14).map((pred: any, idx: number) => (
                <div key={idx} className="prediction-bar">
                  <div className="bar-label">{pred.date.split('-')[2]}</div>
                  <div className="bar-wrapper">
                    <div 
                      className="prediction-bar-fill"
                      style={{ 
                        height: `${Math.min(100, pred.predicted_violations * 30)}%`,
                        backgroundColor: pred.predicted_violations > 1 ? '#ef4444' : 
                                        pred.predicted_violations > 0.5 ? '#f59e0b' : '#10b981'
                      }}
                    />
                    <div className="confidence-interval"
                      style={{
                        height: `${Math.min(100, (pred.upper_bound - pred.lower_bound) * 15)}%`,
                        top: `${Math.min(90, pred.lower_bound * 30)}%`
                      }}
                    />
                  </div>
                  <div className="bar-value">{pred.predicted_violations.toFixed(1)}</div>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <div className="legend-item"><div className="color-box low"></div> Low Risk (< 0.5)</div>
              <div className="legend-item"><div className="color-box medium"></div> Medium Risk (0.5-1.0)</div>
              <div className="legend-item"><div className="color-box high"></div> High Risk (> 1.0)</div>
            </div>
          </div>
        </div>
      )}

      <div className="renewal-recommendations">
        <h3>🔄 Contract Renewal Recommendations</h3>
        <div className="recommendation-cards">
          {contracts.slice(0, 3).map((contract) => {
            const recommendation = recommendations[contract.id];
            return recommendation ? (
              <div key={contract.id} className="recommendation-card">
                <h4>{contract.contract_name}</h4>
                <div className={`action-badge action-${recommendation.recommendation.recommended_action.toLowerCase()}`}>
                  {recommendation.recommendation.recommended_action}
                </div>
                <p>Confidence: <strong>{recommendation.recommendation.confidence}</strong></p>
                <p>Days until expiry: <strong>{recommendation.days_until_expiry}</strong></p>
                <p className="reasoning">{recommendation.recommendation.reasoning}</p>
              </div>
            ) : (
              <p key={contract.id}>Loading recommendation...</p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
