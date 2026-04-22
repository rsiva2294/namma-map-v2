import React, { Suspense } from 'react';
import './index.css';
import { Search, Map as MapIcon, X, Loader2, Phone, MapPin, Zap, ShoppingCart } from 'lucide-react';
import { useMapStore } from './store/useMapStore';

const GisMap = React.lazy(() => import('./features/map/GisMap'));

function App() {
  const { 
    searchQuery, setSearchQuery, clearSearch, 
    jurisdictionDetails, isResolving, 
    activeLayer, setActiveLayer,
    pdsData
  } = useMapStore();

  return (
    <div className="app-container" style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Suspense fallback={<div className="loading" style={{ color: 'white', padding: '20px' }}>Loading Engine...</div>}>
        <GisMap />
      </Suspense>

      {/* Floating Header / Search */}
      <header 
        className="glass" 
        style={{ 
          position: 'absolute', 
          top: '20px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          width: 'min(95%, 600px)',
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
          placeholder={activeLayer === 'TNEB' ? "Search Pincode..." : "Search Pincode to load PDS..."} 
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
        {isResolving && <Loader2 className="animate-spin" size={18} color="var(--accent)" style={{ marginRight: '10px' }} />}
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

      {/* Layer Toggle Actions */}
      <nav 
        className="glass"
        style={{
          position: 'absolute',
          right: '20px',
          top: '100px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '10px',
          borderRadius: '12px',
          zIndex: 1000
        }}
      >
        <button 
          onClick={() => setActiveLayer('TNEB')}
          style={{
            background: activeLayer === 'TNEB' ? 'var(--accent)' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            padding: '10px',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
          title="TNEB Jurisdiction"
        >
          <Zap size={22} color={activeLayer === 'TNEB' ? 'white' : 'var(--text-secondary)'} />
        </button>
        <button 
          onClick={() => setActiveLayer('PDS')}
          style={{
            background: activeLayer === 'PDS' ? '#22c55e' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            padding: '10px',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
          title="PDS Ration Shops"
        >
          <ShoppingCart size={22} color={activeLayer === 'PDS' ? 'white' : 'var(--text-secondary)'} />
        </button>
      </nav>

      {/* Bottom Info Sheet */}
      <footer 
        className="glass-heavy"
        style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          minHeight: '100px',
          maxHeight: '40vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          zIndex: 1000,
          transition: 'all 0.3s ease'
        }}
      >
        {activeLayer === 'TNEB' ? (
          !jurisdictionDetails ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              {isResolving ? 'Locating Section Office...' : 'Click on the map to find your TNEB Section'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '18px', color: 'var(--accent)', fontWeight: '600' }}>
                  {jurisdictionDetails.section_office || 'TNEB Section'}
                </h2>
                <span style={{ fontSize: '12px', background: 'var(--border-glass)', padding: '4px 8px', borderRadius: '12px' }}>
                  {jurisdictionDetails.district}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                  <Phone size={16} color="var(--text-secondary)" />
                  <span>{jurisdictionDetails.contact_no || 'Not provided'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                  <MapPin size={16} color="var(--text-secondary)" />
                  <span>Sub-station: {jurisdictionDetails.sub_station || 'N/A'}</span>
                </div>
              </div>
            </div>
          )
        ) : (
          /* PDS Info */
          <div style={{ textAlign: 'center' }}>
            {!pdsData ? (
              <span style={{ color: 'var(--text-secondary)' }}>Search a Pincode to load local PDS shops</span>
            ) : (
              <div style={{ color: '#22c55e', fontWeight: '500' }}>
                Displaying {pdsData.features.length} shops in the area
              </div>
            )}
          </div>
        )}
      </footer>
    </div>
  );
}

export default App;
