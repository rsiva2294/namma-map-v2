import React from 'react';
import { X, Copy, MapPin, AlertCircle, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '../i18n/translations';

export interface ResultCardProps {
  title: string;
  icon?: React.ReactNode;
  themeColor: 'blue' | 'red' | 'orange' | 'indigo' | 'slate' | 'rose';
  data: { label: string; value: string; subValue?: string; isPill?: boolean }[];
  badges?: { label: string; color?: string; icon?: React.ReactNode }[];
  onClose: () => void;
  onDirections?: () => void;
  onReport?: () => void;
  actionLabel?: string;
  onAction?: () => void;
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
  },
  indigo: {
    bg: '#eef2ff',
    text: '#4f46e5',
    button: '#4f46e5',
    hover: '#4338ca'
  },
  slate: {
    bg: '#f1f5f9',
    text: '#334155',
    button: '#334155',
    hover: '#1e293b'
  },
  rose: {
    bg: '#fff1f2',
    text: '#e11d48',
    button: '#e11d48',
    hover: '#be123c'
  }
};

const ResultCard: React.FC<ResultCardProps> = ({ 
  title, icon, themeColor, data, badges, onClose, onDirections, onReport, actionLabel, onAction 
}) => {
  const colors = colorMap[themeColor];
  const { t, language } = useTranslation();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <motion.div
      initial={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, x: 50, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="glass result-card"
    >
      {/* Header */}
      <div className="result-card-header">
        <div className="result-card-title-group">
          {icon && <span style={{ color: colors.text, display: 'flex' }}>{icon}</span>}
          <h3 className="result-card-title">{title}</h3>
        </div>
        <div className="result-card-header-actions">
          {onReport && (
            <button
              onClick={onReport}
              className="result-card-header-btn"
              aria-label={t('REPORT_ISSUE')}
              title={t('REPORT_ISSUE')}
            >
              <AlertCircle size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="result-card-header-btn close"
            aria-label={t('CLOSE')}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Badges Section */}
      {badges && badges.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '0 16px 12px 16px' }}>
          {badges.map((badge, i) => (
            <div 
              key={i} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px', 
                padding: '3px 8px', 
                borderRadius: '6px', 
                fontSize: '10px', 
                fontWeight: 700,
                background: badge.color ? `${badge.color}15` : colors.bg,
                color: badge.color || colors.text,
                border: `1px solid ${badge.color ? `${badge.color}30` : 'transparent'}`
              }}
            >
              {badge.icon}
              <span>{badge.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Accuracy Disclaimer */}
      <div style={{ 
        padding: '8px 12px', 
        margin: '0 16px 12px 16px', 
        borderRadius: '8px', 
        background: 'rgba(0,0,0,0.03)', 
        border: '1px dashed rgba(0,0,0,0.1)',
        fontSize: '10px',
        color: 'var(--text-secondary)',
        lineHeight: '1.4',
        display: 'flex',
        gap: '6px'
      }}>
        <span style={{ fontSize: '12px', marginTop: '-1px' }}>📍</span>
        <span><strong>Accuracy:</strong> {language === 'ta' ? 'தோராயமான இடம். 200 மீட்டருக்குள் அலுவலகம் அமைந்துள்ளது.' : 'Vicinity only. The office is located within 200m of this point.'}</span>
      </div>

      {/* Body */}
      <div className="result-card-body">
        {data.map((row, idx) => (
          <div key={idx} className={`result-card-row ${row.subValue ? 'has-subvalue' : ''}`}>
            <div className="result-card-main-row">
              <span className="result-card-label">{row.label}</span>
              <div className="result-card-value-group">
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
            {row.subValue && (
              <span className="result-card-subvalue">{row.subValue}</span>
            )}
          </div>
        ))}
      </div>

      {/* Footer Button */}
      {(onDirections || onAction) && (
        <button
          onClick={onAction || onDirections}
          className="result-card-action-button"
          style={{ backgroundColor: colors.button }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.hover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.button)}
          aria-label={actionLabel || t('DIRECTIONS')}
        >
          {onAction ? <Send size={16} /> : <MapPin size={16} />}
          {actionLabel || t('DIRECTIONS')}
        </button>
      )}
    </motion.div>
  );
};

export default ResultCard;
