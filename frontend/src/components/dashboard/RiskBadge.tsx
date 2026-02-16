import React from 'react';

export const RiskBadge: React.FC<{ level: string }> = ({ level }) => {
  // Normalize input to ensure it matches CSS classes (HIGH, MEDIUM, LOW)
  const normalizedLevel = level ? level.toUpperCase() : "UNKNOWN";
  
  // Define emoji map for visual flair
  const iconMap: Record<string, string> = {
    HIGH: "⚠️",
    MEDIUM: "⚡",
    LOW: "🛡️",
    UNKNOWN: "❓"
  };

  return (
    <span className={`badge ${normalizedLevel}`} style={{ gap: "6px" }}>
      {iconMap[normalizedLevel] || ""} {normalizedLevel}
    </span>
  );
};