import React from 'react';
import { CheckCircle2, ThumbsUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../i18n/translations';
import { useVerification } from '../../hooks/useVerification';
import { useMapStore } from '../../store/useMapStore';

interface VerificationBadgeProps {
  featureId: string;
  themeColor: 'blue' | 'red' | 'orange' | 'indigo' | 'slate' | 'rose';
}

const colorMap = {
  blue: '#2563eb',
  red: '#ef4444',
  orange: '#f97316',
  indigo: '#4f46e5',
  slate: '#334155',
  rose: '#e11d48'
};

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ featureId, themeColor }) => {
  const { t } = useTranslation();
  const { count, isVerified, verify, isLoading } = useVerification(featureId);
  const theme = useMapStore(state => state.theme);
  const mainColor = colorMap[themeColor];

  if (isLoading && count === 0) return null;

  return (
    <div className="verification-container" style={{ padding: '0 16px 12px 16px' }}>
      <AnimatePresence mode="wait">
        {!isVerified ? (
          <motion.button
            key="verify-btn"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              verify();
            }}
            className="verify-action-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '10px',
              border: `1px solid ${mainColor}40`,
              background: theme === 'dark' ? '#1e293b' : '#ffffff',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              transition: 'all 0.2s ease'
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
            <div style={{ flex: 1 }}>
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
            key="verified-badge"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '10px',
              background: 'rgba(34, 197, 94, 0.1)',
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
        )}
      </AnimatePresence>
    </div>
  );
};
