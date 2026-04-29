import React from 'react';
import { Info, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';
import { useTranslation } from '../../i18n/translations';

export const PostalLegendPanel: React.FC = () => {
  const isSidebarOpen = useMapStore(state => state.isSidebarOpen);
  const selectedPostalOffices = useMapStore(state => state.selectedPostalOffices);
  const { language } = useTranslation();
  const [isCollapsed, setIsCollapsed] = React.useState(true);

  if (!selectedPostalOffices || selectedPostalOffices.length === 0) return null;

  const validOfficesCount = selectedPostalOffices.filter(po => !po.isOutlier).length;

  return (
    <div 
      className={`glass-heavy postal-legend-panel ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'} ${isCollapsed ? 'collapsed' : ''}`}
      style={{ zIndex: 1001, pointerEvents: 'auto' }}
    >
      <div 
        className="legend-header" 
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', width: '100%' }}
      >
        <MapPin size={14} className="legend-icon" />
        <span className="legend-title" style={{ flex: 1, marginRight: '12px' }}>
          {language === 'ta' ? 'அஞ்சல் அலுவலகக் குறிப்புகள்' : 'Post Office Legend'}
        </span>
        <div style={{ display: 'flex', color: '#f59e0b' }}>
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="legend-items">
        <div className="legend-item">
          <div className="legend-swatch" style={{ background: '#3b82f6' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          </div>
          <span className="legend-label">{language === 'ta' ? 'தலைமை அஞ்சலகம் (HO)' : 'Main Post Office (HO)'}</span>
        </div>
        
        <div className="legend-item">
          <div className="legend-swatch" style={{ background: '#10b981' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          </div>
          <span className="legend-label">{language === 'ta' ? 'விநியோகம் உண்டு' : 'Delivery Available'}</span>
        </div>

        <div className="legend-item">
          <div className="legend-swatch" style={{ background: '#f59e0b' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          </div>
          <span className="legend-label">{language === 'ta' ? 'கவுண்டர் சேவைகள் மட்டும்' : 'Counter Services Only'}</span>
        </div>
      </div>
      
          <div className="legend-footer">
            <Info size={12} />
            {validOfficesCount} {language === 'ta' ? 'அலுவலகங்கள் இந்தப் பகுதியில் உள்ளன' : 'offices in this area'}
          </div>
        </>
      )}
    </div>
  );
};
