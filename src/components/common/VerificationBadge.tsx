import React, { useState } from 'react';
import { CheckCircle2, ThumbsUp, XCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../i18n/translations';
import { useVerification } from '../../hooks/useVerification';
import { useMapStore } from '../../store/useMapStore';

interface VerificationBadgeProps {
  featureId: string;
  themeColor: 'blue' | 'red' | 'orange' | 'indigo' | 'slate' | 'rose';
  onReport?: () => void;
}

const colorMap = {
  blue: '#2563eb',
  red: '#ef4444',
  orange: '#f97316',
  indigo: '#4f46e5',
  slate: '#334155',
  rose: '#e11d48'
};

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ featureId, themeColor, onReport }) => {
  const { t } = useTranslation();
  const { count, isVerified, verify, isLoading } = useVerification(featureId);
  const theme = useMapStore(state => state.theme);
  const mainColor = colorMap[themeColor];
  const [showOptions, setShowOptions] = useState(false);
  const [selection, setSelection] = useState<'yes' | 'no' | null>(null);

  if (isLoading && count === 0) return null;

  const handleYes = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelection('yes');
    await verify();
  };

  const handleNo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelection('no');
    if (onReport) {
      setTimeout(onReport, 1000);
    }
  };

  return (
    <div className="verification-container" style={{ padding: '0 16px 12px 16px' }}>
      <AnimatePresence mode="wait">
        {!isVerified && !selection ? (
          !showOptions ? (
            <motion.button
              key="ask-btn"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowOptions(true);
              }}
              className="verify-action-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '12px',
                border: `1px solid ${mainColor}30`,
                background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#ffffff',
                cursor: 'pointer',
                width: '100%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: `${mainColor}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: mainColor
              }}>
                <ThumbsUp size={14} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  color: theme === 'dark' ? '#f8fafc' : '#1e293b' 
                }}>
                  {t('VERIFY_NOW')}
                </div>
                {count > 0 && (
                  <div style={{ 
                    fontSize: '10px', 
                    color: theme === 'dark' ? '#94a3b8' : '#64748b' 
                  }}>
                    {t('VERIFIED_BY').replace('{{count}}', count.toString())}
                  </div>
                )}
              </div>
            </motion.button>
          ) : (
            <motion.div
              key="options"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                display: 'flex',
                gap: '8px',
                width: '100%'
              }}
            >
              <button
                onClick={handleYes}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid #22c55e40',
                  background: 'rgba(34, 197, 94, 0.05)',
                  color: '#16a34a',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <ThumbsUp size={12} />
                {t('YES_CORRECT')}
              </button>
              <button
                onClick={handleNo}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid #ef444440',
                  background: 'rgba(239, 68, 68, 0.05)',
                  color: '#dc2626',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <XCircle size={12} />
                {t('NO_INCORRECT')}
              </button>
            </motion.div>
          )
        ) : isVerified || selection === 'yes' ? (
          <motion.div
            key="verified-badge"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              width: '100%'
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16a34a'
            }}>
              <CheckCircle2 size={16} />
            </div>
            <div>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                color: '#16a34a' 
              }}>
                {t('THANK_YOU_VERIFY')}
              </div>
              <div style={{ 
                fontSize: '10px', 
                color: '#16a34a',
                opacity: 0.8
              }}>
                {t('VERIFIED_BY').replace('{{count}}', count.toString())}
              </div>
            </div>
          </motion.div>
        ) : selection === 'no' ? (
          <motion.div
            key="reported-badge"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              width: '100%'
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626'
            }}>
              <AlertTriangle size={16} />
            </div>
            <div>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                color: '#dc2626' 
              }}>
                {t('THANKS_REPORTING')}
              </div>
              <div style={{ 
                fontSize: '10px', 
                color: '#dc2626',
                opacity: 0.8
              }}>
                {t('REPORT_ISSUE')}...
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
