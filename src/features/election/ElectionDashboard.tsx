import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMapStore } from '../../store/useMapStore';
import { useTranslation } from '../../i18n/translations';
import { PARTY_COLORS } from '../../types/gis';
import { getPartyLogo } from '../../utils/partyLogo';

import { RefreshCw } from 'lucide-react';

const ElectionDashboard: React.FC = () => {
  const { stateSummary, stateSummaryLoading, fetchStateSummary, electionLastUpdated, isElectionLive, activeLayer, theme, searchResult } = useMapStore();
  const { t } = useTranslation();
  const [isMinimized, setIsMinimized] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    if (activeLayer === 'CONSTITUENCY' && isElectionLive && !stateSummary && !stateSummaryLoading) {
      fetchStateSummary();
    }
  }, [activeLayer, isElectionLive, stateSummary, stateSummaryLoading, fetchStateSummary]);

  const totals = useMemo(() => {
    if (!stateSummary) return { won: 0, leading: 0, total: 0 };
    return stateSummary.reduce((acc, curr) => ({
      won: acc.won + curr.won,
      leading: acc.leading + curr.leading,
      total: acc.total + curr.won + curr.leading
    }), { won: 0, leading: 0, total: 0 });
  }, [stateSummary]);

  const totalReported = totals.total;

  if (activeLayer !== 'CONSTITUENCY' || !isElectionLive || searchResult || !stateSummary) return null;

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
              color: 'var(--text-primary)',
              marginLeft: 'auto'
            }}
          >
            {isMinimized ? '↑' : '↓'}
          </button>
        )}

        {!isMinimized && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!stateSummaryLoading) fetchStateSummary();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: stateSummaryLoading ? 'not-allowed' : 'pointer',
              color: 'var(--text-secondary)',
              padding: '4px',
              marginLeft: isMobile ? '8px' : 'auto',
              opacity: stateSummaryLoading ? 0.5 : 1
            }}
            title="Refresh Results"
          >
            <RefreshCw size={16} className={stateSummaryLoading ? 'animate-spin' : ''} />
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
              {stateSummary.map(({ party, won, leading, total }) => {
                const shortParty = party.split(' - ')[1] || party;
                const logoUrl = getPartyLogo(shortParty);
                return (
                  <div key={party} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: PARTY_COLORS[shortParty] || PARTY_COLORS['OTHERS'],
                      flexShrink: 0
                    }} />
                    {logoUrl && (
                      <img src={logoUrl} alt={shortParty} style={{ width: '16px', height: '16px', objectFit: 'contain', borderRadius: '2px' }} />
                    )}
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t(`PARTY_${shortParty}` as any).replace('PARTY_', '')}
                    </span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {won > 0 && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', background: 'rgba(22, 163, 74, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          W: {won}
                        </span>
                      )}
                      {leading > 0 && (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', background: 'rgba(0, 0, 0, 0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                          L: {leading}
                        </span>
                      )}
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', width: '24px', textAlign: 'right' }}>
                        {total}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Total Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '4px',
                paddingTop: '8px',
                borderTop: `1px dashed ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
              }}>
                <div style={{ width: '8px', height: '8px' }} /> {/* Spacer to align with party dots */}
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', flex: 1 }}>
                  {t('TOTAL' as any)}
                </span>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#16a34a' }}>
                    W: {totals.won}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    L: {totals.leading}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text-primary)', width: '24px', textAlign: 'right' }}>
                    {totals.total}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default ElectionDashboard;
