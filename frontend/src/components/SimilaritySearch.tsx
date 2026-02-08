// frontend/src/components/SimilaritySearch.tsx
import { useState } from 'react';

export function SimilaritySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchSimilarClauses = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/similarity/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, top_k: 10 }),
      });
      
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="similarity-search">
      <h2>🔍 Find Similar Clauses</h2>
      
      <div className="search-box">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a clause to find similar ones..."
          onKeyPress={(e) => e.key === 'Enter' && searchSimilarClauses()}
        />
        <button onClick={searchSimilarClauses} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="results">
          <h3>Found {results.length} similar clauses:</h3>
          {results.map((result, index) => (
            <div key={index} className="result-card">
              <div className="similarity-badge">
                Match: {(result.similarity_score * 100).toFixed(1)}%
              </div>
              <div className="clause-text">{result.text}</div>
              <div className="metadata">
                <span className="badge type">{result.clause_type}</span>
                <span className={`badge risk risk-${result.risk_level.toLowerCase()}`}>
                  {result.risk_level} Risk
                </span>
                <span className="badge match">{result.match_type}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}