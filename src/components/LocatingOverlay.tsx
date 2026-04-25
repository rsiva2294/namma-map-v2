import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Loader2 } from 'lucide-react';
import { useMapStore } from '../store/useMapStore';

const LocatingOverlay: React.FC = () => {
  const isLocating = useMapStore(state => state.isLocating);

  return (
    <AnimatePresence>
      {isLocating && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="glass-heavy locating-overlay"
        >
          <div className="locating-icon-container">
            <div className="pulse-locating" />
            <Navigation size={40} color="var(--accent)" />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h2 className="locating-text">Locating You...</h2>
            <p className="locating-subtext">
              Finding your exact area to provide local service details.
            </p>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            background: 'rgba(14, 165, 233, 0.1)',
            padding: '8px 16px',
            borderRadius: '12px',
            marginTop: '10px'
          }}>
            <Loader2 className="animate-spin" size={16} color="var(--accent)" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              GPS Active
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LocatingOverlay;
