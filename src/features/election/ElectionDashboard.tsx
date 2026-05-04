import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMapStore } from '../../store/useMapStore';
import { useTranslation } from '../../i18n/translations';
import { PARTY_COLORS } from '../../types/gis';

const ElectionDashboard: React.FC = () => {
  const { electionResults, electionLastUpdated, isElectionLive, activeLayer, theme } = useMapStore();
  const { t } = useTranslation();
  const [isMinimized, setIsMinimized] = React.useState(window.innerWidth < 768);

  const summary = useMemo(() => {
    if (!electionResults) return null;
    const counts: Record<string, number> = {};
    Object.values(electionResults).forEach(res => {
      counts[res.party] = (counts[res.party] || 0) + 1;
    });
    
    // Sort by count descending
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([party, count]) => ({ party, count }));
  }, [electionResults]);

  const totalReported = useMemo(() => {
    return electionResults ? Object.keys(electionResults).length : 0;
  }, [electionResults]);

  if (activeLayer !== 'CONSTITUENCY' || !isElectionLive || !summary) return null;

  const isMobile = window.innerWidth < 768;

  return (
    <motion.div
      initial={isMobile ? { y: 100, opacity: 0 } : { x: 300, opacity: 0 }}
      animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
      style={{
        position: 'fixed',
        bottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 80px)' : 'auto',
        top: isMobile ? 'auto' : '100px',
        right: isMobile ? '12px' : '20px',
        left: isMobile ? '12px' : 'auto',
        zIndex: 1000,
        width: isMobile ? (isMinimized ? '160px' : 'calc(100% - 24px)') : '280px',
        background: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: isMobile ? '20px' : '24px',
        border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        padding: isMobile ? (isMinimized ? '10px 16px' : '16px') : '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '12px' : '16px',
        maxHeight: isMobile ? '50dvh' : 'auto',
        cursor: isMobile && isMinimized ? 'pointer' : 'default',
        transition: 'width 0.3s ease, padding 0.3s ease'
      }}
      onClick={() => isMobile && isMinimized && setIsMinimized(false)}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ 
            fontSize: '10px', 
            fontWeight: 800, 
            color: 'var(--accent)', 
            textTransform: 'uppercase', 
            letterSpacing: '1px' 
          }}>
            {t('ELECTION_LIVE')}
          </span>
          {!isMinimized && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)' }}>
                {totalReported}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                / 234 {t('TALLY_PROGRESS')}
              </span>
            </div>
          )}
          {isMinimized && isMobile && (
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {totalReported} / 234
            </span>
          )}
        </div>
        
        {isMobile && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            style={{
              background: 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-primary)'
            }}
          >
            {isMinimized ? '↑' : '↓'}
          </button>
        )}
      </div>

      {!isMinimized && (
        <>
          {electionLastUpdated && (
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', opacity: 0.8 }}>
              {t('LAST_UPDATED')}: {electionLastUpdated}
            </span>
          )}

          {/* Progress Bar */}
          <div style={{ 
            width: '100%', 
            height: '6px', 
            background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(totalReported / 234) * 100}%` }}
              style={{ height: '100%', background: 'var(--accent)' }} 
            />
          </div>

          {/* Party Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              {t('LEADS_BY_PARTY')}
            </span>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px',
              maxHeight: isMobile ? '200px' : '250px',
              overflowY: 'auto',
              paddingRight: '4px'
            }} className="custom-scrollbar">
              {summary.map(({ party, count }) => (
                <div key={party} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '3px', 
                    background: PARTY_COLORS[party] || PARTY_COLORS['OTHERS'],
                    border: '1px solid rgba(255,255,255,0.2)'
                  }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
                    {t(`PARTY_${party}` as any).replace('PARTY_', '')}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default ElectionDashboard;
