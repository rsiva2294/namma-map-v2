import React, { Suspense, useEffect } from 'react';
import './index.css';
import { 
  Activity, 
  Shield, 
  Landmark, 
  Users, 
  Zap, 
  ShoppingBag, 
  Settings, 
  Moon, 
  Sun, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight,
  Search,
  X,
  MapPin,
  Loader2,
  LayoutGrid,
  ShoppingCart,
  Navigation
} from 'lucide-react';
import { useMapStore } from './store/useMapStore';
import ResultCard from './components/ResultCard';

const GisMap = React.lazy(() => import('./features/map/GisMap'));

function App() {
  const { 
    searchQuery, setSearchQuery, clearSearch, 
    jurisdictionDetails, setJurisdictionDetails, isResolving, 
    activeLayer, setActiveLayer,
    selectedPdsShop, setSelectedPdsShop, searchResult,
    theme, toggleTheme,
    searchSuggestions, setSearchSuggestions, setSelectedSuggestion,
    isSidebarOpen, setSidebarOpen,
    setTriggerLocateMe
  } = useMapStore();

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  return (
    <div className={`app-container ${theme}`} style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside className={`sidebar ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
        <button 
          className="sidebar-toggle" 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        >
          {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
        
        <div className="sidebar-scroll-content">
          <div className="sidebar-header">
            <div className="sidebar-logo-group">
              <LayoutGrid size={24} color="var(--accent)" />
              <span className="logo-text">NammaMap</span>
            </div>
            <div className="sub-logo-text">Tamil Nadu GIS Portal</div>
          </div>

          <div className="sidebar-section-label">Main Services</div>
          <button 
            className={`sidebar-menu-item ${activeLayer === 'PINCODE' ? 'active' : ''}`}
            onClick={() => setActiveLayer('PINCODE')}
          >
            <MapPin size={20} />
            <span>Pincode Areas</span>
          </button>
          <button 
            className={`sidebar-menu-item ${activeLayer === 'PDS' ? 'active' : ''}`}
            onClick={() => setActiveLayer('PDS')}
          >
            <ShoppingCart size={20} />
            <span>PDS (Ration)</span>
          </button>
          <button 
            className={`sidebar-menu-item ${activeLayer === 'TNEB' ? 'active' : ''}`}
            onClick={() => setActiveLayer('TNEB')}
          >
            <Zap size={20} />
            <span>TNEB (Electricity)</span>
          </button>

          <div className="sidebar-section-label">Future Modules</div>
          <div className="sidebar-menu-item disabled">
            <Activity size={20} />
            <span>Health</span>
            <span className="badge-soon">SOON</span>
          </div>
          <div className="sidebar-menu-item disabled">
            <Shield size={20} />
            <span>Police</span>
            <span className="badge-soon">SOON</span>
          </div>
          <div className="sidebar-menu-item disabled">
            <Landmark size={20} />
            <span>Administrative</span>
            <span className="badge-soon">SOON</span>
          </div>
          <div className="sidebar-menu-item disabled">
            <Users size={20} />
            <span>Elections</span>
            <span className="badge-soon">SOON</span>
          </div>

          <div className="sidebar-footer">
            <button className="sidebar-menu-item" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button className="sidebar-menu-item">
              <Settings size={20} />
              <span>Settings</span>
            </button>
            <button className="sidebar-menu-item">
              <HelpCircle size={20} />
              <span>Help & Support</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, position: 'relative', height: '100%' }}>
        <Suspense fallback={<div className="loading" style={{ color: 'white', padding: '20px' }}>Loading Engine...</div>}>
          <GisMap />
        </Suspense>

        {/* Floating Search - Now centered in main area */}
        <header 
          className="glass" 
          style={{ 
            position: 'absolute', 
            top: '20px', 
            left: '50%', 
            transform: 'translateX(-50%)',
            width: 'min(90%, 500px)',
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
            placeholder={activeLayer === 'TNEB' ? "Search by Section, Sub-Division..." : "Search Pincode..."} 
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
          <Navigation 
            size={18} 
            color="var(--accent)" 
            style={{ cursor: 'pointer' }} 
            onClick={() => setTriggerLocateMe(true)}
            title="Locate Me"
          />
          
          {/* Dropdown Suggestions */}
          {searchSuggestions.length > 0 && (
            <ul
              className="glass"
              style={{
                position: 'absolute',
                top: '65px',
                left: '0',
                right: '0',
                borderRadius: '16px',
                padding: '10px 0',
                listStyle: 'none',
                margin: 0,
                maxHeight: '300px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              {searchSuggestions.map((suggestion, idx) => {
                const name = suggestion.properties.district || suggestion.properties.DISTRICT_NAME || suggestion.properties.NAME || suggestion.properties.section_na || '';
                const pin = suggestion.properties.PIN_CODE || suggestion.properties.pincode;
                const title = pin ? `${pin} - ${name}` : name;
                
                return (
                  <li
                    key={idx}
                    onClick={() => {
                      setSearchQuery(title);
                      setSelectedSuggestion(suggestion);
                      setSearchSuggestions([]);
                    }}
                    style={{
                      padding: '10px 20px',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--border-glass)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <MapPin size={16} color="var(--text-secondary)" />
                    {title}
                  </li>
                );
              })}
            </ul>
          )}
        </header>

        {/* Dynamic Result Cards */}
        {activeLayer === 'PDS' && selectedPdsShop && (
          <ResultCard
            themeColor="red"
            title={selectedPdsShop.properties.name || 'PDS Shop'}
            icon={<ShoppingBag size={20} />}
            data={[
              { label: 'Shop Code', value: selectedPdsShop.properties.shop_code || 'N/A', isPill: true },
              { label: 'Village', value: selectedPdsShop.properties.village || 'N/A' },
              { label: 'Taluk', value: selectedPdsShop.properties.taluk || 'N/A' },
              { label: 'District', value: selectedPdsShop.properties.district || 'N/A' }
            ]}
            onClose={() => setSelectedPdsShop(null)}
            onDirections={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedPdsShop.geometry.coordinates[1]},${selectedPdsShop.geometry.coordinates[0]}`, '_blank')}
          />
        )}

        {activeLayer === 'TNEB' && jurisdictionDetails && (
          <ResultCard
            themeColor="orange"
            title={jurisdictionDetails.section_na || jurisdictionDetails.section_office || 'TNEB Section'}
            icon={<Zap size={20} />}
            data={[
              { label: 'Sub-Division', value: jurisdictionDetails.subdivisio || jurisdictionDetails.sub_division || 'N/A' },
              { label: 'Division', value: jurisdictionDetails.division_n || jurisdictionDetails.division || 'N/A' },
              { label: 'Circle', value: jurisdictionDetails.circle_nam || jurisdictionDetails.circle || 'N/A' },
              { label: 'Region', value: jurisdictionDetails.region_nam || jurisdictionDetails.region || 'N/A' }
            ]}
            onClose={() => setJurisdictionDetails(null, null)}
            onDirections={jurisdictionDetails.office_location ? () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${jurisdictionDetails.office_location[1]},${jurisdictionDetails.office_location[0]}`, '_blank') : undefined}
          />
        )}

        {(activeLayer === 'PINCODE' || activeLayer === 'PDS') && searchResult && !selectedPdsShop && !jurisdictionDetails && (
          <ResultCard
            themeColor="blue"
            title={searchResult.properties.district || searchResult.properties.NAME || 'Selected Area'}
            data={[
              { label: 'Pincode', value: searchResult.properties.PIN_CODE || searchResult.properties.pincode || 'N/A', isPill: true },
              { label: 'District', value: searchResult.properties.DISTRICT || searchResult.properties.district || searchResult.properties.NAME || 'N/A' }
            ]}
            onClose={clearSearch}
          />
        )}
      </main>
    </div>
  );
}

export default App;
