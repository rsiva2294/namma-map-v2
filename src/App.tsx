import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './index.css';
import { useMapStore } from './store/useMapStore';
import Sidebar from './components/layout/Sidebar';
import SearchBar from './components/layout/SearchBar';
import ResultContainer from './components/layout/ResultContainer';
import ReportModal from './components/ReportModal';
import ErrorBoundary from './components/ErrorBoundary';
import { HealthFiltersPanel } from './features/health/HealthFiltersPanel';
import { HealthAreaPrompt } from './features/health/HealthAreaPrompt';
import LocatingOverlay from './components/LocatingOverlay';
import { useGisWorker } from './hooks/useGisWorker';
import type { HealthScope } from './types/gis';
import UpdateNotification from './components/UpdateNotification';
import { RouteManager } from './components/routing/RouteManager';

const APP_VERSION = '2026-04-25T13:43:29.163Z';

const GisMap = React.lazy(() => import('./features/map/GisMap'));

function App() {
  const theme = useMapStore(state => state.theme);
  const activeLayer = useMapStore(state => state.activeLayer);
  const setHealthScope = useMapStore(state => state.setHealthScope);
  const setHealthFilters = useMapStore(state => state.setHealthFilters);
  const activeDistrict = useMapStore(state => state.activeDistrict);
  const searchResult = useMapStore(state => state.searchResult);
  const { filterHealth } = useGisWorker();
  const [updateAvailable, setUpdateAvailable] = React.useState(false);

  // Dynamic SEO Meta Tags
  const getPageTitle = () => {
    const layerName = activeLayer === 'PINCODE' ? 'Post Offices' : 
                     activeLayer === 'PDS' ? 'Ration Shops' :
                     activeLayer === 'TNEB' ? 'Electricity Board' :
                     activeLayer === 'HEALTH' ? 'Health Facilities' :
                     activeLayer === 'POLICE' ? 'Police Jurisdictions' : 'Constituencies';
    
    if (activeDistrict) {
      return `${layerName} in ${activeDistrict} | NammaMap`;
    }
    return `NammaMap | Tamil Nadu ${layerName} Locator`;
  };

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const response = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (data.version && data.version !== APP_VERSION) {
          setUpdateAvailable(true);
        }
      } catch {
        // Silently ignore update check failures
      }
    };

    checkUpdate();
    const interval = setInterval(checkUpdate, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  return (
    <div className={`app-container ${theme}`}>
      <Helmet>
        <title>{getPageTitle()}</title>
        <meta name="description" content={`Find ${activeLayer.toLowerCase()} services across ${activeDistrict || 'Tamil Nadu'} with precision GIS mapping.`} />
      </Helmet>

      <Routes>
        <Route path="/:layer/:district?" element={<RouteManager />} />
        <Route path="/" element={<Navigate to="/pincode" replace />} />
      </Routes>

      <Sidebar />
      
      <main className="main-content">
        <ErrorBoundary>
          <Suspense fallback={<div className="loading">Loading Engine...</div>}>
            <GisMap />
          </Suspense>
        </ErrorBoundary>

        <SearchBar />
        <LocatingOverlay />
        <HealthAreaPrompt />
        <ResultContainer />
        <ReportModal />

        {activeLayer === 'HEALTH' && (
          <div className="health-filters-floating">
            <HealthFiltersPanel 
              onFilterChange={(filters) => {
                const pincode = (searchResult?.properties?.PIN_CODE || searchResult?.properties?.pincode)?.toString();
                let scope: HealthScope = 'STATE';
                if (pincode) scope = 'PINCODE';
                else if (activeDistrict) scope = 'DISTRICT';
                
                setHealthScope(scope);
                setHealthFilters(filters);
                filterHealth(scope, filters, activeDistrict, pincode || null);
              }}
            />
          </div>
        )}

        <UpdateNotification 
          show={updateAvailable} 
          onRefresh={() => window.location.reload()} 
          onClose={() => setUpdateAvailable(false)}
        />
      </main>
    </div>
  );
}

export default App;
