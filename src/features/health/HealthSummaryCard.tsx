import React from 'react';
import type { HealthSummary } from '../../types/gis';
import { 
  Activity, 
  MapPin, 
  Building2, 
  Filter,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useMapStore } from '../../store/useMapStore';

interface HealthSummaryCardProps {
  summary: HealthSummary;
  onClearFilters?: () => void;
}

import { useTranslation } from '../../i18n/translations';

export const HealthSummaryCard: React.FC<HealthSummaryCardProps> = ({ summary, onClearFilters }) => {
  const { t } = useTranslation();
  
  const getGuidance = () => {
    const activeFilters = summary.activeFilters;
    const hasEmergency = activeFilters.some(f => ['isFru', 'hasStemiHub', 'hasStemiSpoke'].includes(f));
    const hasDelivery = activeFilters.includes('hasDelivery');
    const hasChildCare = activeFilters.some(f => ['hasSncu', 'hasNbsu', 'hasDeic'].includes(f));
    const hasDiagnostics = activeFilters.some(f => ['hasCt', 'hasMri', 'hasDialysis'].includes(f));
    const isStatewide = summary.scope === 'STATE';

    let specificCopy = '';
    if (hasEmergency) specificCopy = t('EMERGENCY_HUBS_SHOWING');
    else if (hasDelivery) specificCopy = t('MATERNAL_DELIVERY_SHOWING');
    else if (hasChildCare) specificCopy = t('NEWBORN_CHILD_CARE_SHOWING');
    else if (hasDiagnostics) specificCopy = t('DIAGNOSTIC_CENTRES_SHOWING');

    if (isStatewide && (activeFilters.includes('PHC') || activeFilters.includes('HSC'))) {
      return {
        title: t('LOCAL_CENTRES_FOCUSED'),
        label: t('ACTION_REQUIRED'),
        copy: t('LOCAL_CENTRES_VISIBILITY'),
        nextStep: t('SEARCH_DISTRICT_LOCAL')
      };
    }

    switch (summary.scope) {
      case 'STATE':
        let title = t('ALL_HEALTH_FACILITIES');
        let copy = specificCopy || t('ALL_FACILITIES_STATEWIDE');
        
        const hasMajor = summary.activeFilters.includes('MCH') || summary.activeFilters.includes('DH');
        const hasSecondary = summary.activeFilters.includes('CHC') || summary.activeFilters.includes('SDH');
        const hasLocal = summary.activeFilters.includes('PHC') || summary.activeFilters.includes('HSC');

        if (hasLocal && !hasMajor && !hasSecondary) {
          title = t('LOCAL_HEALTH_SERVICES');
          copy = t('LOCAL_CENTRES_VISIBILITY');
        } else if (hasSecondary && !hasMajor && !hasLocal) {
          title = t('SECONDARY_CARE_FACILITIES');
          copy = t('SECONDARY_CARE_STATEWIDE');
        } else if (hasMajor && !hasSecondary && !hasLocal) {
          title = t('TN_MAJOR_HOSPITALS');
          copy = t('MAJOR_HOSPITALS_STATEWIDE');
        }

        return {
          title,
          label: t('STATEWIDE_VIEW_LABEL'),
          copy,
          nextStep: t('SEARCH_DISTRICT_AREA_LOCAL')
        };
      case 'DISTRICT':
        return {
          title: `${t('HEALTH_FACILITIES_IN')} ${summary.name}`,
          label: t('DISTRICT_VIEW_LABEL'),
          copy: specificCopy || t('HEALTH_INFRA_DISTRICT'),
          nextStep: t('CLICK_MAP_DETAILS')
        };
      case 'PINCODE':
        return {
          title: t('LOCAL_HEALTH_SERVICES'),
          label: t('LOCAL_VIEW_LABEL'),
          copy: specificCopy || t('FACILITIES_NEAR_AREA'),
          nextStep: t('TAP_NAV_TIMING')
        };
      default:
        return { title: summary.name, label: t('STATUS'), copy: '', nextStep: '' };
    }
  };

  const guidance = getGuidance();

  const filterLabelMap: Record<string, string> = {
    isFru: t('FIRST_REFERRAL_UNIT'),
    hasDelivery: t('DELIVERY_SERVICES'),
    is24x7: t('EMERGENCY_24X7'),
    hasSncu: t('NEWBORN_CARE'),
    hasDialysis: t('DIALYSIS_CENTER'),
    hasBloodBank: t('BLOOD_BANK'),
    hasCt: t('CT_SCAN'),
    hasMri: t('MRI'),
    hasStemiHub: t('STEMI_HUB'),
    hasStemiSpoke: t('STEMI_SPOKE'),
    hasDeic: t('CHILD_SUPPORT'),
    hasNbsu: t('NEWBORN_CARE'),
    isHwc: t('WELLNESS_CENTRE')
  };
  const facilityTypes = Object.entries(summary.countsByType)
    .sort((a, b) => b[1] - a[1]);

  const setTriggerLocateMe = useMapStore(state => state.setTriggerLocateMe);

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <motion.div
      initial={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, x: 50, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="glass result-card health-summary-card"
      style={{ padding: '24px' }}
    >
      <div className="flex-col gap-4" style={{ 
        overflowY: 'auto', 
        flex: 1, 
        minHeight: 0,
        padding: isMobile ? '0 4px' : '0' // Add slight padding for scrollbar
      }}>
        <div className="flex items-start justify-between" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div className="flex flex-col">
            <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ padding: '6px', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '8px', display: 'flex' }}>
                <Activity size={16} color="var(--accent)" />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                {guidance.label}
              </span>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '4px' }}>
              {guidance.title}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '240px', marginBottom: '8px' }}>
              {guidance.copy}
            </p>
            <div style={{ 
              fontSize: '11px', 
              fontWeight: 700, 
              color: 'var(--accent)', 
              background: 'rgba(14, 165, 233, 0.05)', 
              padding: '8px 12px', 
              borderRadius: '8px',
              borderLeft: '3px solid var(--accent)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ChevronRight size={14} />
              {guidance.nextStep}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>{summary.total}</div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('FACILITIES')}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {facilityTypes.map(([type, count]) => (
            <div key={type || 'unknown'} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '10px 12px', 
              background: 'rgba(255, 255, 255, 0.03)', 
              borderRadius: '10px',
              border: '1px solid var(--border-glass)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>{type}</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{count}</span>
            </div>
          ))}
        </div>

        {summary.countsByCapability && Object.values(summary.countsByCapability).some(v => v > 0) && (
          <div style={{ 
            marginBottom: '16px', 
            padding: '16px', 
            background: 'rgba(14, 165, 233, 0.03)', 
            borderRadius: '16px',
            border: '1px solid rgba(14, 165, 233, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', marginBottom: '12px' }}>
              <CheckCircle2 size={14} />
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>{t('HIGHLIGHTS')}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {Object.entries(summary.countsByCapability)
                .filter(([_, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([key, count], index) => {
                  const labelMap: Record<string, string> = {
                    hwc: t('WELLNESS_CENTRE'),
                    delivery: t('DELIVERY_POINTS'),
                    fru: t('FIRST_REFERRAL_UNIT'),
                    t24x7: t('EMERGENCY_24X7'),
                    blood_bank: t('BLOOD_BANK'),
                    blood_stor: t('BLOOD_STORAGE'),
                    sncu: t('NEWBORN_CARE'),
                    nbsu: t('NEWBORN_CARE'),
                    deic: t('CHILD_SUPPORT'),
                    ct: t('CT_SCAN'),
                    mri: t('MRI'),
                    dialysis: t('DIALYSIS_UNITS'),
                    cbnaat: t('CBNAAT'),
                    tele: t('TELE_CONSULTATION'),
                    stemi_hub: t('STEMI_HUB'),
                    stemi_spoke: t('STEMI_SPOKE'),
                    cath_lab: t('CATH_LAB')
                  };
                  return (
                    <div key={key || index} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>{labelMap[key] || key}</span>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{count}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {summary.activeFilters.length > 0 && (
          <div style={{ padding: '12px 0', borderTop: '1px solid var(--border-glass)', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <Filter size={12} />
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>{t('ACTIVE_FILTERS')}</span>
              </div>
              {onClearFilters && (
                <button 
                  onClick={onClearFilters}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {t('CLEAR_ALL')}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {summary.activeFilters.map((filter, i) => (
                <div key={filter || i} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  padding: '4px 8px', 
                  background: 'rgba(14, 165, 233, 0.1)', 
                  color: 'var(--accent)', 
                  borderRadius: '6px', 
                  fontSize: '10px', 
                  fontWeight: 700 
                }}>
                  <CheckCircle2 size={10} />
                  <span>{filterLabelMap[filter] || filter.replace('is', '').replace('has', '')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.scope === 'STATE' && (summary.activeFilters.includes('PHC') || summary.activeFilters.includes('HSC')) && (
          <div style={{
            marginTop: '8px',
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(14, 165, 233, 0.05))',
            borderRadius: '16px',
            border: '1px dashed var(--accent)',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
              {t('WANT_LOCAL_HEALTH')}
            </p>
            <button 
              onClick={() => setTriggerLocateMe(true)}
              className="btn-primary" 
              style={{ width: '100%', padding: '10px', fontSize: '12px' }}
            >
              <MapPin size={14} />
              {t('FIND_FACILITIES_NEAR_ME')}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={12} />
            <span style={{ fontSize: '10px', fontWeight: 600 }}>{summary.district || t('STATEWIDE')}</span>
          </div>
          {summary.pincode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={12} />
              <span style={{ fontSize: '10px', fontWeight: 600 }}>{t('CAT_PINCODE')} {summary.pincode}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
