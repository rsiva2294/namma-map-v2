import React from 'react';
import { Landmark, AlertCircle, Loader2 } from 'lucide-react';
import ResultCard from '../../components/ResultCard';
import { useMapStore } from '../../store/useMapStore';
import { useTranslation } from '../../i18n/translations';
import { translateDistrict } from '../../i18n/districts';
import { useConstituencyDetail } from '../../hooks/useConstituencyDetail';
import { PARTY_COLORS } from '../../types/gis';
import { motion } from 'framer-motion';

interface ElectionDetailViewProps {
  constituencyId: number;
  constituencyName: string;
  district?: string;
  parentPc?: string;
  pcNumber?: number;
}

export const ElectionDetailView: React.FC<ElectionDetailViewProps> = ({
  constituencyId,
  constituencyName,
  district,
  parentPc,
  pcNumber
}) => {
  const { t } = useTranslation();
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const language = useMapStore(state => state.language);
  const electionResults = useMapStore(state => state.electionResults);
  const clearSearch = useMapStore(state => state.clearSearch);
  const setIsResultMinimized = useMapStore(state => state.setIsResultMinimized);

  const { detail, isLoading, error } = useConstituencyDetail(constituencyId, constituencyName);

  // Initial summary data from global store
  const basicResult = electionResults ? electionResults[constituencyId] : null;

  const initialData = [
    ...(district ? [{ label: t('DISTRICT'), value: translateDistrict(district, language) || 'N/A' }] : []),
    ...(parentPc ? [{ label: t('CAT_CONSTITUENCY'), value: parentPc }] : []),
    ...(pcNumber ? [{ label: t('PC_NUMBER'), value: pcNumber.toString(), isPill: true }] : [])
  ];

  return (
    <>
      <ResultCard
        key={`const-card-${constituencyId}`}
        themeColor="indigo"
        title={constituencyName}
        icon={<Landmark size={20} />}
        data={initialData}
        onClose={clearSearch}
        onMinimize={() => setIsResultMinimized(true)}
        featureId={`const_${constituencyId}`}
      />

      {/* Progressive Enhancement: Detailed Results */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass detailed-election-card" 
        style={{
          marginTop: isMobile ? '-24px' : '-12px', 
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          zIndex: 1,
          padding: '20px',
          borderRadius: '20px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)'
        }}
      >
        {isLoading && !detail && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '10px', 
            padding: '20px', 
            fontSize: '13px',
            color: '#4f46e5',
            fontWeight: 700,
          }}>
            <Loader2 size={18} className="animate-spin" />
            {t('LOADING_DETAILED_RESULTS') || 'Loading detailed results...'}
          </div>
        )}

        {error && !detail && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            padding: '16px', 
            fontSize: '13px',
            color: '#ef4444',
            fontWeight: 600,
          }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {detail && (
          <>
            {/* Margin Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('LEAD_MARGIN') || 'Lead Margin'}
                </span>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#4f46e5' }}>
                  {detail.margin.toLocaleString()} {t('VOTES')}
                </span>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.8 }}>
                  {t('LAST_UPDATED') || 'Last Updated'}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {detail.lastUpdated}
                </span>
              </div>
            </div>

            {/* Candidate List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {detail.candidates.slice(0, 5).map((cand, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '6px',
                  opacity: idx === 0 ? 1 : 0.85
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ 
                        width: '5px', 
                        height: '24px', 
                        borderRadius: '2.5px', 
                        background: PARTY_COLORS[cand.party] || PARTY_COLORS['OTHERS'],
                        boxShadow: `0 0 10px ${PARTY_COLORS[cand.party] || PARTY_COLORS['OTHERS']}40`
                      }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: '1.2' }}>
                          {cand.name}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {cand.party}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-primary)' }}>
                        {cand.votes.toLocaleString()}
                      </span>
                      {cand.delta !== 0 && (
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 800, 
                          color: cand.delta > 0 ? '#10b981' : '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          {cand.delta > 0 ? '▲' : '▼'} {Math.abs(cand.delta).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Progress Bar for relative votes */}
                  <div style={{ 
                    width: '100%', 
                    height: '5px', 
                    background: 'rgba(0,0,0,0.04)', 
                    borderRadius: '2.5px',
                    overflow: 'hidden' 
                  }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(cand.votes / detail.candidates[0].votes) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{ 
                        height: '100%', 
                        background: PARTY_COLORS[cand.party] || PARTY_COLORS['OTHERS'],
                        opacity: 0.7
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </>
  );
};
