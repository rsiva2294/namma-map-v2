import React, { useState } from 'react';
import { useMapStore } from '../../store/useMapStore';
import type { HealthFilters } from '../../types/gis';
import { ChevronDown, ChevronRight, Activity, Stethoscope, Beaker } from 'lucide-react';

interface HealthFiltersPanelProps {
  onFilterChange: (filters: HealthFilters) => void;
}

export const HealthFiltersPanel: React.FC<HealthFiltersPanelProps> = ({ onFilterChange }) => {
  const { 
    healthScope, 
    healthFilters, 
    theme
  } = useMapStore();

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['care']));
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleGroup = (id: string) => {
    const next = new Set(expandedGroups);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedGroups(next);
  };

  const handleToggleType = (type: string) => {
    const newTypes = healthFilters.facilityTypes.includes(type)
      ? healthFilters.facilityTypes.filter(t => t !== type)
      : [...healthFilters.facilityTypes, type];
    
    onFilterChange({ ...healthFilters, facilityTypes: newTypes });
  };

  const handleToggleFilter = (key: keyof HealthFilters) => {
    onFilterChange({ ...healthFilters, [key]: !healthFilters[key] });
  };

  const isDark = theme === 'dark';

  const typeLabels: Record<string, string> = {
    'DH': 'District Hospital (DH)',
    'SDH': 'Sub-District Hospital (SDH)',
    'MCH': 'Medical College (MCH)',
    'CHC': 'Community Health Centre (CHC)',
    'PHC': 'Primary Health Centre (PHC)',
    'HSC': 'Health Sub Centre (HSC)'
  };

  const quickServices = [
    { id: 'emergency', label: 'Emergency', icon: '🚑', keys: ['isFru', 'hasStemiHub', 'hasStemiSpoke'] },
    { id: 'delivery', label: 'Delivery', icon: '👶', keys: ['hasDelivery'] },
    { id: 'childcare', label: 'Child Care', icon: '🧸', keys: ['hasSncu', 'hasNbsu', 'hasDeic'] },
    { id: 'diagnostics', label: 'Diagnostics', icon: '🔬', keys: ['hasCt', 'hasMri', 'hasDialysis'] },
  ];

  const handleQuickService = (keys: string[]) => {
    const newFilters = { ...healthFilters };
    const allActive = keys.every(k => healthFilters[k as keyof HealthFilters]);
    keys.forEach(k => {
      (newFilters as any)[k] = !allActive;
    });
    onFilterChange(newFilters);
  };

  const FilterHeader = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
    <button
      onClick={() => toggleGroup(id)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: expandedGroups.has(id) ? 'var(--accent)' : 'var(--text-primary)',
        transition: 'all 0.2s'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Icon size={16} strokeWidth={2.5} opacity={expandedGroups.has(id) ? 1 : 0.6} />
        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
          {label}
        </span>
      </div>
      {expandedGroups.has(id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
    </button>
  );

  const hasLocalFilter = healthFilters.facilityTypes.includes('PHC') || healthFilters.facilityTypes.includes('HSC');
  const isStatewide = healthScope === 'STATE';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '8px',
      background: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
      marginTop: '8px',
      maxHeight: '85vh',
      overflowY: 'auto',
      width: '340px',
      boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.2)'
    }} className="custom-scrollbar">
      
      {/* Top Section: Quick Shortcuts (Always Visible) */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            Health Assistant
          </label>
          <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700 }}>
            Quick Service Shortcuts
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {quickServices.map(service => {
            const isActive = service.keys.every(k => healthFilters[k as keyof HealthFilters]);
            return (
              <button
                key={service.id}
                onClick={() => handleQuickService(service.keys)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '12px',
                  border: `1px solid ${isActive ? 'var(--accent)' : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)')}`,
                  background: isActive ? 'rgba(14, 165, 233, 0.1)' : (isDark ? 'rgba(30, 41, 59, 0.4)' : '#fff'),
                  color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '16px' }}>{service.icon}</span>
                {service.label}
              </button>
            );
          })}
        </div>
        {!showAdvanced && (
          <button
            onClick={() => setShowAdvanced(true)}
            style={{
              padding: '10px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--accent)',
              background: 'transparent',
              border: `1px dashed var(--accent)`,
              borderRadius: '10px',
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            Show All Filters & Legend
          </button>
        )}
      </div>

      {showAdvanced && (
        <>
          <div style={{ height: '1px', background: 'var(--border-glass)', margin: '0 16px' }} />

          {/* Group: Care Level */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FilterHeader id="care" label="Facility Level" icon={Stethoscope} />
            {expandedGroups.has('care') && (
              <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {isStatewide && hasLocalFilter && (
                  <div style={{ 
                    padding: '10px', 
                    background: 'rgba(245, 158, 11, 0.1)', 
                    borderRadius: '8px', 
                    marginBottom: '8px',
                    border: '1px solid rgba(245, 158, 11, 0.2)'
                  }}>
                    <span style={{ fontSize: '10px', color: '#d97706', fontWeight: 700 }}>
                      💡 Local centres (PHC/HSC) are hidden in Statewide view. Search for a district to see them.
                    </span>
                  </div>
                )}
                {['MCH', 'DH', 'SDH', 'CHC', 'PHC', 'HSC'].map(type => {
                  const isActive = healthFilters.facilityTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => handleToggleType(type)}
                      style={{
                        padding: '10px 12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '10px',
                        textAlign: 'left',
                        border: `1px solid ${isActive ? 'var(--accent)' : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)')}`,
                        background: isActive ? 'rgba(14, 165, 233, 0.05)' : 'transparent',
                        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{typeLabels[type]}</span>
                      {isActive && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Group: Services */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FilterHeader id="services" label="Common Services" icon={Activity} />
            {expandedGroups.has('services') && (
              <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { key: 'hasDelivery', label: 'Delivery Services', color: '#ec4899' },
                  { key: 'is24x7', label: '24x7 Availability', color: '#f59e0b' },
                  { key: 'hasSncu', label: 'Newborn Care (SNCU)', color: '#0ea5e9' },
                  { key: 'hasDialysis', label: 'Dialysis Center', color: '#c4b5fd' }
                ].map(cap => {
                  const isActive = healthFilters[cap.key as keyof HealthFilters];
                  return (
                    <button
                      key={cap.key}
                      onClick={() => handleToggleFilter(cap.key as keyof HealthFilters)}
                      style={{
                        padding: '8px 12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '20px',
                        border: `1px solid ${isActive ? cap.color : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')}`,
                        background: isActive ? `${cap.color}15` : 'transparent',
                        color: isActive ? cap.color : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {cap.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Group: Advanced */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FilterHeader id="advanced" label="Advanced Medical" icon={Beaker} />
            {expandedGroups.has('advanced') && (
              <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { key: 'isHwc', label: 'Wellness Centre', color: '#10b981' },
                  { key: 'isFru', label: 'First Referral Unit', color: '#be123c' },
                  { key: 'hasBloodBank', label: 'Blood Bank', color: '#ef4444' },
                  { key: 'hasCt', label: 'CT Scan', color: '#8b5cf6' },
                  { key: 'hasMri', label: 'MRI', color: '#a78bfa' },
                  { key: 'hasTeleConsultation', label: 'Tele-Consultation', color: '#6366f1' },
                  { key: 'hasStemiHub', label: 'STEMI Hub', color: '#f43f5e' },
                  { key: 'hasCathLab', label: 'Cath Lab', color: '#fda4af' }
                ].map(cap => {
                  const isActive = healthFilters[cap.key as keyof HealthFilters];
                  return (
                    <button
                      key={cap.key}
                      onClick={() => handleToggleFilter(cap.key as keyof HealthFilters)}
                      style={{
                        padding: '8px 12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '20px',
                        border: `1px solid ${isActive ? cap.color : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')}`,
                        background: isActive ? `${cap.color}15` : 'transparent',
                        color: isActive ? cap.color : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {cap.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowAdvanced(false)}
            style={{
              padding: '12px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Hide Advanced Filters
          </button>

          <div style={{ height: '1px', background: 'var(--border-glass)', margin: '8px 16px' }} />

          {/* Map Legend Helper */}
          <div style={{ padding: '16px', background: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(0, 0, 0, 0.02)', borderRadius: '16px', margin: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
              Map Legend
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#9d174d', border: '1px solid white' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Major Hospitals (MCH/DH)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e', border: '1px solid white' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Local Centres (PHC/CHC)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#94a3b8', border: '1px solid white' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Small Sub Centres (HSC)</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
