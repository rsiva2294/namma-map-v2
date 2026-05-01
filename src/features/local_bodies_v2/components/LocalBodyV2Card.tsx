import React from 'react';
import { Landmark, MapPin, Building2, LayoutGrid, Info } from 'lucide-react';
import { useTranslation } from '../../../i18n/translations';
import type { LocalBodyV2Feature } from '../../../types/gis_v2';

interface LocalBodyV2CardProps {
  feature: LocalBodyV2Feature;
}

export const LocalBodyV2Card: React.FC<LocalBodyV2CardProps> = ({ feature }) => {
  const { t } = useTranslation();
  const { name, type, district, block, taluk, category, pincode } = feature.properties;

  const typeColors: Record<string, string> = {
    CORPORATION: 'var(--transport-indigo)',
    MUNICIPALITY: 'var(--primary)',
    TOWN_PANCHAYAT: 'var(--health-rose)',
    VILLAGE_PANCHAYAT: '#10b981', // Keep emerald for villages
    UNKNOWN_LOCAL_BODY: 'var(--on-surface-variant)'
  };

  const details = [
    { label: t('DISTRICT'), value: district, icon: MapPin },
    { label: t('TALUK'), value: taluk, icon: Building2 },
    { label: t('BLOCK'), value: block, icon: LayoutGrid },
    { label: t('CATEGORY'), value: category, icon: Info },
    { label: t('PINCODE'), value: pincode, icon: MapPin },
  ].filter(d => d.value);

  return (
    <div className="local-body-v2-card" style={{
      background: 'var(--surface-container-low)',
      borderRadius: 'var(--rounded-xl)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-std)',
      border: '1px solid var(--outline-variant)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Header with Type Badge */}
      <div style={{
        padding: '20px',
        background: `linear-gradient(135deg, ${typeColors[type]}15, ${typeColors[type]}05)`,
        borderBottom: '1px solid var(--outline-variant)',
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
          {t(type as any)}
        </div>
        
        <h2 className="text-headline-md" style={{
          color: 'var(--on-surface)',
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
              <div className="text-label-caps" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--on-surface-variant)',
                letterSpacing: '0.025em'
              }}>
                <detail.icon size={12} />
                {detail.label}
              </div>
              <div className="text-label-std" style={{
                color: 'var(--on-surface)',
                fontWeight: 600
              }}>
                {detail.value}
              </div>
            </div>
          ))}
        </div>

      </div>
      
      {/* Footer Branding */}
      <div className="text-bilingual-subtext" style={{
        padding: '12px 20px',
        background: 'var(--surface-container-high)',
        color: 'var(--on-surface-variant)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <Landmark size={10} />
        {t('NAMMAMAP_UNIFIED')} &bull; {t('DATA_SOURCE_GIS_TN')}
      </div>
    </div>
  );
};
