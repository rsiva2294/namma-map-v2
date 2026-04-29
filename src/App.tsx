import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import TutorialGuide from './features/tutorial/TutorialGuide';
import SEO from './components/layout/SEO';
import PWAUpdater from './components/PWAUpdater';
import { RouteManager } from './components/routing/RouteManager';
import MapSkeleton from './components/layout/MapSkeleton';
import SchemaData from './components/SchemaData';
import { useLocation } from 'react-router-dom';
import NetworkErrorOverlay from './components/NetworkErrorOverlay';
import { PostalLegendPanel } from './features/postal/PostalFiltersPanel';
import { trackEvent } from './lib/firebase';


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

  // Track Page Views
  useEffect(() => {
    trackEvent('page_view', {
      page_path: location.pathname + location.search,
      active_layer: activeLayer,
      active_district: activeDistrict || 'statewide'
    });
  }, [location, activeLayer, activeDistrict]);

  // Dynamic SEO Meta Tags
  const healthScope = useMapStore(state => state.healthScope);
  const healthFilters = useMapStore(state => state.healthFilters);

  useEffect(() => {
    if (activeLayer === 'HEALTH') {
      const pincode = (searchResult?.properties?.PIN_CODE || searchResult?.properties?.pincode || searchResult?.properties?.pin_code)?.toString();
      console.log('[App] Refreshing health filters:', { healthScope, activeDistrict, pincode });
      filterHealth(healthScope, healthFilters, activeDistrict, pincode || null);
    }
  }, [activeLayer, healthScope, healthFilters, activeDistrict, searchResult, filterHealth]);

  // Sync theme with body class
  useEffect(() => {
    document.body.className = `${theme}-mode`;
  }, [theme]);

  return (
    <div className={`app-container ${theme}-mode lang-${language}`}>
      <TutorialGuide />
      <a href="#main-content" className="skip-link">{t('SKIP_TO_RESULTS')}</a>
      <SchemaData />
      <SEO />


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
        <NetworkErrorOverlay />
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
        
        {activeLayer === 'PINCODE' && <PostalLegendPanel />}

        <PWAUpdater />
      </main>
    </div>
  );
}

export default App;
