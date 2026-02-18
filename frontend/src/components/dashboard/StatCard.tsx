import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: "blue" | "green" | "red" | "yellow";
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, color = "blue", icon }) => {
  
  const gradients: Record<string, string> = {
    blue: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0))",
    green: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0))",
    red: "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0))",
    yellow: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0))"
  };

  const accentColor: Record<string, string> = {
    blue: "var(--accent-blue)",
    green: "var(--success)",
    red: "var(--danger)",
    yellow: "var(--warning)"
  };

  return (
    <div className="card fade-in" style={{ background: gradients[color], position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", position: "relative", zIndex: 1 }}>
        <div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "0.5px", marginBottom: "4px" }}>
            {title.toUpperCase()}
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
            {value}
          </div>
        </div>
        
        {icon && (
            <div style={{ 
                width: "40px", height: "40px", 
                borderRadius: "10px", 
                background: "rgba(255,255,255,0.05)", 
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.2rem",
                color: accentColor[color],
                border: "1px solid rgba(255,255,255,0.1)"
            }}>
                {icon}
            </div>
        )}
      </div>
    </div>
  );
};