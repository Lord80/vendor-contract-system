import React from 'react';
import logoIcon from '../../assets/logo-icon.png'; // Make sure this path matches your image

export const Logo = ({ subtitle = "Enterprise" }: { subtitle?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    
    <div style={{ 
        width: '36px', 
        height: '36px', 
        borderRadius: '10px',
        boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.05)', 
        overflow: 'hidden'
    }}>
      {/* If the image fails to load, it will show a fallback */}
      <img 
        src={logoIcon} 
        alt="ContractAI Logo" 
        style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    </div>

    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color: '#f8fafc' }}>
        Contract<span style={{color: '#8b5cf6'}}>AI</span>
      </span>
      <span style={{ 
          fontSize: '0.6rem', 
          color: subtitle === "Vendor Portal" ? "#67e8f9" : "#64748b", 
          letterSpacing: '0.15em', 
          textTransform: 'uppercase', 
          fontWeight: 600 
      }}>
        {subtitle}
      </span>
    </div>
    
  </div>
);