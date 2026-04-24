import React, { Suspense, useEffect } from 'react';
import './index.css';
import { useMapStore } from './store/useMapStore';
import Sidebar from './components/layout/Sidebar';
import SearchBar from './components/layout/SearchBar';
import ResultContainer from './components/layout/ResultContainer';
import ReportModal from './components/ReportModal';
import ErrorBoundary from './components/ErrorBoundary';
import { HealthFiltersPanel } from './features/health/HealthFiltersPanel';
import { useGisWorker } from './hooks/useGisWorker';
import type { HealthScope } from './types/gis';

const GisMap = React.lazy(() => import('./features/map/GisMap'));

function App() {
  const theme = useMapStore(state => state.theme);

  const activeLayer = useMapStore(state => state.activeLayer);
  const setHealthScope = useMapStore(state => state.setHealthScope);
  const setHealthFilters = useMapStore(state => state.setHealthFilters);
  const activeDistrict = useMapStore(state => state.activeDistrict);
  const searchResult = useMapStore(state => state.searchResult);
  const { filterHealth } = useGisWorker();

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar />
      
      <main className="main-content">
        <ErrorBoundary>
          <Suspense fallback={<div className="loading">Loading Engine...</div>}>
            <GisMap />
          </Suspense>
        </ErrorBoundary>

        <SearchBar />
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
      </main>
    </div>
  );
}

export default App;
