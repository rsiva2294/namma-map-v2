import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UpdateNotificationProps {
  show: boolean;
  onRefresh: () => void;
  onClose: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ show, onRefresh, onClose }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0, x: '-50%' }}
          animate={{ y: 0, opacity: 1, x: '-50%' }}
          exit={{ y: 100, opacity: 0, x: '-50%' }}
          className="update-notification glass"
        >
          <div className="update-content">
            <div className="update-icon-wrapper">
              <RefreshCw size={18} className="spin-slow" color="var(--accent)" />
            </div>
            <div className="update-text-group">
              <p className="update-title">Update Available</p>
              <p className="update-desc">A newer version is ready with improvements.</p>
            </div>
          </div>
          
          <div className="update-actions">
            <button onClick={onRefresh} className="update-btn-refresh">
              REFRESH NOW
            </button>
            <button onClick={onClose} className="update-btn-close">
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateNotification;
