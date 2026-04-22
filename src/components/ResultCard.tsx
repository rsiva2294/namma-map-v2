import React from 'react';
import { X, Copy, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ResultCardProps {
  title: string;
  icon?: React.ReactNode;
  themeColor: 'blue' | 'red' | 'orange';
  data: { label: string; value: string; subValue?: string; isPill?: boolean }[];
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
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="glass result-card"
    >
      {/* Header */}
      <div className="result-card-header">
        <div className="result-card-title-group">
          {icon && <span style={{ color: colors.text, display: 'flex' }}>{icon}</span>}
          <h3 className="result-card-title">{title}</h3>
        </div>
        <button
          onClick={onClose}
          className="result-card-close"
          aria-label="Close panel"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="result-card-body">
        {data.map((row, idx) => (
          <div key={idx} className="result-card-row">
            <span className="result-card-label">{row.label}</span>
            <div className="result-card-value-group">
              <div className="result-card-value-stack">
                <div className="result-card-value-row">
                  {row.isPill ? (
                    <span
                      className="result-card-pill"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {row.value}
                    </span>
                  ) : (
                    <span className="result-card-value" title={row.value}>{row.value}</span>
                  )}
                  {row.subValue && (
                    <span className="result-card-subvalue">({row.subValue})</span>
                  )}
                </div>
              </div>
              {row.isPill && (
                <button
                  onClick={() => handleCopy(row.value)}
                  className="copy-button"
                  aria-label={`Copy ${row.label}`}
                >
                  <Copy size={14} color="var(--text-secondary)" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Button */}
      {onDirections && (
        <button
          onClick={onDirections}
          className="result-card-action-button"
          style={{ backgroundColor: colors.button }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.hover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.button)}
          aria-label="Get directions to this location"
        >
          <MapPin size={16} />
          GET DIRECTIONS
        </button>
      )}
    </motion.div>
  );
};

export default ResultCard;
