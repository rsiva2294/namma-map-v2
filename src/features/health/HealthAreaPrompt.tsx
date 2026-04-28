import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Navigation } from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';
import { useTranslation } from '../../i18n/translations';

export const HealthAreaPrompt: React.FC = () => {
  const setTriggerLocateMe = useMapStore(state => state.setTriggerLocateMe);
  const healthFilters = useMapStore(state => state.healthFilters);
  const healthScope = useMapStore(state => state.healthScope);
  const activeLayer = useMapStore(state => state.activeLayer);
  const theme = useMapStore(state => state.theme);
  const { t } = useTranslation();

  const hasLocal = healthFilters.facilityTypes.includes('PHC') || healthFilters.facilityTypes.includes('HSC');
  const hasOther = healthFilters.facilityTypes.some(t => t !== 'PHC' && t !== 'HSC');

  // Show only if in Health module, statewide scope, and ONLY Local Centres are selected
  // (If other facilities are selected, the map will still show useful statewide data)
  const needsArea = activeLayer === 'HEALTH' && 
                    healthScope === 'STATE' && 
                    hasLocal && !hasOther;

  if (!needsArea) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        className="glass area-prompt-card"
        style={{
          position: 'absolute',
          top: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3000,
          padding: '24px',
          width: '340px',
          borderRadius: '24px',
          border: '2px solid var(--accent)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          textAlign: 'center',
          background: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)'
        }}
      >
        <div style={{ 
          background: 'rgba(14, 165, 233, 0.1)', 
          width: '56px', 
          height: '56px', 
          borderRadius: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <MapPin color="var(--accent)" size={28} />
        </div>
        
        <h3 style={{ 
          fontSize: '20px', 
          fontWeight: 800, 
          marginBottom: '10px', 
          color: theme === 'dark' ? '#f8fafc' : '#0f172a',
          letterSpacing: '-0.5px'
        }}>
          {t('FOCUS_AREA_REQUIRED')}
        </h3>
        <p style={{ 
          fontSize: '14px', 
          color: theme === 'dark' ? '#94a3b8' : '#64748b', 
          lineHeight: 1.6, 
          marginBottom: '24px' 
        }}>
          {t('FOCUS_AREA_DESC')}
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={() => setTriggerLocateMe(true)}
            className="btn-primary"
            style={{ 
              width: '100%', 
              padding: '14px', 
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 700,
              borderRadius: '14px'
            }}
          >
            <Navigation size={18} />
            {t('USE_MY_LOCATION')}
          </button>
          
          <div style={{ position: 'relative', margin: '10px 0' }}>
            <div style={{ 
              height: '1px', 
              background: 'var(--border-glass)', 
              width: '100%', 
              position: 'absolute', 
              top: '50%' 
            }} />
            <span style={{ 
              background: theme === 'dark' ? '#0f172a' : '#fff', 
              padding: '0 12px', 
              fontSize: '11px', 
              fontWeight: 800, 
              color: '#94a3b8', 
              position: 'relative',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>{t('OR')}</span>
          </div>
          
          <div style={{
            padding: '16px',
            background: 'rgba(14, 165, 233, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(14, 165, 233, 0.1)'
          }}>
            <p style={{ 
              fontSize: '12px', 
              fontWeight: 700, 
              color: theme === 'dark' ? '#38bdf8' : 'var(--accent)', 
              marginBottom: '8px' 
            }}>
              {t('USE_SEARCH_BAR')}
            </p>
            <p style={{ 
              fontSize: '11px', 
              color: theme === 'dark' ? '#64748b' : '#94a3b8',
              lineHeight: 1.4
            }}>
              {t('SEARCH_UNLOCK_DESC')}
            </p>
            
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              style={{ color: 'var(--accent)', display: 'flex', justifyContent: 'center', marginTop: '12px' }}
            >
              <Search size={24} strokeWidth={3} />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
