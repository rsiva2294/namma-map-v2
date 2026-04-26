import React from 'react';
import { Landmark, MapPin, Building2, LayoutGrid, Info, ChevronRight, Phone, Globe } from 'lucide-react';
import { useMapStore } from '../../../store/useMapStore';
import type { LocalBodyV2Feature } from '../../../types/gis_v2';

interface LocalBodyV2CardProps {
  feature: LocalBodyV2Feature;
}

export const LocalBodyV2Card: React.FC<LocalBodyV2CardProps> = ({ feature }) => {
  const { theme } = useMapStore();
  const { name, type, district, block, taluk, category, pincode } = feature.properties;

  const typeLabels: Record<string, string> = {
    CORPORATION: 'Municipal Corporation',
    MUNICIPALITY: 'Municipality',
    TOWN_PANCHAYAT: 'Town Panchayat',
    VILLAGE_PANCHAYAT: 'Village Panchayat',
    UNKNOWN_LOCAL_BODY: 'Local Body'
  };

  const typeColors: Record<string, string> = {
    CORPORATION: '#6366f1', // Indigo
    MUNICIPALITY: '#8b5cf6', // Violet
    TOWN_PANCHAYAT: '#ec4899', // Pink
    VILLAGE_PANCHAYAT: '#10b981', // Emerald
    UNKNOWN_LOCAL_BODY: '#94a3b8' // Slate
  };

  const details = [
    { label: 'District', value: district, icon: MapPin },
    { label: 'Taluk', value: taluk, icon: Building2 },
    { label: 'Block', value: block, icon: LayoutGrid },
    { label: 'Category', value: category, icon: Info },
    { label: 'Pincode', value: pincode, icon: MapPin },
  ].filter(d => d.value);

  return (
    <div className={`local-body-v2-card ${theme}`} style={{
      background: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Header with Type Badge */}
      <div style={{
        padding: '20px',
        background: `linear-gradient(135deg, ${typeColors[type]}15, ${typeColors[type]}05)`,
        borderBottom: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
        position: 'relative'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 10px',
          borderRadius: '20px',
          background: typeColors[type],
          color: '#ffffff',
          fontSize: '0.7rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '10px'
        }}>
          <Landmark size={12} style={{ marginRight: '6px' }} />
          {typeLabels[type]}
        </div>
        
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          color: theme === 'dark' ? '#f8fafc' : '#1e293b',
          margin: 0,
          lineHeight: 1.2
        }}>
          {name}
        </h2>
      </div>

      {/* Details Grid */}
      <div style={{ padding: '20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px'
        }}>
          {details.map((detail, idx) => (
            <div key={idx} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: theme === 'dark' ? '#94a3b8' : '#64748b',
                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.025em'
              }}>
                <detail.icon size={12} />
                {detail.label}
              </div>
              <div style={{
                color: theme === 'dark' ? '#f1f5f9' : '#334155',
                fontSize: '0.875rem',
                fontWeight: 600
              }}>
                {detail.value}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{
          marginTop: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <button style={{
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            background: typeColors[type],
            color: '#ffffff',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}>
            Explore Services
            <ChevronRight size={16} />
          </button>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px'
          }}>
            <button style={{
              padding: '10px',
              borderRadius: '10px',
              background: theme === 'dark' ? '#334155' : '#f1f5f9',
              color: theme === 'dark' ? '#f8fafc' : '#1e293b',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}>
              <Globe size={14} />
              Website
            </button>
            <button style={{
              padding: '10px',
              borderRadius: '10px',
              background: theme === 'dark' ? '#334155' : '#f1f5f9',
              color: theme === 'dark' ? '#f8fafc' : '#1e293b',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}>
              <Phone size={14} />
              Contact
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div style={{
        padding: '12px 20px',
        background: theme === 'dark' ? '#0f172a' : '#f8fafc',
        fontSize: '0.65rem',
        color: theme === 'dark' ? '#64748b' : '#94a3b8',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <Landmark size={10} />
        NammaMap Unified Discovery &bull; Data Source: GIS TN
      </div>
    </div>
  );
};
