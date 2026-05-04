import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertCircle, Activity, CheckCircle2 } from 'lucide-react';
import { useMapStore } from '../store/useMapStore';
import { useTranslation } from '../i18n/translations';
import { database } from '../lib/firebase';
import { ref, push, serverTimestamp } from 'firebase/database';

const ReportModal: React.FC = () => {
  const isOpen = useMapStore(state => state.isReportModalOpen);
  const context = useMapStore(state => state.reportContext);
  const setReportModal = useMapStore(state => state.setReportModal);
  const { t, language } = useTranslation();
  const [correction, setCorrection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

  const handleSend = async () => {
    if (!database || !correction.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // 1. Save to Firebase Realtime Database
      const reportsRef = ref(database, 'reports');
      await push(reportsRef, {
        type: context.type,
        featureData: context.data,
        correction: correction,
        timestamp: serverTimestamp(),
        language: language,
        status: 'pending'
      });

      // 2. Show Success state
      setIsSuccess(true);
      
      // We wait a bit then close
      setTimeout(() => {
        setReportModal(false);
        setCorrection('');
        setIsSubmitting(false);
        setIsSuccess(false);
      }, 2000);

    } catch (error) {
      console.error('Error submitting report:', error);
      setIsSubmitting(false);
      alert('Failed to submit report. Please try again.');
    }
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
            <button 
              className="btn-secondary" 
              onClick={() => setReportModal(false)}
              disabled={isSubmitting || isSuccess}
            >
              {t('CANCEL')}
            </button>
            <button 
              className={`btn-primary ${isSuccess ? 'success' : ''}`}
              onClick={handleSend}
              disabled={!correction.trim() || isSubmitting || isSuccess}
              style={{
                backgroundColor: isSuccess ? '#22c55e' : undefined,
                transition: 'all 0.3s ease'
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                   <Activity size={16} className="animate-spin" />
                   {t('SENDING') || 'Sending...'}
                </span>
              ) : isSuccess ? (
                <span className="flex items-center gap-2">
                   <CheckCircle2 size={16} />
                   {t('SENT') || 'Sent!'}
                </span>
              ) : (
                <>
                  <Send size={16} />
                  {language === 'ta' ? 'தகவலைச் சமர்ப்பி' : 'Submit Report'}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReportModal;
