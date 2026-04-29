import React, { useState } from 'react';
import { useMapStore } from '../../store/useMapStore';
import type { HealthFilters, HealthScope } from '../../types/gis';
import { useTranslation } from '../../i18n/translations';
import { ChevronDown, ChevronRight, ChevronUp, Activity, Stethoscope, Beaker, Globe, Navigation, Search } from 'lucide-react';

interface HealthFiltersPanelProps {
  onFilterChange: (filters: HealthFilters) => void;
}

export const HealthFiltersPanel: React.FC<HealthFiltersPanelProps> = ({ onFilterChange }) => {
  const { 
    healthFilters, 
    healthScope,
    setHealthScope,
    activeDistrict,
    setActiveDistrict,
    setSearchResult,
    setTriggerLocateMe,
    theme
  } = useMapStore();
  const { t } = useTranslation();

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['care']));
  const [revealStage, setRevealStage] = useState(0); // 0: Basic, 1: Services, 2: Expert
  const [isMinimized, setIsMinimized] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

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
    const current = healthFilters.facilityTypes;
    const allActive = groupTypes.every(t => current.includes(t));
    
    let next: string[];
    if (allActive) {
      // Remove all
      next = current.filter(t => !groupTypes.includes(t));
    } else {
      // Add missing
      const toAdd = groupTypes.filter(t => !current.includes(t));
      next = [...current, ...toAdd];
    }
    
    onFilterChange({ ...healthFilters, facilityTypes: next });
  };

  const isDark = theme === 'dark';

  const quickServices = [
    { id: 'emergency', label: t('EMERGENCY'), icon: '🚑', keys: ['isFru', 'hasStemiHub', 'hasStemiSpoke'] },
    { id: 'delivery', label: t('DELIVERY_SERVICE'), icon: '👶', keys: ['hasDelivery'] },
    { id: 'childcare', label: t('CHILD_CARE'), icon: '🧸', keys: ['hasSncu', 'hasNbsu', 'hasDeic'] },
    { id: 'diagnostics', label: t('DIAGNOSTICS'), icon: '🔬', keys: ['hasCt', 'hasMri', 'hasDialysis'] },
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
    // Explicitly set target scope to avoid auto-switching to PINCODE when resolving location
    useMapStore.getState().setTargetHealthScope(scope);

    if (scope === 'PINCODE') {
      setTriggerLocateMe(true);
    } else if (scope === 'DISTRICT') {
      if (activeDistrict) {
        setSearchResult(null); // Clear pincode highlight/zoom
        setHealthScope('DISTRICT');
      } else {
        // Find current location to determine district
        setTriggerLocateMe(true);
      }
    } else {
      setActiveDistrict(null);
      setSearchResult(null);
      setHealthScope('STATE');
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
      maxHeight: isMinimized && isMobile ? 'unset' : '85dvh',
      overflowY: isMinimized && isMobile ? 'hidden' : 'auto',
      boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.2)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }} className="custom-scrollbar health-filters-inner">
      
      {/* Minimize Toggle (Mobile only) */}
      {isMobile && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          padding: '4px 0',
          borderBottom: isMinimized ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
          marginBottom: isMinimized ? 0 : '8px'
        }}>
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              border: 'none',
              padding: '6px 24px',
              borderRadius: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#f59e0b'
            }}
          >
            {isMinimized ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {isMinimized ? t('EXPAND_FILTERS') || 'Expand Filters' : t('MINIMIZE_FILTERS') || 'Minimize Filters'}
            </span>
          </button>
        </div>
      )}

      {(!isMinimized || !isMobile) && (
        <>
      <div style={{ padding: '8px 12px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: '6px', 
          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(2, 132, 199, 0.08)',
          padding: '4px',
          borderRadius: '14px',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(2, 132, 199, 0.12)'}`
        }}>
          {[
            { id: 'STATE', label: t('STATEWIDE'), icon: Globe },
            { id: 'DISTRICT', label: t('DISTRICT'), icon: Search },
            { id: 'PINCODE', label: t('MY_AREA'), icon: Navigation }
          ].map(scope => {
            const isActive = healthScope === scope.id || (scope.id === 'PINCODE' && healthScope === 'PINCODE');
            const Icon = scope.icon;
            return (
              <button
                key={scope.id}
                onClick={() => handleScopeChange(scope.id as HealthScope)}
                aria-pressed={isActive}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  minHeight: '64px',
                  padding: '8px 4px',
                  borderRadius: '11px',
                  border: `1px solid ${isActive ? 'rgba(255,255,255,0.7)' : 'transparent'}`,
                  background: isActive 
                    ? 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)'
                    : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.2s',
                  boxShadow: isActive 
                    ? (isDark ? '0 12px 24px rgba(14, 165, 233, 0.32)' : '0 10px 22px rgba(2, 132, 199, 0.28)')
                    : 'none',
                  transform: isActive ? 'translateY(-1px)' : 'translateY(0)'
                }}
              >
                <Icon size={isActive ? 19 : 17} strokeWidth={isActive ? 3 : 2.2} />
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: 800, 
                  lineHeight: 1.1
                }}>
                  {scope.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Assistant Section */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            {t('HEALTH_ASSISTANT')}
          </label>
          <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700 }}>
            {healthScope === 'STATE' ? t('TN_HEALTH_SERVICES') : (activeDistrict ? `${t('HEALTH_IN')} ${activeDistrict}` : t('EXPLORE_LOCAL_HEALTH'))}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {t('CHOOSE_NEED_SEARCH')}
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
            {t('FACILITY_GROUPS')}
          </span>
        </div>

        {[
          { id: 'major', label: t('MAJOR_HOSPITALS'), types: ['MCH', 'DH'], icon: '🏢' },
          { id: 'secondary', label: t('SECONDARY_CARE'), types: ['SDH', 'CHC'], icon: '🏥' },
          { id: 'local', label: t('LOCAL_CENTRES'), types: ['PHC', 'HSC'], icon: '📍', disabledIfState: true }
        ].map(group => {
          const isDisabled = group.disabledIfState && healthScope === 'STATE';
          const isActive = group.types.every(t => healthFilters.facilityTypes.includes(t)) && !isDisabled;
          
          return (
            <div key={group.id} style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  if (isDisabled) return;
                  handleToggleGroup(group.types);
                }}
                disabled={isDisabled}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '10px',
                  background: isActive ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                  border: `2px solid ${isActive ? 'var(--accent)' : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)')}`,
                  color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isActive ? '0 4px 12px rgba(14, 165, 233, 0.15)' : 'none',
                  opacity: isDisabled ? 0.5 : 1
                }}
                title={isDisabled ? t('ZOOM_IN_FOR_LOCAL') : ''}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px', filter: isActive ? 'none' : 'grayscale(1)' }}>{group.icon}</span>
                  <span style={{ fontWeight: isActive ? 800 : 600 }}>{group.label}</span>
                </div>
                <div style={{ 
                  width: '14px', 
                  height: '14px', 
                  borderRadius: '4px', // Square for checkbox
                  border: `2px solid ${isActive ? 'var(--accent)' : 'var(--text-secondary)'}`,
                  background: isActive ? 'var(--accent)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isActive ? 1 : 0.4
                }}>
                  {isActive && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
              </button>
            </div>
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
            {t('SHOW_MORE_FILTERS')}
          </button>
        )}
      </div>

      {revealStage >= 1 && (
        <>
          <div style={{ height: '1px', background: 'var(--border-glass)', margin: '0 16px' }} />
          
          {/* Group: Services */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FilterHeader id="services" label={t('COMMON_SERVICES')} icon={Activity} />
            {expandedGroups.has('services') && (
              <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { key: 'hasDelivery', label: t('DELIVERY_SERVICES'), color: '#ec4899' },
                  { key: 'is24x7', label: t('AVAILABILITY_24X7'), color: '#f59e0b' },
                  { key: 'hasSncu', label: t('NEWBORN_CARE'), color: '#0ea5e9', tech: 'SNCU' },
                  { key: 'hasDialysis', label: t('DIALYSIS_CENTER'), color: '#c4b5fd' }
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
                {t('ADVANCED_MEDICAL_FILTERS')}
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
                {t('HIDE')}
              </button>
            </div>
          )}
        </>
      )}

      {revealStage >= 2 && (
        <>
          {/* Group: Advanced */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FilterHeader id="advanced" label={t('SPECIALIST_MEDICAL')} icon={Beaker} />
            {expandedGroups.has('advanced') && (
              <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { key: 'isHwc', label: t('WELLNESS_CENTRE'), color: '#10b981' },
                  { key: 'isFru', label: t('EMERGENCY_REFERRAL'), color: '#be123c', tech: 'FRU' },
                  { key: 'hasBloodBank', label: t('BLOOD_BANK'), color: '#ef4444' },
                  { key: 'hasCt', label: t('CT_SCAN'), color: '#8b5cf6' },
                  { key: 'hasMri', label: t('MRI'), color: '#a78bfa' },
                  { key: 'hasTeleConsultation', label: t('TELE_CONSULTATION'), color: '#6366f1' },
                  { key: 'hasStemiHub', label: t('STEMI_HUB'), color: '#f43f5e' },
                  { key: 'hasCathLab', label: t('CATH_LAB'), color: '#fda4af' },
                  { key: 'hasDeic', label: t('CHILD_SUPPORT_SERVICES'), color: '#f59e0b', tech: 'DEIC' }
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
                {t('SPECIFIC_FACILITY_TYPES')}
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
                  {t(type as any)}
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
            {t('HIDE_EXPERT_FILTERS')}
          </button>
        </>
      )}
        </>
      )}
    </div>
  );
};
