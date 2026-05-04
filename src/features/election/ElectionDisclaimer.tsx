import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../store/useMapStore';
import { useTranslation } from '../../i18n/translations';
import { AlertCircle } from 'lucide-react';

const ElectionDisclaimer: React.FC = () => {
  const { isElectionLive, activeLayer, theme } = useMapStore();
  const { t } = useTranslation();

  if (activeLayer !== 'CONSTITUENCY' || !isElectionLive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          width: '90%',
          maxWidth: '500px',
        }}
      >
        <div style={{
          background: theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          padding: '10px 16px',
          borderRadius: '12px',
          border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 500, 
            color: 'var(--text-secondary)',
            lineHeight: 1.4
          }}>
            {t('ELECTION_PROVISIONAL_BANNER')}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ElectionDisclaimer;
