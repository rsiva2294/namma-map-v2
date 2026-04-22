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
  Settings,
  HelpCircle,
  type LucideIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../store/useMapStore';
import type { ServiceLayer } from '../../types/gis';

const Sidebar: React.FC = () => {
  const isSidebarOpen = useMapStore(state => state.isSidebarOpen);
  const setSidebarOpen = useMapStore(state => state.setSidebarOpen);
  const activeLayer = useMapStore(state => state.activeLayer);
  const setActiveLayer = useMapStore(state => state.setActiveLayer);
  const theme = useMapStore(state => state.theme);
  const toggleTheme = useMapStore(state => state.toggleTheme);

  const menuItems: { id: ServiceLayer; label: string; icon: LucideIcon }[] = [
    { id: 'PINCODE', label: 'Pincode Areas', icon: MapPin },
    { id: 'PDS', label: 'PDS (Ration)', icon: ShoppingCart },
    { id: 'TNEB', label: 'TNEB (Electricity)', icon: Zap },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isSidebarOpen ? 280 : 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className={`sidebar ${!isSidebarOpen ? 'sidebar-closed' : ''}`}
    >
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        aria-label={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
      >
        {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      <div className="sidebar-scroll-content">
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
          {isSidebarOpen && <div className="sub-logo-text">Tamil Nadu GIS Portal</div>}
        </div>

        <div className="sidebar-section-label">Main Services</div>
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-menu-item ${activeLayer === item.id ? 'active' : ''}`}
            onClick={() => setActiveLayer(item.id)}
            aria-pressed={activeLayer === item.id}
          >
            <item.icon size={20} />
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        ))}

        <div className="sidebar-section-label">Future Modules</div>
        <div className="sidebar-menu-item disabled">
          <Activity size={20} />
          {isSidebarOpen && <span>Health</span>}
          {isSidebarOpen && <span className="badge-soon">SOON</span>}
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-menu-item" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            {isSidebarOpen && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button className="sidebar-menu-item" aria-label="Settings">
            <Settings size={20} />
            {isSidebarOpen && <span>Settings</span>}
          </button>
          <button className="sidebar-menu-item" aria-label="Help">
            <HelpCircle size={20} />
            {isSidebarOpen && <span>Help</span>}
          </button>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
