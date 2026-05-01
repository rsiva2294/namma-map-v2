import React from 'react';

const MapSkeleton: React.FC = () => {
  return (
    <div className="skeleton-container">
      {/* Sidebar Skeleton */}
      <div className="skeleton-sidebar">
        <div className="skeleton-logo-group">
          <img src="/branding/icon.png" className="skeleton-logo" alt="Logo" />
          <div className="skeleton-text-short pulse" />
        </div>
        <div className="skeleton-nav">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-nav-item pulse" />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="skeleton-main">
        {/* Search Bar Skeleton */}
        <div className="skeleton-search-bar pulse" />

        {/* Map Placeholder */}
        <div className="skeleton-map">
          <div className="skeleton-map-grid" />
          <div className="skeleton-engine-text">
            Initializing...
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapSkeleton;
