import React from 'react';
import { motion } from 'framer-motion';

const MapSkeleton: React.FC = () => {
  return (
    <div className="skeleton-container">
      {/* Sidebar Skeleton */}
      <div className="skeleton-sidebar glass">
        <div className="skeleton-logo-group">
          <img src="/branding/icon.png" className="skeleton-logo" alt="NammaMap Logo" />
          <div className="skeleton-text-short pulse" />
        </div>
        <div className="skeleton-nav">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-nav-item pulse" />
          ))}
        </div>
        <div className="skeleton-footer">
          <div className="skeleton-nav-item pulse" />
          <div className="skeleton-nav-item pulse" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="skeleton-main">
        {/* Search Bar Skeleton */}
        <div className="skeleton-search-bar glass pulse" />

        {/* Map Placeholder */}
        <div className="skeleton-map">
          <div className="skeleton-map-grid" />
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="skeleton-engine-text"
          >
            Initializing Map Engine...
          </motion.div>
        </div>

        {/* Floating Controls Placeholder */}
        <div className="skeleton-controls">
          <div className="skeleton-fab pulse" />
        </div>
      </div>

      <style>{`
        .skeleton-container {
          display: flex;
          width: 100%;
          height: 100dvh;
          background: var(--bg-main);
          overflow: hidden;
        }

        .skeleton-sidebar {
          width: 280px;
          height: 100%;
          border-right: 1px solid var(--border);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 30px;
          z-index: 10;
        }

        @media (max-width: 768px) {
          .skeleton-sidebar {
            display: none;
          }
        }

        .skeleton-logo-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .skeleton-logo {
          width: 32px;
          height: 32px;
          border-radius: 8px;
        }

        .skeleton-text-short {
          width: 100px;
          height: 20px;
          border-radius: 4px;
          background: var(--bg-card);
        }

        .skeleton-nav {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .skeleton-nav-item {
          height: 44px;
          border-radius: 10px;
          background: var(--bg-card);
          opacity: 0.6;
        }

        .skeleton-footer {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-main {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .skeleton-search-bar {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 500px;
          height: 56px;
          border-radius: 28px;
          background: var(--bg-card);
          z-index: 20;
          border: 1px solid var(--border);
        }

        .skeleton-map {
          flex: 1;
          background: var(--bg-main);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .skeleton-map-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 50px 50px;
          opacity: 0.2;
        }

        .skeleton-engine-text {
          font-family: inherit;
          font-weight: 500;
          color: var(--text-secondary);
          background: var(--bg-card);
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid var(--border);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .skeleton-controls {
          position: absolute;
          bottom: 30px;
          right: 20px;
        }

        .skeleton-fab {
          width: 50px;
          height: 50px;
          border-radius: 25px;
          background: var(--bg-card);
          border: 1px solid var(--border);
        }

        .pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default MapSkeleton;
