import React from 'react';

export const RiskBadge: React.FC<{ level: string }> = ({ level }) => {
  // Ensure level matches the CSS classes (HIGH, MEDIUM, LOW)
  const normalizedLevel = level ? level.toUpperCase() : "UNKNOWN";
  
  return (
    <span className={`badge ${normalizedLevel}`}>
      {normalizedLevel}
    </span>
  );
};