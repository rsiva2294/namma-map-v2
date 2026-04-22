import React from 'react';
import { X, Copy, MapPin } from 'lucide-react';

export interface ResultCardProps {
  title: string;
  icon?: React.ReactNode;
  themeColor: 'blue' | 'red' | 'orange';
  data: { label: string; value: string; isPill?: boolean }[];
  onClose: () => void;
  onDirections?: () => void;
}

const colorMap = {
  blue: {
    bg: '#eff6ff',
    text: '#2563eb',
    button: '#2563eb',
    hover: '#1d4ed8'
  },
  red: {
    bg: '#fef2f2',
    text: '#ef4444',
    button: '#ef4444',
    hover: '#dc2626'
  },
  orange: {
    bg: '#fff7ed',
    text: '#f97316',
    button: '#f97316',
    hover: '#ea580c'
  }
};

const ResultCard: React.FC<ResultCardProps> = ({ title, icon, themeColor, data, onClose, onDirections }) => {
  const colors = colorMap[themeColor];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div
      className="glass"
      style={{
        position: 'absolute',
        top: '86px',
        right: '20px',
        width: '340px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--border-glass)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-glass)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {icon && <span style={{ color: colors.text, display: 'flex' }}>{icon}</span>}
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{title}</h3>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {data.map((row, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{row.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {row.isPill ? (
                <span
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.text,
                    padding: '4px 10px',
                    borderRadius: '16px',
                    fontWeight: '700',
                    fontSize: '12px'
                  }}
                >
                  {row.value}
                </span>
              ) : (
                <span style={{ color: 'var(--text-primary)', fontWeight: '600', textAlign: 'right', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.value}>{row.value}</span>
              )}
              {row.isPill && (
                <button
                  onClick={() => handleCopy(row.value)}
                  title="Copy to clipboard"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    opacity: 0.7,
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                >
                  <Copy size={14} color="var(--text-secondary)" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Button */}
      <button
        onClick={onDirections}
        style={{
          width: '100%',
          backgroundColor: colors.button,
          color: '#ffffff',
          border: 'none',
          padding: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontWeight: 'bold',
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          marginTop: 'auto'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.hover)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.button)}
      >
        <MapPin size={16} />
        GET DIRECTIONS
      </button>
    </div>
  );
};

export default ResultCard;
