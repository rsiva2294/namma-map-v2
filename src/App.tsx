import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { useMapStore } from './store/useMapStore';
import Sidebar from './components/layout/Sidebar';
import SearchBar from './components/layout/SearchBar';
import ResultContainer from './components/layout/ResultContainer';
const ReportModal = React.lazy(() => import('./components/ReportModal'));

const LegalModal = React.lazy(() => import('./components/LegalModal'));

import { useTranslation } from './i18n/translations';
import ErrorBoundary from './components/ErrorBoundary';
const HealthFiltersPanel = React.lazy(() => import('./features/health/HealthFiltersPanel').then(m => ({ default: m.HealthFiltersPanel })));

const HealthAreaPrompt = React.lazy(() => import('./features/health/HealthAreaPrompt').then(m => ({ default: m.HealthAreaPrompt })));

import LocatingOverlay from './components/LocatingOverlay';
const TutorialGuide = React.lazy(() => import('./features/tutorial/TutorialGuide'));

import SEO from './components/layout/SEO';
const PWAUpdater = React.lazy(() => import('./components/PWAUpdater'));

import { RouteManager } from './components/routing/RouteManager';
import MapSkeleton from './components/layout/MapSkeleton';
import SchemaData from './components/SchemaData';
import { useLocation } from 'react-router-dom';
const NetworkErrorOverlay = React.lazy(() => import('./components/NetworkErrorOverlay'));

const PostalLegendPanel = React.lazy(() => import('./features/postal/PostalFiltersPanel').then(m => ({ default: m.PostalLegendPanel })));

import { trackEvent } from './lib/firebase';
import { useElectionResults } from './hooks/useElectionResults';

const ElectionDashboard = React.lazy(() => import('./features/election/ElectionDashboard'));
const ElectionDisclaimer = React.lazy(() => import('./features/election/ElectionDisclaimer'));


const GisMap = React.lazy(() => import('./features/map/GisMap'));

function App() {
  const [shouldLoadMap, setShouldLoadMap] = React.useState(false);
  const { t } = useTranslation();
  const theme = useMapStore(state => state.theme);
  const activeLayer = useMapStore(state => state.activeLayer);
  const setHealthFilters = useMapStore(state => state.setHealthFilters);
  const activeDistrict = useMapStore(state => state.activeDistrict);
  const language = useMapStore(state => state.language);
  const location = useLocation();

  useElectionResults();

  // Track Page Views
  useEffect(() => {
    trackEvent('page_view', {
      page_path: location.pathname + location.search,
      active_layer: activeLayer,
      active_district: activeDistrict || 'statewide'
    });
  }, [location, activeLayer, activeDistrict]);


  // Defer Map Loading to prioritize FCP/LCP
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const delay = isMobile ? 2500 : 800; // Longer delay on mobile to allow CPU to settle
    
    const timer = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => setShouldLoadMap(true), { timeout: 2000 });
      } else {
        setShouldLoadMap(true);
      }
    }, delay); 
    return () => clearTimeout(timer);
  }, []);



  // Sync theme with body class
  useEffect(() => {
    document.body.className = `${theme}-mode`;
  }, [theme]);

  return (
    <div className={`app-container ${theme}-mode lang-${language}`}>
      <Suspense fallback={null}>
        <TutorialGuide />
      </Suspense>

      <a href="#main-content" className="skip-link">{t('SKIP_TO_RESULTS')}</a>
      <SchemaData />
      <SEO />


      <Routes>
        <Route path="/:layer/:district?" element={<RouteManager />} />
        <Route path="/" element={<Navigate to="/constituency" replace />} /> {/* Temporary: Default to constituency for election period */}
      </Routes>

      <Sidebar />
      
      <main className="main-content" role="main" id="main-content" tabIndex={-1}>
        <ErrorBoundary>
          <Suspense fallback={<MapSkeleton />}>
            {shouldLoadMap ? <GisMap /> : <MapSkeleton />}
          </Suspense>
        </ErrorBoundary>

        <SearchBar />
        <Suspense fallback={null}>
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

        <ElectionDashboard />
        <ElectionDisclaimer />

        <PWAUpdater />
        </Suspense>

      </main>
    </div>
  );
}

export default App;
