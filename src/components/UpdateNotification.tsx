import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { formatVersion } from '../utils/version';

interface UpdateNotificationProps {
  show: boolean;
  onRefresh: () => void;
  onClose: () => void;
  isUpdating?: boolean;
  currentVersion?: string;
  availableVersion?: string;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ 
  show, 
  onRefresh, 
  onClose,
  isUpdating = false,
  currentVersion,
  availableVersion
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0, x: '-50%' }}
          animate={{ y: 0, opacity: 1, x: '-50%' }}
          exit={{ y: 100, opacity: 0, x: '-50%' }}
          className={`update-notification glass ${isUpdating ? 'updating' : ''}`}
        >
          <div className="update-content">
            <div className="update-icon-wrapper">
              <RefreshCw size={18} className="spin-slow" color="var(--accent)" />
            </div>
            <div className="update-text-group">
              <p className="update-title">
                {isUpdating ? 'Updating System...' : 'Update Available'}
              </p>
              <p className="update-desc">
                {isUpdating 
                  ? 'Please wait while we prepare the new version.' 
                  : 'A newer version is ready with improvements.'}
              </p>
              {(currentVersion || availableVersion) && (
                <div className="update-version-tag">
                  <span className="v-label">v{formatVersion(currentVersion)}</span>
                  <span className="v-arrow">→</span>
                  <span className="v-label highlight">v{formatVersion(availableVersion)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="update-actions">
            {!isUpdating ? (
              <>
                <button onClick={onRefresh} className="update-btn-refresh">
                  REFRESH NOW
                </button>
                <button onClick={onClose} className="update-btn-close">
                  <X size={16} />
                </button>
              </>
            ) : (
              <div className="update-loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateNotification;
