import React, { Suspense } from 'react';
import './index.css';
import { Search, Map as MapIcon, Info, Settings, X } from 'lucide-react';
import { useMapStore } from './store/useMapStore';

const GisMap = React.lazy(() => import('./features/map/GisMap'));

function App() {
  const { searchQuery, setSearchQuery, clearSearch } = useMapStore();

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Search logic is handled in the map component observing the store
    }
  };

  return (
    <div className="app-container" style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Suspense fallback={<div className="loading" style={{ color: 'white', padding: '20px' }}>Loading Engine...</div>}>
        <GisMap />
      </Suspense>

      <header 
        className="glass" 
        style={{ 
          position: 'absolute', 
          top: '20px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          width: 'min(90%, 600px)',
          height: '56px',
          borderRadius: '28px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          zIndex: 1000
        }}
      >
        <Search size={20} color="var(--text-secondary)" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
          placeholder="Search by Pincode (e.g. 600001)..." 
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '16px',
            marginLeft: '12px',
            flex: 1,
            outline: 'none'
          }}
        />
        {searchQuery && (
          <X 
            size={18} 
            color="var(--text-secondary)" 
            style={{ cursor: 'pointer', marginRight: '10px' }} 
            onClick={clearSearch} 
          />
        )}
        <div style={{ width: '1px', height: '24px', background: 'var(--border-glass)', margin: '0 5px' }} />
        <MapIcon size={20} color="var(--accent)" style={{ cursor: 'pointer' }} />
      </header>

      <nav 
        className="glass"
        style={{
          position: 'absolute',
          right: '20px',
          top: '100px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          padding: '15px',
          borderRadius: '16px',
          zIndex: 1000
        }}
      >
        <div className="nav-item" title="Services"><Info size={22} /></div>
        <div className="nav-item" title="Settings"><Settings size={22} /></div>
      </nav>

      <footer 
        className="glass-heavy"
        style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          zIndex: 1000
        }}
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Select a location or search for a Pincode
        </p>
      </footer>
    </div>
  );
}

export default App;
