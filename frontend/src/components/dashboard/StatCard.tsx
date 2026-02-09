import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  icon?: React.ReactNode;
  color?: "blue" | "green" | "red" | "yellow";
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, color = "blue" }) => {
  const colorMap = {
    blue: "var(--accent-primary)",
    green: "var(--accent-success)",
    red: "var(--accent-danger)",
    yellow: "var(--accent-warning)"
  };

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
        {title.toUpperCase()}
      </span>
      <div style={{ fontSize: "2rem", fontWeight: 700, color: colorMap[color] }}>
        {value}
      </div>
    </div>
  );
};