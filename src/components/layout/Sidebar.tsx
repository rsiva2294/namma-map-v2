import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  ShoppingCart,
  Zap,
  Activity,
  Sun,
  Moon,
  Landmark,
  Shield,
  Scale,
  Building2,
  type LucideIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useMapStore } from '../../store/useMapStore';
import type { ServiceLayer } from '../../types/gis';

const Sidebar: React.FC = () => {
  const isSidebarOpen = useMapStore(state => state.isSidebarOpen);
  const setSidebarOpen = useMapStore(state => state.setSidebarOpen);
  const activeLayer = useMapStore(state => state.activeLayer);
  const activeDistrict = useMapStore(state => state.activeDistrict);
  const theme = useMapStore(state => state.theme);
  const toggleTheme = useMapStore(state => state.toggleTheme);
  const constituencyType = useMapStore(state => state.constituencyType);
  const setConstituencyType = useMapStore(state => state.setConstituencyType);
  const setLegalModal = useMapStore(state => state.setLegalModal);

  const menuItems: { id: ServiceLayer; label: string; icon: LucideIcon }[] = [
    { id: 'PINCODE', label: 'Post Offices', icon: MapPin },
    { id: 'PDS', label: 'PDS (Ration)', icon: ShoppingCart },
    { id: 'TNEB', label: 'TNEB (Electricity)', icon: Zap },
    { id: 'CONSTITUENCY', label: 'Constituencies', icon: Landmark },
    { id: 'POLICE', label: 'Police Jurisdictions', icon: Shield },
    { id: 'HEALTH', label: 'Health Facilities', icon: Activity },
  ];

  return (
    <>
      {/* Backdrop for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mobile-backdrop"
            style={{ display: window.innerWidth > 768 ? 'none' : 'block' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : (window.innerWidth > 768 ? 0 : 0) }}
        transition={{ duration: 0.2 }}
        className={`sidebar ${!isSidebarOpen ? 'sidebar-closed' : ''}`}
      >
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        aria-label={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
      >
        {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      <motion.div 
        animate={{ 
          opacity: isSidebarOpen ? 1 : 0, 
          display: isSidebarOpen ? 'flex' : 'none',
          pointerEvents: isSidebarOpen ? 'auto' : 'none' 
        }}
        transition={{ duration: 0.2 }}
        className="sidebar-scroll-content"
      >
        <div className="sidebar-header">
          <div className="sidebar-logo-group">
            <img
              src="/branding/icon.png"
              alt="NammaMap Logo"
              style={{ width: 32, height: 32, objectFit: 'contain' }}
            />
            <motion.span
              animate={{ opacity: isSidebarOpen ? 1 : 0 }}
              className="logo-text"
            >
              NammaMap
            </motion.span>
          </div>
          {isSidebarOpen && <div className="sub-logo-text">Independent Tamil Nadu GIS Portal</div>}
        </div>

        <div className="sidebar-section-label">Main Services</div>
        {menuItems.map((item) => (
          <React.Fragment key={item.id}>
            <Link
              to={`/${item.id.toLowerCase()}${activeDistrict ? `/${encodeURIComponent(activeDistrict)}` : ''}`}
              className={`sidebar-menu-item ${activeLayer === item.id ? 'active' : ''}`}
              aria-pressed={activeLayer === item.id}
            >
              <item.icon size={20} />
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    style={{ flex: 1 }}
                  >
                    {item.label}
                  </motion.span>
                )}
                {isSidebarOpen && item.id === 'HEALTH' && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="badge-experimental"
                    title="We are still experimenting with how to show all the health details in a clear manner."
                  >
                    EXPERIMENTAL
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* Sub-tabs for Constituencies - Inline after the menu item */}
            {item.id === 'CONSTITUENCY' && (
              <AnimatePresence>
                {activeLayer === 'CONSTITUENCY' && isSidebarOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="sidebar-sub-tabs"
                    style={{ overflow: 'hidden', padding: '0 12px 12px 12px' }}
                  >
                    <div className="tab-group" style={{ 
                      display: 'flex', 
                      background: theme === 'dark' ? '#1e293b' : '#f1f5f9',
                      borderRadius: '8px',
                      padding: '4px',
                      gap: '4px'
                    }}>
                      <button 
                        onClick={() => setConstituencyType('AC')}
                        style={{
                          flex: 1,
                          padding: '6px 0',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          background: constituencyType === 'AC' ? (theme === 'dark' ? '#334155' : '#fff') : 'transparent',
                          color: constituencyType === 'AC' ? (theme === 'dark' ? '#f8fafc' : '#1e293b') : (theme === 'dark' ? '#94a3b8' : '#64748b'),
                          boxShadow: constituencyType === 'AC' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        ASSEMBLY
                      </button>
                      <button 
                        onClick={() => setConstituencyType('PC')}
                        style={{
                          flex: 1,
                          padding: '6px 0',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          background: constituencyType === 'PC' ? (theme === 'dark' ? '#334155' : '#fff') : 'transparent',
                          color: constituencyType === 'PC' ? (theme === 'dark' ? '#f8fafc' : '#1e293b') : (theme === 'dark' ? '#94a3b8' : '#64748b'),
                          boxShadow: constituencyType === 'PC' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        PARLIAMENT
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </React.Fragment>
        ))}

        <div className="sidebar-section-label">Future Modules</div>
        <div className="sidebar-menu-item disabled">
          <Building2 size={20} />
          {isSidebarOpen && <span>Civic Bodies</span>}
          {isSidebarOpen && <span className="badge-soon">SOON</span>}
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-menu-item" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            {isSidebarOpen && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button className="sidebar-menu-item" onClick={() => setLegalModal(true, 'disclaimer')} aria-label="About & Legal">
            <Scale size={20} />
            {isSidebarOpen && <span>About & Legal</span>}
          </button>
        </div>
      </motion.div>
    </motion.aside>
    </>
  );
};

export default Sidebar;
