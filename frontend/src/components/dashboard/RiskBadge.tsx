import React from 'react';

export const RiskBadge: React.FC<{ level?: string }> = ({ level }) => {
  // Ensure we always have a valid uppercase string, default to "UNKNOWN"
  const normalizedLevel = level ? level.toUpperCase() : "UNKNOWN";
  
  // Define emoji map for visual flair
  const iconMap: Record<string, string> = {
    HIGH: "⚠️",
    MEDIUM: "⚡",
    LOW: "🛡️",
    UNKNOWN: "❓"
  };

  return (
    <span className={`badge ${normalizedLevel}`}>
      {iconMap[normalizedLevel] || ""} {normalizedLevel}
    </span>
  );
};