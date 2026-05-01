import React from 'react';
import { X, Copy, MapPin, Send, ChevronDown, Navigation, Info } from 'lucide-react';
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
  onMinimize?: () => void;
}

const colorMap = {
  blue: {
    bg: 'var(--primary-container)',
    text: 'var(--on-primary-container)',
    button: 'var(--primary)',
    hover: 'var(--primary-fixed-dim)'
  },
  red: {
    bg: 'var(--error-container)',
    text: 'var(--on-error-container)',
    button: 'var(--error)',
    hover: 'var(--error)'
  },
  orange: {
    bg: 'var(--tertiary-container)',
    text: 'var(--on-tertiary-container)',
    button: 'var(--tertiary)',
    hover: 'var(--tertiary)'
  },
  indigo: {
    bg: 'var(--secondary-container)',
    text: 'var(--on-secondary-container)',
    button: 'var(--secondary)',
    hover: 'var(--secondary)'
  },
  slate: {
    bg: 'var(--surface-container-highest)',
    text: 'var(--on-surface-variant)',
    button: 'var(--on-surface)',
    hover: 'var(--inverse-surface)'
  },
  rose: {
    bg: 'rgba(225, 29, 72, 0.1)',
    text: 'var(--health-rose)',
    button: 'var(--health-rose)',
    hover: 'var(--health-rose)'
  }
};

const ResultCard: React.FC<ResultCardProps> = ({ 
  title, icon, themeColor, data, badges, onClose, onDirections, onReport, actionLabel, onAction, onMinimize 
}) => {
  const colors = colorMap[themeColor];
  const { t } = useTranslation();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const handleDirections = () => {
    if (onAction) {
      onAction();
    } else if (onDirections) {
      onDirections();
    }
  };

  return (
    <motion.div
      initial={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, x: 50, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="glass result-card"
    >
      {isMobile && onMinimize && (
        <div className="result-card-drag-handle" onClick={onMinimize} />
      )}
      {/* Header */}
      <div className="result-card-header">
        <div className="result-card-title-group">
          {icon && <span style={{ color: colors.text, display: 'flex' }}>{icon}</span>}
          <h3 className="result-card-title text-headline-md">{title}</h3>
        </div>
        <div className="result-card-header-actions">
          {isMobile && (onDirections || onAction) && (
            <button
              onClick={handleDirections}
              className="result-card-header-btn directions-quick-btn"
              aria-label={t('DIRECTIONS')}
              style={{ color: colors.button }}
              title={t('DIRECTIONS')}
            >
              <Navigation size={18} />
            </button>
          )}
          {onReport && (
            <button
              onClick={onReport}
              className="result-card-header-btn"
              aria-label={t('REPORT_ISSUE')}
              title={t('REPORT_ISSUE')}
            >
              <Info size={18} />
            </button>
          )}
          {onMinimize && isMobile && (
            <button
              onClick={onMinimize}
              className="result-card-header-btn"
              aria-label={t('MINIMIZE') || 'Minimize'}
              style={{ color: '#f59e0b' }}
            >
              <ChevronDown size={18} />
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
        borderRadius: 'var(--rounded-std)', 
        background: 'var(--surface-container-low)', 
        border: '1px dashed var(--outline-variant)',
        fontSize: '11px',
        color: 'var(--on-surface-variant)',
        lineHeight: '1.4',
        display: 'flex',
        gap: '6px'
      }}>
        <span style={{ fontSize: '12px', marginTop: '-1px' }}>📍</span>
        <span><strong className="text-label-caps" style={{ fontSize: '10px' }}>{t('ACCURACY')}:</strong> {t('VICINITY_DISCLAIMER')}</span>
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
                    aria-label={t('COPY_LABEL').replace('{{label}}', row.label)}
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
        <div className="result-card-footer">
          <button
            onClick={handleDirections}
            className="result-card-action-button"
            style={{ backgroundColor: colors.button }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.hover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.button)}
            aria-label={actionLabel || t('DIRECTIONS')}
          >
            {onAction ? <Send size={16} /> : <MapPin size={16} />}
            {actionLabel || t('DIRECTIONS')}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ResultCard;
