import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scale, Shield, FileText, Share2, Mail, MapPin, User } from 'lucide-react';
import { useMapStore } from '../store/useMapStore';
import { APP_VERSION } from '../constants';
import { formatVersion } from '../utils/version';
import { useTranslation } from '../i18n/translations';

const LegalModal: React.FC = () => {
  const isOpen = useMapStore(state => state.isLegalModalOpen);
  const activeTab = useMapStore(state => state.legalTab);
  const setLegalModal = useMapStore(state => state.setLegalModal);
  const { t } = useTranslation();

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
    { id: 'disclaimer', label: t('DISCLAIMER'), icon: Scale },
    { id: 'privacy', label: t('PRIVACY'), icon: Shield },
    { id: 'terms', label: t('TERMS'), icon: FileText }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'disclaimer':
        return (
          <div className="legal-content-body">
            <section>
              <h4>{t('NON_GOVT_TITLE')}</h4>
              <p>
                <strong>NammaMap</strong> {t('NON_GOVT_DESC')}
              </p>
              <p>
                {t('DATA_SOURCE_DESC')}
              </p>
            </section>

            <section>
              <h4>{t('DEVELOPER_INFO')}</h4>
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
                    {t('LINKEDIN')}
                  </a>
                  <a href="mailto:sivakaminathan.muthusamy@gmail.com" className="dev-link">
                    <Mail size={18} />
                    {t('CONTACT')}
                  </a>
                </div>
              </div>
            </section>

            <section>
              <h4>{t('ACCURACY_DATA')}</h4>
              <p>
                {t('VERIFY_OFFICIAL')}
              </p>
            </section>
          </div>
        );
      case 'privacy':
        return (
          <div className="legal-content-body">
            <section>
              <h4>{t('ZERO_DATA_TITLE')}</h4>
              <p>
                {t('ZERO_DATA_DESC')}
              </p>
              <ul className="legal-list">
                <li><strong>{t('LOCATION_ACCESS')}</strong>: {t('LOCATION_PRIVACY')}</li>
                <li><strong>{t('CACHING')}</strong>: {t('CACHING_DESC')}</li>
                <li><strong>{t('COOKIES')}</strong>: {t('COOKIES_DESC')}</li>
              </ul>
            </section>
            <section>
              <h4>{t('THIRD_PARTY_SERVICES')}</h4>
              <p>
                {t('THIRD_PARTY_DESC')}
              </p>
            </section>
          </div>
        );
      case 'terms':
        return (
          <div className="legal-content-body">
            <section>
              <h4>{t('ACCEPTABLE_USE_TITLE')}</h4>
              <p>
                {t('ACCEPTABLE_USE_DESC')}
              </p>
            </section>
            <section>
              <h4>{t('INTELLECTUAL_PROPERTY')}</h4>
              <p>
                {t('IP_DESC')}
              </p>
            </section>
            <section>
              <h4>{t('LIMITATION_LIABILITY')}</h4>
              <p>
                {t('LIABILITY_DESC')}
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
              <h3>{t('ABOUT_LEGAL')}</h3>
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
              {t('BUILD_VERSION')}: <span>v{formatVersion(APP_VERSION)}</span>
            </div>
            <button className="btn-primary" onClick={() => setLegalModal(false)}>
              {t('UNDERSTAND')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LegalModal;
