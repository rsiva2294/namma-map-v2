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
  Languages,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getLayerSlug } from '../../utils/routeUtils';
import { useMapStore } from '../../store/useMapStore';
import { useTranslation } from '../../i18n/translations';
import type { ServiceLayer } from '../../types/gis';
import { APP_VERSION } from '../../constants';
import { formatVersion } from '../../utils/version';
import { useVisitorCount } from '../../hooks/useVisitorCount';

const Sidebar: React.FC = () => {
  const isSidebarOpen = useMapStore(state => state.isSidebarOpen);
  const setSidebarOpen = useMapStore(state => state.setSidebarOpen);
  const activeLayer = useMapStore(state => state.activeLayer);
  const activeDistrict = useMapStore(state => state.activeDistrict);
  const theme = useMapStore(state => state.theme);
  const toggleTheme = useMapStore(state => state.toggleTheme);
  const language = useMapStore(state => state.language);
  const setLanguage = useMapStore(state => state.setLanguage);
  const constituencyType = useMapStore(state => state.constituencyType);
  const setConstituencyType = useMapStore(state => state.setConstituencyType);
  const setLegalModal = useMapStore(state => state.setLegalModal);
  const setIsTutorialOpen = useMapStore(state => state.setIsTutorialOpen);

  const { t } = useTranslation();
  const visitorCount = useVisitorCount();

  const categories = [
    {
      label: t('ESSENTIALS'),
      items: [
        { id: 'PINCODE' as ServiceLayer, label: t('PINCODE'), icon: MapPin, color: '#3b82f6' },
        { id: 'PDS' as ServiceLayer, label: t('PDS'), icon: ShoppingCart, color: '#ef4444' },
        { id: 'HEALTH' as ServiceLayer, label: t('HEALTH'), icon: Activity, color: '#be123c' },
      ]
    },
    {
      label: t('CIVIC'),
      items: [
        { id: 'LOCAL_BODIES_V2' as ServiceLayer, label: t('LOCAL_BODIES_V2'), icon: Building2, color: '#6366f1' },
        { id: 'CONSTITUENCY' as ServiceLayer, label: t('CONSTITUENCY'), icon: Landmark, color: '#6366f1' },
      ]
    },
    {
      label: t('SAFETY'),
      items: [
        { id: 'POLICE' as ServiceLayer, label: t('POLICE'), icon: Shield, color: '#475569' },
      ]
    },
    {
      label: t('UTILITIES'),
      items: [
        { id: 'TNEB' as ServiceLayer, label: t('TNEB'), icon: Zap, color: '#f59e0b' },
      ]
    }
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
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        role="navigation"
        aria-label={t('SERVICE_LAYERS_ARIA') || "Service Layers"}
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0 }}
        transition={{ duration: 0.2 }}
        className={`sidebar ${!isSidebarOpen ? 'sidebar-closed' : ''}`}
      >
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? t('CLOSE_SIDEBAR') : t('OPEN_SIDEBAR')}
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
                loading="eager"
                fetchPriority="high"
                style={{ width: 32, height: 32, objectFit: 'contain' }}
              />
              <motion.span
                animate={{ opacity: isSidebarOpen ? 1 : 0 }}
                className="logo-text"
              >
                NammaMap
              </motion.span>
            </div>
            {isSidebarOpen && <div className="sub-logo-text">{t('INDEPENDENT_PORTAL')}</div>}
          </div>

        {categories.map((category) => (
          <React.Fragment key={category.label}>
            <div className="sidebar-section-label">{category.label}</div>
            {category.items.map((item) => (
              <React.Fragment key={`sidebar-item-${item.id}`}>
                <Link
                  to={`/${getLayerSlug(item.id)}${activeDistrict ? `/${encodeURIComponent(activeDistrict)}` : ''}`}
                  className={`sidebar-menu-item ${activeLayer === item.id ? 'active' : ''}`}
                  aria-pressed={activeLayer === item.id}
                >
                  <item.icon size={20} style={{ color: activeLayer === item.id ? 'white' : item.color }} />
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
                        className="badge-beta"
                        title={t('HEALTH_EXPERIMENTAL_DESC')}
                      >
                        {t('EXPERIMENTAL')}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>

                {/* Sub-tabs for Constituencies - Inline after the menu item */}
                {item.id === 'CONSTITUENCY' && (
                  <AnimatePresence>
                    {activeLayer === 'CONSTITUENCY' && isSidebarOpen && (
                      <motion.div 
                        key="constituency-sub-tabs"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="sidebar-sub-tabs"
                        style={{ 
                          padding: '0 12px 12px 12px',
                          position: 'relative',
                          zIndex: 10
                        }}
                      >
                        <div className="tab-group" style={{ 
                          display: 'flex', 
                          background: theme === 'dark' ? '#1e293b' : '#f1f5f9',
                          borderRadius: '8px',
                          padding: '4px',
                          gap: '4px',
                          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                          <button 
                            key="ac-btn"
                            onClick={() => setConstituencyType('AC')}
                            style={{
                              flex: 1,
                              padding: '8px 0',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              background: constituencyType === 'AC' ? (theme === 'dark' ? '#334155' : '#fff') : 'transparent',
                              color: constituencyType === 'AC' ? (theme === 'dark' ? '#f8fafc' : '#1e293b') : (theme === 'dark' ? '#94a3b8' : '#64748b'),
                              boxShadow: constituencyType === 'AC' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                              transition: 'all 0.2s'
                            }}
                          >
                            {t('ASSEMBLY')}
                          </button>
                          <button 
                            key="pc-btn"
                            onClick={() => setConstituencyType('PC')}
                            style={{
                              flex: 1,
                              padding: '8px 0',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              background: constituencyType === 'PC' ? (theme === 'dark' ? '#334155' : '#fff') : 'transparent',
                              color: constituencyType === 'PC' ? (theme === 'dark' ? '#f8fafc' : '#1e293b') : (theme === 'dark' ? '#94a3b8' : '#64748b'),
                              boxShadow: constituencyType === 'PC' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                              transition: 'all 0.2s'
                            }}
                          >
                            {t('PARLIAMENT')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}

        <div className="sidebar-divider" />
        <div className="sidebar-section-label">{t('SETTINGS')}</div>
        
        <div className="sidebar-footer">
          <button 
            className="sidebar-menu-item" 
            onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')} 
            aria-label={language === 'en' ? t('SWITCH_TO_TAMIL') : t('SWITCH_TO_ENGLISH')}
          >
            <Languages size={20} />
            {isSidebarOpen && <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>}
            {isSidebarOpen && (
              <span className="badge-beta">
                {t('EXPERIMENTAL')}
              </span>
            )}
          </button>
          <button className="sidebar-menu-item" onClick={toggleTheme} aria-label={theme === 'dark' ? t('SWITCH_TO_LIGHT_MODE') : t('SWITCH_TO_DARK_MODE')}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            {isSidebarOpen && <span>{theme === 'dark' ? t('LIGHT_MODE') : t('DARK_MODE')}</span>}
          </button>
          <button className="sidebar-menu-item" onClick={() => setLegalModal(true, 'disclaimer')} aria-label={t('ABOUT_LEGAL')}>
            <Scale size={20} />
            {isSidebarOpen && <span>{t('ABOUT_LEGAL')}</span>}
          </button>
          <button 
            className="sidebar-menu-item" 
            onClick={() => setIsTutorialOpen(true)} 
            aria-label={t('TUTORIAL')}
          >
            <HelpCircle size={20} color="var(--accent)" />
            {isSidebarOpen && <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{t('TUTORIAL')}</span>}
          </button>
          {isSidebarOpen && (
            <div className="sidebar-version-tag">
              <div>v{formatVersion(APP_VERSION)}</div>
              {visitorCount !== null && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', opacity: 0.8 }}
                >
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                  <span>{t('TOTAL_VISITS')}: <strong style={{ color: 'var(--text-primary)' }}>{visitorCount.toLocaleString()}</strong></span>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.aside>
    </>
  );
};

export default Sidebar;
