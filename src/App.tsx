import React, { Suspense, useEffect } from 'react';
import './index.css';
import { useMapStore } from './store/useMapStore';
import Sidebar from './components/layout/Sidebar';
import SearchBar from './components/layout/SearchBar';
import ResultContainer from './components/layout/ResultContainer';
import ErrorBoundary from './components/ErrorBoundary';

const GisMap = React.lazy(() => import('./features/map/GisMap'));

function App() {
  const theme = useMapStore(state => state.theme);

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
      </main>
    </div>
  );
}

export default App;
