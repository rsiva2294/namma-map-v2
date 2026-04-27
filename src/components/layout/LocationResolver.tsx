import React, { useState } from 'react';
import { MapPin, Link, X, Check, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../store/useMapStore';
import { useTranslation } from '../../i18n/translations';
import { extractCoordinatesFromUrl, isWithinTamilNadu } from '../../utils/urlParser';
import { trackEvent } from '../../lib/firebase';

interface LocationResolverProps {
  onClose: () => void;
}

const LocationResolver: React.FC<LocationResolverProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const setGlobalLocation = useMapStore(state => state.setGlobalLocation);
  
  const [activeTab, setActiveTab] = useState<'manual' | 'link'>('manual');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleManualResolve = () => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setError(t('INVALID_COORDINATES'));
      return;
    }

    if (!isWithinTamilNadu(latitude, longitude)) {
      setError(t('OUTSIDE_TN'));
      return;
    }

    setError(null);
    setGlobalLocation({
      lat: latitude,
      lng: longitude,
      source: 'manual',
      rawInput: `${lat},${lng}`
    });
    setSuccess(true);
    trackEvent('location_resolved', { source: 'manual' });
    setTimeout(onClose, 1000);
  };

  const handleLinkResolve = () => {
    const coords = extractCoordinatesFromUrl(link);
    if (!coords) {
      setError(t('INVALID_URL'));
      return;
    }

    if (!isWithinTamilNadu(coords.lat, coords.lng)) {
      setError(t('OUTSIDE_TN'));
      return;
    }

    setError(null);
    setGlobalLocation({
      lat: coords.lat,
      lng: coords.lng,
      source: 'link',
      rawInput: link
    });
    setSuccess(true);
    trackEvent('location_resolved', { source: 'link' });
    setTimeout(onClose, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="glass location-resolver-panel"
    >
      <div className="resolver-header">
        <div className="resolver-title">
          <Sparkles size={16} className="text-accent" />
          <span>{t('LOCATION_RESOLVER')}</span>
          <span className="badge-experimental">{t('EXPERIMENTAL')}</span>
        </div>
        <button className="close-btn" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <p className="resolver-desc">{t('GLOBAL_LOCATION_DESC')}</p>

      <div className="resolver-tabs">
        <button 
          className={`resolver-tab ${activeTab === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          <MapPin size={14} />
          {t('MANUAL_ENTRY')}
        </button>
        <button 
          className={`resolver-tab ${activeTab === 'link' ? 'active' : ''}`}
          onClick={() => setActiveTab('link')}
        >
          <Link size={14} />
          {t('MAPS_LINK')}
        </button>
      </div>

      <div className="resolver-content">
        {activeTab === 'manual' ? (
          <div className="manual-inputs">
            <div className="input-group">
              <label>{t('LATITUDE')}</label>
              <input 
                type="number" 
                placeholder="13.0827" 
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>{t('LONGITUDE')}</label>
              <input 
                type="number" 
                placeholder="80.2707" 
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
            </div>
            <button 
              className="resolve-btn" 
              onClick={handleManualResolve}
              disabled={!lat || !lng || success}
            >
              {success ? <Check size={18} /> : t('RESOLVE')}
            </button>
          </div>
        ) : (
          <div className="link-inputs">
            <div className="input-group">
              <label>{t('PASTE_LINK')}</label>
              <textarea 
                placeholder="https://maps.app.goo.gl/..." 
                value={link}
                onChange={(e) => setLink(e.target.value)}
                rows={3}
              />
            </div>
            <button 
              className="resolve-btn" 
              onClick={handleLinkResolve}
              disabled={!link || success}
            >
              {success ? <Check size={18} /> : t('EXTRACT')}
            </button>
          </div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="resolver-error"
            >
              <AlertCircle size={14} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default LocationResolver;
