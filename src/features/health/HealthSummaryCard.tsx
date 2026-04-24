import React from 'react';
import type { HealthSummary } from '../../types/gis';
import { 
  Activity, 
  MapPin, 
  Building2, 
  Filter,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useMapStore } from '../../store/useMapStore';

interface HealthSummaryCardProps {
  summary: HealthSummary;
  onClearFilters?: () => void;
}

export const HealthSummaryCard: React.FC<HealthSummaryCardProps> = ({ summary, onClearFilters }) => {
  const getGuidance = () => {
    const activeFilters = summary.activeFilters;
    const hasEmergency = activeFilters.some(f => ['isFru', 'hasStemiHub', 'hasStemiSpoke'].includes(f));
    const hasDelivery = activeFilters.includes('hasDelivery');
    const hasChildCare = activeFilters.some(f => ['hasSncu', 'hasNbsu', 'hasDeic'].includes(f));
    const hasDiagnostics = activeFilters.some(f => ['hasCt', 'hasMri', 'hasDialysis'].includes(f));
    const isStatewide = summary.scope === 'STATE';

    let specificCopy = '';
    if (hasEmergency) specificCopy = 'Showing 24x7 Emergency Hubs and First Referral Units.';
    else if (hasDelivery) specificCopy = 'Showing facilities equipped for maternal delivery services.';
    else if (hasChildCare) specificCopy = 'Showing specialized newborn and child care centres.';
    else if (hasDiagnostics) specificCopy = 'Showing advanced diagnostic centres (CT/MRI/Dialysis).';

    if (isStatewide && (activeFilters.includes('PHC') || activeFilters.includes('HSC'))) {
      return {
        title: 'Local Centres Focused',
        label: 'Action Required',
        copy: 'Local Centres (PHC/HSC) are visible when viewing a specific District or Pincode. Search for an area to see local results.'
      };
    }

    switch (summary.scope) {
      case 'STATE':
        return {
          title: 'Major Hospitals Across Tamil Nadu',
          label: 'Statewide View',
          copy: specificCopy || 'Showing major hospitals across the state. Search a district or area to find local centres.'
        };
      case 'DISTRICT':
        return {
          title: `Health Facilities in ${summary.name}`,
          label: 'District View',
          copy: specificCopy || 'Use the shortcuts above to quickly find specific services in this district.'
        };
      case 'PINCODE':
        return {
          title: 'Facilities in Your Local Area',
          label: 'Local View',
          copy: specificCopy || 'Tap a marker to view details, timing, and get directions.'
        };
      default:
        return { title: summary.name, label: 'Summary', copy: '' };
    }
  };

  const guidance = getGuidance();

  const filterLabelMap: Record<string, string> = {
    isFru: 'Emergency (FRU)',
    hasDelivery: 'Delivery Services',
    is24x7: '24x7 Emergency',
    hasSncu: 'Newborn Care (SNCU)',
    hasDialysis: 'Dialysis Center',
    hasBloodBank: 'Blood Bank',
    hasCt: 'CT Scan',
    hasMri: 'MRI',
    hasStemiHub: 'STEMI Hub',
    hasStemiSpoke: 'STEMI Spoke',
    hasDeic: 'Child Care (DEIC)',
    hasNbsu: 'Newborn Stab. (NBSU)',
    isHwc: 'Wellness Centre'
  };
  const facilityTypes = Object.entries(summary.countsByType)
    .sort((a, b) => b[1] - a[1]);

  const setTriggerLocateMe = useMapStore(state => state.setTriggerLocateMe);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      className="glass result-card health-summary-card"
      style={{ padding: '24px' }}
    >
      <div className="flex-col gap-4">
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
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '240px', marginBottom: '16px' }}>
              {guidance.copy}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>{summary.total}</div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Facilities</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {facilityTypes.map(([type, count]) => (
            <div key={type} style={{ 
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
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Top Services Available</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {Object.entries(summary.countsByCapability)
                .filter(([_, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([key, count]) => {
                  const labelMap: Record<string, string> = {
                    hwc: 'Wellness Centres',
                    delivery: 'Delivery Points',
                    fru: 'FRU Units',
                    t24x7: '24x7 Emergency',
                    blood_bank: 'Blood Banks',
                    blood_stor: 'Blood Storage',
                    sncu: 'Newborn Care',
                    nbsu: 'NBSU Units',
                    deic: 'DEIC Centres',
                    ct: 'CT Scans',
                    mri: 'MRIs',
                    dialysis: 'Dialysis Units',
                    cbnaat: 'CBNAAT Sites',
                    tele: 'Tele-Consultation',
                    stemi_hub: 'STEMI Hubs',
                    stemi_spoke: 'STEMI Spokes',
                    cath_lab: 'Cath Labs'
                  };
                  return (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Active Filters</span>
              </div>
              {onClearFilters && (
                <button 
                  onClick={onClearFilters}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Clear All
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {summary.activeFilters.map(filter => (
                <div key={filter} style={{ 
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
              Want to see local health centres?
            </p>
            <button 
              onClick={() => setTriggerLocateMe(true)}
              className="btn-primary" 
              style={{ width: '100%', padding: '10px', fontSize: '12px' }}
            >
              <MapPin size={14} />
              Find Facilities Near Me
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={12} />
            <span style={{ fontSize: '10px', fontWeight: 600 }}>{summary.district || 'Statewide'}</span>
          </div>
          {summary.pincode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={12} />
              <span style={{ fontSize: '10px', fontWeight: 600 }}>PIN {summary.pincode}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
