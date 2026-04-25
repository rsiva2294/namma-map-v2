import React from 'react';
import { Info } from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';

export const PostalLegendPanel: React.FC = () => {
  const isSidebarOpen = useMapStore(state => state.isSidebarOpen);
  const selectedPostalOffices = useMapStore(state => state.selectedPostalOffices);

  if (!selectedPostalOffices || selectedPostalOffices.length === 0) return null;

  const validOfficesCount = selectedPostalOffices.filter(po => !po.isOutlier).length;

  return (
    <div className={`glass-heavy postal-legend-panel ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="legend-header">
        <MapPin size={14} className="legend-icon" />
        <span className="legend-title">Post Office Legend</span>
      </div>

      <div className="legend-items">
        <div className="legend-item">
          <div className="legend-swatch" style={{ background: '#3b82f6' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          </div>
          <span className="legend-label">Main Post Office (HO)</span>
        </div>
        
        <div className="legend-item">
          <div className="legend-swatch" style={{ background: '#10b981' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          </div>
          <span className="legend-label">Delivery Available</span>
        </div>

        <div className="legend-item">
          <div className="legend-swatch" style={{ background: '#f59e0b' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          </div>
          <span className="legend-label">Counter Services Only</span>
        </div>
      </div>
      
      <div className="legend-footer">
        <Info size={12} />
        {validOfficesCount} offices in this area
      </div>
    </div>
  );
};

// Re-export as old name to avoid breaking imports for a moment if needed, 
// but better to update the import in GisMap.tsx
import { MapPin } from 'lucide-react';
