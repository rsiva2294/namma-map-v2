import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  ShoppingCart, 
  Zap, 
  Activity, 
  Shield, 
  Landmark, 
  Users, 
  Sun, 
  Moon, 
  Settings, 
  HelpCircle,
  LayoutGrid
} from 'lucide-react';
import { useMapStore, type ServiceLayer } from '../../store/useMapStore';

const Sidebar: React.FC = () => {
  const isSidebarOpen = useMapStore(state => state.isSidebarOpen);
  const setSidebarOpen = useMapStore(state => state.setSidebarOpen);
  const activeLayer = useMapStore(state => state.activeLayer);
  const setActiveLayer = useMapStore(state => state.setActiveLayer);
  const theme = useMapStore(state => state.theme);
  const toggleTheme = useMapStore(state => state.toggleTheme);

  const menuItems: { id: ServiceLayer; label: string; icon: any }[] = [
    { id: 'PINCODE', label: 'Pincode Areas', icon: MapPin },
    { id: 'PDS', label: 'PDS (Ration)', icon: ShoppingCart },
    { id: 'TNEB', label: 'TNEB (Electricity)', icon: Zap },
  ];

  return (
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
        {menuItems.map(item => (
          <button 
            key={item.id}
            className={`sidebar-menu-item ${activeLayer === item.id ? 'active' : ''}`}
            onClick={() => setActiveLayer(item.id)}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}

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
  );
};

export default Sidebar;
