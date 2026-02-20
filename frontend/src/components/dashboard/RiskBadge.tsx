import React from 'react';

export const RiskBadge: React.FC<{ level?: string }> = ({ level }) => {
  const normalizedLevel = level ? level.toUpperCase() : "UNKNOWN";
  
  const icons: Record<string, string> = {
    HIGH: "⚠️",
    MEDIUM: "⚡",
    LOW: "🛡️",
    UNKNOWN: "❓"
  };

  const styles: Record<string, { bg: string, color: string, border: string }> = {
    HIGH: { bg: "rgba(239, 68, 68, 0.15)", color: "#fca5a5", border: "rgba(239, 68, 68, 0.3)" },
    MEDIUM: { bg: "rgba(245, 158, 11, 0.15)", color: "#fcd34d", border: "rgba(245, 158, 11, 0.3)" },
    LOW: { bg: "rgba(16, 185, 129, 0.15)", color: "#6ee7b7", border: "rgba(16, 185, 129, 0.3)" },
    UNKNOWN: { bg: "rgba(148, 163, 184, 0.1)", color: "#cbd5e1", border: "rgba(148, 163, 184, 0.2)" }
  };

  const config = styles[normalizedLevel] || styles.UNKNOWN;

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      background: config.bg, color: config.color,
      padding: "4px 10px", borderRadius: "99px",
      fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.05em",
      border: `1px solid ${config.border}`,
      textTransform: "uppercase",
      whiteSpace: "nowrap"
    }}>
      {icons[normalizedLevel] || ""} {normalizedLevel}
    </span>
  );
};