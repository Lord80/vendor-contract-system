import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string; // Expecting Hex
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = "#3b82f6", delay = 0 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="holo-card"
      style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
        <div style={{ 
          width: '48px', height: '48px', borderRadius: '12px', 
          background: `linear-gradient(135deg, ${color}20, ${color}05)`, 
          border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color,
          boxShadow: `0 0 20px ${color}15`
        }}>
          {icon}
        </div>
      </div>
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: "4px" }}>
          {title}
        </div>
        <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, letterSpacing: "-1px" }}>
          {value}
        </div>
      </div>
    </motion.div>
  );
};