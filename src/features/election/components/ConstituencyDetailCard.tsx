import React from 'react';
import { motion } from 'framer-motion';
import { useConstituencyDetail } from '../../../hooks/useConstituencyDetail';
import { useMapStore } from '../../../store/useMapStore';
import { Activity, AlertCircle, Trophy, User } from 'lucide-react';
import { PARTY_COLORS } from '../../../types/gis';

interface ConstituencyDetailCardProps {
  constituencyId: number;
  constituencyName: string;
}

export const ConstituencyDetailCard: React.FC<ConstituencyDetailCardProps> = ({ 
  constituencyId,
  constituencyName
}) => {
  const { data, loading, error } = useConstituencyDetail(constituencyId);
  const theme = useMapStore(state => state.theme);

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  if (loading && !data) {
    return (
      <div style={{
        background: bgColor,
        padding: '24px',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        marginTop: '12px'
      }}>
        <Activity className="animate-pulse" size={24} color="#6366f1" />
        <span style={{ color: subTextColor, fontSize: '0.9rem' }}>Loading candidates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: bgColor,
        padding: '16px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        border: `1px solid #ef4444`,
        marginTop: '12px'
      }}>
        <AlertCircle size={20} color="#ef4444" />
        <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</span>
      </div>
    );
  }

  if (!data || !data.candidates || data.candidates.length === 0) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: bgColor,
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        marginTop: '12px',
        overflow: 'hidden',
        border: `1px solid ${borderColor}`
      }}
    >
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: `1px solid ${borderColor}`,
        background: isDark ? '#0f172a' : '#f8fafc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h4 style={{ margin: 0, color: textColor, fontSize: '1rem', fontWeight: 600 }}>
          {constituencyName} Candidates
        </h4>
        <span style={{ fontSize: '0.75rem', color: subTextColor }}>
          Live Results
        </span>
      </div>

      <div style={{ padding: '8px' }}>
        {data.candidates.slice(0, 5).map((candidate: any, idx: number) => {
          const isWinnerOrLeading = candidate.status === 'Won' || candidate.status === 'Leading';
          const partyColor = PARTY_COLORS[candidate.party] || '#94a3b8';
          
          return (
            <div 
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                margin: '4px',
                borderRadius: '8px',
                background: isWinnerOrLeading ? (isDark ? '#1e293b' : '#f8fafc') : 'transparent',
                border: isWinnerOrLeading ? `1px solid ${partyColor}40` : `1px solid transparent`,
                gap: '12px'
              }}
            >
              <div style={{
                width: '4px',
                height: '32px',
                background: partyColor,
                borderRadius: '4px'
              }} />
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isWinnerOrLeading ? (
                    <Trophy size={14} color={partyColor} />
                  ) : (
                    <User size={14} color={subTextColor} />
                  )}
                  <span style={{ 
                    fontWeight: isWinnerOrLeading ? 700 : 500, 
                    color: textColor,
                    fontSize: '0.95rem'
                  }}>
                    {candidate.name}
                  </span>
                </div>
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: subTextColor,
                  marginTop: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{
                    background: `${partyColor}20`,
                    color: partyColor,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    fontSize: '0.7rem'
                  }}>
                    {candidate.party}
                  </span>
                  <span>•</span>
                  <span>{candidate.status}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  fontWeight: 700, 
                  color: textColor,
                  fontSize: '1.05rem',
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {candidate.votes.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.7rem', color: subTextColor }}>
                  votes
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
