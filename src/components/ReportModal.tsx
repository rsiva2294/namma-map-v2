import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertCircle } from 'lucide-react';
import { useMapStore } from '../store/useMapStore';
import { useTranslation } from '../i18n/translations';

const ReportModal: React.FC = () => {
  const isOpen = useMapStore(state => state.isReportModalOpen);
  const context = useMapStore(state => state.reportContext);
  const setReportModal = useMapStore(state => state.setReportModal);
  const { t, language } = useTranslation();
  const [correction, setCorrection] = useState('');

  // Accessibility: Handle Escape key
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setReportModal(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, setReportModal]);

  if (!isOpen || !context) return null;

  const handleSend = () => {
    const subject = encodeURIComponent(`NammaMap Data Correction: ${context.type}`);
    const body = encodeURIComponent(
      `Issue reported for ${context.type}\n\n` +
      `--- FEATURE DETAILS ---\n` +
      Object.entries(context.data)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n') +
      `\n\n--- CORRECTION / FEEDBACK ---\n` +
      `${correction}\n\n` +
      `------------------------\n` +
      `Reported via NammaMap V2 Web Application`
    );

    window.open(`mailto:rsiva2294@gmail.com?subject=${subject}&body=${body}`);
    setReportModal(false);
    setCorrection('');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-overlay"
        onClick={() => setReportModal(false)}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="modal-content glass-heavy"
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-header">
            <div className="modal-title-group">
              <AlertCircle size={20} className="text-accent" />
              <h3>{t('REPORT_ISSUE')}</h3>
            </div>
            <button className="modal-close" onClick={() => setReportModal(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="modal-body">
            <p className="modal-description">
              {language === 'ta' 
                ? `நம்ம மேப்பை மேம்படுத்த எங்களுக்கு உதவுங்கள். ${context.type}-க்கான தரவுத் திருத்தத்தை விவரிக்கவும்.`
                : `Help us improve NammaMap. Please describe the data correction for ${context.type}.`}
            </p>

            <div className="modal-data-summary">
              {Object.entries(context.data).map(([key, value]) => (
                <div key={key} className="modal-data-row">
                  <span className="modal-data-label">{key}</span>
                  <span className="modal-data-value">{String(value)}</span>
                </div>
              ))}
            </div>

            <div className="modal-form-group">
              <label htmlFor="correction">{t('CORRECTION_DETAILS')}</label>
              <textarea
                id="correction"
                placeholder={language === 'ta' ? 'என்ன தவறு என்பதை விளக்கவும் (உதாரணமாக: இருப்பிட மாற்றம், பெயர் மாற்றம்...)' : "Describe what's wrong (e.g., location shift, name change, office moved...)"}
                value={correction}
                onChange={e => setCorrection(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={() => setReportModal(false)}>
              {t('CANCEL')}
            </button>
            <button 
              className="btn-primary" 
              onClick={handleSend}
              disabled={!correction.trim()}
            >
              <Send size={16} />
              {language === 'ta' ? 'மின்னஞ்சல் அனுப்பு' : 'Open Email Client'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReportModal;
