import React, { useState } from 'react';
import { useMapStore } from '../../store/useMapStore';
import type { HealthFilters, HealthScope } from '../../types/gis';
import { ChevronDown, ChevronRight, Activity, Stethoscope, Beaker, Globe, Navigation, Search } from 'lucide-react';

interface HealthFiltersPanelProps {
  onFilterChange: (filters: HealthFilters) => void;
}

export const HealthFiltersPanel: React.FC<HealthFiltersPanelProps> = ({ onFilterChange }) => {
  const { 
    healthFilters, 
    healthScope,
    setHealthScope,
    activeDistrict,
    setTriggerLocateMe,
    theme
  } = useMapStore();

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['care']));
  const [revealStage, setRevealStage] = useState(0); // 0: Basic, 1: Services, 2: Expert

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

  const handleToggleGroup = (groupTypes: string[]) => {
    const allActive = groupTypes.every(t => healthFilters.facilityTypes.includes(t));
    let newTypes = [...healthFilters.facilityTypes];
    
    if (allActive) {
      newTypes = newTypes.filter(t => !groupTypes.includes(t));
    } else {
      groupTypes.forEach(t => {
        if (!newTypes.includes(t)) newTypes.push(t);
      });
    }
    onFilterChange({ ...healthFilters, facilityTypes: newTypes });
  };

  const isDark = theme === 'dark';

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

  const handleScopeChange = (scope: HealthScope) => {
    if (scope === 'PINCODE') {
      setTriggerLocateMe(true);
    } else {
      setHealthScope(scope);
    }
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
      
      {/* Scope Switcher */}
      <div style={{ padding: '8px 12px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: '4px', 
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
          padding: '4px',
          borderRadius: '12px'
        }}>
          {[
            { id: 'STATE', label: 'Statewide', icon: Globe },
            { id: 'DISTRICT', label: 'District', icon: Search },
            { id: 'PINCODE', label: 'My Area', icon: Navigation }
          ].map(scope => {
            const isActive = healthScope === scope.id || (scope.id === 'PINCODE' && healthScope === 'PINCODE');
            const Icon = scope.icon;
            return (
              <button
                key={scope.id}
                onClick={() => handleScopeChange(scope.id as HealthScope)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 4px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? (isDark ? 'rgba(255,255,255,0.1)' : '#fff') : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                <span style={{ fontSize: '10px', fontWeight: isActive ? 700 : 600 }}>{scope.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Assistant Section */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            Health Assistant
          </label>
          <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700 }}>
            {healthScope === 'STATE' ? 'Tamil Nadu Health Services' : (activeDistrict ? `Health in ${activeDistrict}` : 'Explore Local Health')}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Choose a need or search your district / pincode to begin.
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
                  fontSize: '11px',
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
      </div>

      <div style={{ height: '1px', background: 'var(--border-glass)', margin: '0 16px' }} />

      {/* Facility Levels */}
      <div style={{ padding: '8px 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Stethoscope size={14} color="var(--accent)" />
          <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
            Facility Groups
          </span>
        </div>

        {[
          { id: 'major', label: 'Major Hospitals', types: ['MCH', 'DH'], icon: '🏢' },
          { id: 'secondary', label: 'Secondary Care', types: ['SDH', 'CHC'], icon: '🏥' },
          { id: 'local', label: 'Local Centres', types: ['PHC', 'HSC'], icon: '📍' }
        ].map(group => {
          const isActive = group.types.every(t => healthFilters.facilityTypes.includes(t));
          return (
            <button
              key={group.id}
              onClick={() => handleToggleGroup(group.types)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '10px',
                background: isActive ? 'rgba(14, 165, 233, 0.05)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--accent)' : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)')}`,
                color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{group.icon}</span>
                <span>{group.label}</span>
              </div>
              {isActive && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }} />}
            </button>
          );
        })}

        {revealStage === 0 && (
          <button
            onClick={() => setRevealStage(1)}
            style={{
              padding: '12px',
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
            Show More Filters
          </button>
        )}
      </div>

      {revealStage >= 1 && (
        <>
          <div style={{ height: '1px', background: 'var(--border-glass)', margin: '0 16px' }} />
          
          {/* Group: Services */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FilterHeader id="services" label="Common Services" icon={Activity} />
            {expandedGroups.has('services') && (
              <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { key: 'hasDelivery', label: 'Delivery Services', color: '#ec4899' },
                  { key: 'is24x7', label: '24x7 Availability', color: '#f59e0b' },
                  { key: 'hasSncu', label: 'Newborn care', color: '#0ea5e9', tech: 'SNCU' },
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
                      {cap.label} {cap.tech && <span style={{ opacity: 0.6, fontSize: '9px' }}>({cap.tech})</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {revealStage === 1 && (
            <div style={{ padding: '0 16px 16px 16px', display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setRevealStage(2)}
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--accent)',
                  background: 'transparent',
                  border: `1px dashed var(--accent)`,
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                Advanced Medical Filters
              </button>
              <button
                onClick={() => setRevealStage(0)}
                style={{
                  padding: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Hide
              </button>
            </div>
          )}
        </>
      )}

      {revealStage >= 2 && (
        <>
          {/* Group: Advanced */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FilterHeader id="advanced" label="Specialist Medical" icon={Beaker} />
            {expandedGroups.has('advanced') && (
              <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { key: 'isHwc', label: 'Wellness Centre', color: '#10b981' },
                  { key: 'isFru', label: 'Emergency Referral', color: '#be123c', tech: 'FRU' },
                  { key: 'hasBloodBank', label: 'Blood Bank', color: '#ef4444' },
                  { key: 'hasCt', label: 'CT Scan', color: '#8b5cf6' },
                  { key: 'hasMri', label: 'MRI', color: '#a78bfa' },
                  { key: 'hasTeleConsultation', label: 'Tele-Consultation', color: '#6366f1' },
                  { key: 'hasStemiHub', label: 'STEMI Hub', color: '#f43f5e' },
                  { key: 'hasCathLab', label: 'Cath Lab', color: '#fda4af' },
                  { key: 'hasDeic', label: 'Child support services', color: '#f59e0b', tech: 'DEIC' }
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
                      {cap.label} {cap.tech && <span style={{ opacity: 0.6, fontSize: '9px' }}>({cap.tech})</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Expert: Raw Facility Types */}
          <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--border-glass)' }}>
            <div style={{ padding: '16px 16px 8px 16px' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
                Specific Facility Types
              </span>
            </div>
            <div style={{ padding: '0 16px 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {['MCH', 'DH', 'SDH', 'CHC', 'PHC', 'HSC'].map(type => {
                const isActive = healthFilters.facilityTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => handleToggleType(type)}
                    style={{
                      padding: '8px',
                      fontSize: '10px',
                      fontWeight: 600,
                      borderRadius: '8px',
                      border: `1px solid ${isActive ? 'var(--accent)' : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)')}`,
                      background: isActive ? 'rgba(14, 165, 233, 0.05)' : 'transparent',
                      color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setRevealStage(0)}
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
            Hide Expert Filters
          </button>
        </>
      )}
    </div>
  );
};
