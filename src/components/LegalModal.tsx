import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scale, Shield, FileText, Share2, Mail, MapPin, User } from 'lucide-react';
import { useMapStore } from '../store/useMapStore';
import { APP_VERSION } from '../constants';
import { formatVersion } from '../utils/version';

const LegalModal: React.FC = () => {
  const isOpen = useMapStore(state => state.isLegalModalOpen);
  const activeTab = useMapStore(state => state.legalTab);
  const setLegalModal = useMapStore(state => state.setLegalModal);

  // Accessibility: Handle Escape key
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLegalModal(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      // Optional: Prevent scrolling background
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, setLegalModal]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'disclaimer', label: 'About & Disclaimer', icon: Scale },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'terms', label: 'Terms', icon: FileText }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'disclaimer':
        return (
          <div className="legal-content-body">
            <section>
              <h4>Non-Government Association</h4>
              <p>
                <strong>NammaMap</strong> is an independent, non-commercial research project. It is <strong>NOT</strong> affiliated with, endorsed by, or in any way officially connected to the Government of Tamil Nadu, the Government of India, or any of their agencies (TNEB, TANGEDCO, PDS, etc.).
              </p>
              <p>
                All data displayed on this portal is aggregated from publicly available government datasets, open data initiatives, and public records. While we strive for precision, the boundaries and locations should be used for informational purposes only.
              </p>
            </section>

            <section>
              <h4>Developer Information</h4>
              <div className="dev-card">
                <div className="dev-info">
                  <div className="dev-name">
                    <User size={16} />
                    <span>SIVAKAMINATHAN MUTHUSAMY</span>
                  </div>
                  <div className="dev-loc">
                    <MapPin size={16} />
                    <span>Madurai, Tamil Nadu</span>
                  </div>
                </div>
                <div className="dev-links">
                  <a href="https://in.linkedin.com/in/sivakaminathan-muthusamy" target="_blank" rel="noopener noreferrer" className="dev-link">
                    <Share2 size={18} />
                    LinkedIn
                  </a>
                  <a href="mailto:sivakaminathan.muthusamy@gmail.com" className="dev-link">
                    <Mail size={18} />
                    Contact
                  </a>
                </div>
              </div>
            </section>

            <section>
              <h4>Accuracy of Data</h4>
              <p>
                Users are advised to verify jurisdictional data with official government records before making any legal or administrative decisions. The developer assumes no responsibility for any inaccuracies or decisions made based on the data provided here.
              </p>
            </section>
          </div>
        );
      case 'privacy':
        return (
          <div className="legal-content-body">
            <section>
              <h4>Zero-Data Policy</h4>
              <p>
                NammaMap respects your privacy. We do not collect, store, or sell any Personal Identifiable Information (PII).
              </p>
              <ul className="legal-list">
                <li><strong>Location Access</strong>: When you use "Locate Me", your coordinates are processed locally in your browser to find your jurisdiction. We never store your GPS history.</li>
                <li><strong>Caching</strong>: GIS data is cached locally in your browser's IndexedDB to improve performance. This data stays on your device.</li>
                <li><strong>Cookies</strong>: We use minimal local storage to remember your theme preference (Dark/Light mode).</li>
              </ul>
            </section>
            <section>
              <h4>Third-Party Services</h4>
              <p>
                We use Firebase Hosting for deployment and Leaflet/CartoDB for map tiles. These services may collect standard server logs as part of their operations.
              </p>
            </section>
          </div>
        );
      case 'terms':
        return (
          <div className="legal-content-body">
            <section>
              <h4>Acceptable Use</h4>
              <p>
                By using NammaMap, you agree to use the service for lawful purposes. You may not attempt to scrape, reverse-engineer, or disrupt the application's infrastructure.
              </p>
            </section>
            <section>
              <h4>Intellectual Property</h4>
              <p>
                The application source code is the property of the developer. The GIS datasets remain the property of their respective departments and sources.
              </p>
            </section>
            <section>
              <h4>Limitation of Liability</h4>
              <p>
                The service is provided "AS IS" without any warranties. The developer shall not be liable for any damages arising from the use or inability to use this portal.
              </p>
            </section>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-overlay"
        onClick={() => setLegalModal(false)}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          className="modal-content glass-heavy legal-modal"
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-header">
            <div className="modal-title-group">
              <Scale size={20} className="text-accent" />
              <h3>About & Legal Information</h3>
            </div>
            <button className="modal-close" onClick={() => setLegalModal(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="legal-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`legal-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setLegalModal(true, tab.id as any)}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="modal-body legal-modal-body">
            {renderContent()}
          </div>

          <div className="modal-footer">
            <div className="modal-footer-version">
              Build Version: <span>v{formatVersion(APP_VERSION)}</span>
            </div>
            <button className="btn-primary" onClick={() => setLegalModal(false)}>
              I Understand
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LegalModal;
