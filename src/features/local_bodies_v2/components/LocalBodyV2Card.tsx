import React from 'react';
import { motion } from 'framer-motion';
import { Building2, X, Navigation, AlertCircle, Info } from 'lucide-react';
import type { LocalBodyV2Properties } from '../../../types/gis_v2';
import { useMapStore } from '../../../store/useMapStore';

interface LocalBodyV2CardProps {
  data: LocalBodyV2Properties;
  onClose: () => void;
}

const LocalBodyV2Card: React.FC<LocalBodyV2CardProps> = ({ data, onClose }) => {
  const getLabelByType = (type: string) => {
    switch (type) {
      case 'CORPORATION': return 'City Corporation';
      case 'MUNICIPALITY': return 'Municipality';
      case 'TOWN_PANCHAYAT': return 'Town Panchayat';
      case 'VILLAGE_PANCHAYAT': return 'Village Panchayat';
      case 'OUTSIDE_BOUNDARY' as any: return 'Unknown Area';
      default: return 'Local Body';
    }
  };

  const getThemeColor = (type: string) => {
    switch (type) {
      case 'CORPORATION': return 'indigo';
      case 'MUNICIPALITY': return 'blue';
      case 'TOWN_PANCHAYAT': return 'teal';
      case 'VILLAGE_PANCHAYAT': return 'slate';
      default: return 'slate';
    }
  };

  const color = getThemeColor(data.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`v2-glass-card theme-${color}`}
    >
      <div className="card-glow" />
      
      <div className="card-header">
        <div className="header-icon">
          <Building2 size={22} />
        </div>
        <div className="header-titles">
          <span className="type-badge">{getLabelByType(data.type)}</span>
          <h2 className="main-title">{data.name}</h2>
        </div>
        <button onClick={onClose} className="close-btn">
          <X size={20} />
        </button>
      </div>

      <div className="card-content">
        {data.type === ('OUTSIDE_BOUNDARY' as any) ? (
          <div className="v2-instruction-box" style={{ background: 'rgba(239, 68, 68, 0.05)', color: 'var(--danger)' }}>
            <AlertCircle size={20} />
            <p>We couldn't identify a Corporation, Municipality, or Village Panchayat at this specific coordinate. This might be due to incomplete mapping or being in a border area.</p>
          </div>
        ) : (
          <>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">District</span>
                <span className="info-value">{data.district}</span>
              </div>
              {data.taluk && (
                <div className="info-item">
                  <span className="info-label">Taluk</span>
                  <span className="info-value">{data.taluk}</span>
                </div>
              )}
              {data.block && (
                <div className="info-item">
                  <span className="info-label">Block</span>
                  <span className="info-value">{data.block}</span>
                </div>
              )}
              {data.category && (
                <div className="info-item">
                  <span className="info-label">Status</span>
                  <span className="info-value category-pill">{data.category}</span>
                </div>
              )}
            </div>

            <div className="v2-instruction-box">
              <Info size={16} />
              <p>This information is resolved automatically based on your location. No manual layer switching is required in V2.</p>
            </div>
          </>
        )}
      </div>

      <div className="card-footer">
        <button className="v2-action-btn primary" onClick={() => {
           window.open(`https://www.google.com/maps/search/${encodeURIComponent(`${data.name} ${data.type} ${data.district}`)}`, '_blank');
        }}>
          <Navigation size={18} />
          FIND OFFICE
        </button>
        <button className="v2-action-btn secondary" onClick={() => {
           useMapStore.getState().setReportModal(true, { type: 'Local Body V2', data: data as any });
        }}>
          <AlertCircle size={18} />
          REPORT ISSUE
        </button>
      </div>
    </motion.div>
  );
};

export default LocalBodyV2Card;
