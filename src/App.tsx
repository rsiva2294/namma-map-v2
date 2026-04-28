import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './index.css';
import { useMapStore } from './store/useMapStore';
import Sidebar from './components/layout/Sidebar';
import SearchBar from './components/layout/SearchBar';
import ResultContainer from './components/layout/ResultContainer';
import ReportModal from './components/ReportModal';
import LegalModal from './components/LegalModal';
import { useTranslation } from './i18n/translations';
import ErrorBoundary from './components/ErrorBoundary';
import { HealthFiltersPanel } from './features/health/HealthFiltersPanel';
import { HealthAreaPrompt } from './features/health/HealthAreaPrompt';
import LocatingOverlay from './components/LocatingOverlay';
import { useGisWorker } from './hooks/useGisWorker';
import UpdateNotification from './components/UpdateNotification';
import { RouteManager } from './components/routing/RouteManager';
import { useRegisterSW } from 'virtual:pwa-register/react';
import MapSkeleton from './components/layout/MapSkeleton';
import SchemaData from './components/SchemaData';
import { useLocation } from 'react-router-dom';
import { trackEvent } from './lib/firebase';
import { APP_VERSION } from './constants';
import { useState } from 'react';
import TutorialGuide from './features/tutorial/TutorialGuide';


const GisMap = React.lazy(() => import('./features/map/GisMap'));

function App() {
  const { t } = useTranslation();
  const theme = useMapStore(state => state.theme);
  const activeLayer = useMapStore(state => state.activeLayer);
  const setHealthFilters = useMapStore(state => state.setHealthFilters);
  const activeDistrict = useMapStore(state => state.activeDistrict);
  const searchResult = useMapStore(state => state.searchResult);
  const language = useMapStore(state => state.language);
  const { filterHealth } = useGisWorker();
  const location = useLocation();
  const [isUpdating, setIsUpdating] = useState(false);
  const [availableVersion, setAvailableVersion] = useState<string | undefined>(undefined);
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);

  // Track Page Views
  useEffect(() => {
    trackEvent('page_view', {
      page_path: location.pathname + location.search,
      active_layer: activeLayer,
      active_district: activeDistrict || 'statewide'
    });
  }, [location, activeLayer, activeDistrict]);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every 15 minutes
      if (r) {
        setInterval(() => {
          r.update();
        }, 15 * 60 * 1000);
      }
    },
    onNeedRefresh() {
      // When PWA detects update, try to get the version from version.json
      fetch('/version.json', { cache: 'no-cache' })
        .then(res => res.json())
        .then(data => setAvailableVersion(data.version))
        .catch(() => setAvailableVersion(undefined));
    }
  });

  const handleUpdate = async () => {
    setIsUpdating(true);
    // Give the UI time to show the "Updating" state
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In dev mode or if SW is not ready, updateServiceWorker(true) might not reload.
    // We force a reload here to ensure the user sees the 'updated' state.
    updateServiceWorker(true);
    
    // Fallback reload if SW doesn't trigger it
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Proactive version polling
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch('/version.json', { cache: 'no-cache' });
        const data = await res.json();
        if (data.version && data.version !== APP_VERSION && data.version !== dismissedVersion) {
          console.log('[VersionControl] New version detected:', data.version);
          setAvailableVersion(data.version);
          setNeedRefresh(true);
        }
      } catch (err) {
        console.error('[VersionControl] Failed to poll version:', err);
      }
    };

    const interval = setInterval(checkVersion, 5 * 60 * 1000); // Check every 5 mins
    checkVersion(); // Initial check

    return () => clearInterval(interval);
  }, [setNeedRefresh]);

  // Dynamic SEO Meta Tags
  const getPageTitle = () => {
    const layerName = activeLayer === 'PINCODE' ? 'Post Offices' : 
                     activeLayer === 'PDS' ? 'Ration Shops' :
                     activeLayer === 'TNEB' ? 'Electricity Board (TNEB)' :
                     activeLayer === 'HEALTH' ? 'Health Facilities' :
                     activeLayer === 'POLICE' ? 'Police Stations' : 'Constituencies';
    
    if (searchResult) {
      const locationName = searchResult.properties.office_name || 
                          searchResult.properties.district || 
                          searchResult.properties.NAME || 
                          (searchResult.properties.pin_code || searchResult.properties.PIN_CODE);
      return `${layerName} in ${locationName} | NammaMap`;
    }

    if (activeDistrict) {
      return `${layerName} in ${activeDistrict} District | NammaMap`;
    }
    
    return `NammaMap | Tamil Nadu ${layerName} Locator`;
  };



  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  const healthScope = useMapStore(state => state.healthScope);
  const healthFilters = useMapStore(state => state.healthFilters);

  useEffect(() => {
    if (activeLayer === 'HEALTH') {
      const pincode = (searchResult?.properties?.PIN_CODE || searchResult?.properties?.pincode || searchResult?.properties?.pin_code)?.toString();
      console.log('[App] Refreshing health filters:', { healthScope, activeDistrict, pincode });
      filterHealth(healthScope, healthFilters, activeDistrict, pincode || null);
    }
  }, [activeLayer, healthScope, healthFilters, activeDistrict, searchResult, filterHealth]);

  return (
    <div className={`app-container ${theme} lang-${language}`}>
      <TutorialGuide />
      <a href="#main-content" className="skip-link">{t('SKIP_TO_RESULTS')}</a>
      <SchemaData />
      <Helmet>
        <title>{getPageTitle()}</title>
        <meta name="description" content={`Find ${activeLayer.toLowerCase()} services, police jurisdictions, and civic infrastructure across ${activeDistrict || 'Tamil Nadu'} with precision GIS mapping and global search.`} />
        <link rel="canonical" href={`https://namma-map.web.app/${activeLayer.toLowerCase()}${activeDistrict ? '/' + encodeURIComponent(activeDistrict) : ''}`} />
        
        {/* OpenGraph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://namma-map.web.app/" />
        <meta property="og:title" content={getPageTitle()} />
        <meta property="og:description" content={`Explore Tamil Nadu's civic infrastructure with NammaMap. Find ${activeLayer.toLowerCase()}, police stations, constituencies, and local bodies instantly.`} />
        <meta property="og:image" content="https://namma-map.web.app/branding/og-image.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://namma-map.web.app/" />
        <meta property="twitter:title" content={getPageTitle()} />
        <meta property="twitter:description" content={`Explore Tamil Nadu's civic infrastructure with NammaMap. Find ${activeLayer.toLowerCase()}, police stations, constituencies, and local bodies instantly.`} />
        <meta property="twitter:image" content="https://namma-map.web.app/branding/og-image.png" />
      </Helmet>

      <Routes>
        <Route path="/:layer/:district?" element={<RouteManager />} />
        <Route path="/" element={<Navigate to="/pincode" replace />} />
      </Routes>

      <Sidebar />
      
      <main className="main-content" role="main" id="main-content" tabIndex={-1}>
        <ErrorBoundary>
          <Suspense fallback={<MapSkeleton />}>
            <GisMap />
          </Suspense>
        </ErrorBoundary>

        <SearchBar />
        <LocatingOverlay />
        <HealthAreaPrompt />
        <ResultContainer />
        <ReportModal />
        <LegalModal />

        {activeLayer === 'HEALTH' && (
          <div className="health-filters-floating">
            <HealthFiltersPanel 
              onFilterChange={(filters) => {
                setHealthFilters(filters);
              }}
            />
          </div>
        )}

        <UpdateNotification 
          show={needRefresh} 
          isUpdating={isUpdating}
          currentVersion={APP_VERSION}
          availableVersion={availableVersion}
          onRefresh={handleUpdate} 
          onClose={() => {
            if (availableVersion) {
              setDismissedVersion(availableVersion);
            }
            setNeedRefresh(false);
          }}
        />
      </main>
    </div>
  );
}

export default App;
