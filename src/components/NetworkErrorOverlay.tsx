import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useMapStore } from '../store/useMapStore';
import { useTranslation } from '../i18n/translations';

const NetworkErrorOverlay: React.FC = () => {
  const { hasNetworkError, setHasNetworkError } = useMapStore();
  const { t } = useTranslation();

  if (!hasNetworkError) return null;

  const handleRetry = () => {
    setHasNetworkError(false);
    window.location.reload();
  };

  return (
    <div className="network-error-overlay">
      <div className="network-error-content glass">
        <WifiOff size={48} className="error-icon" />
        <h3>{t('NETWORK_ERROR_TITLE')}</h3>
        <p>{t('NETWORK_ERROR_DESC')}</p>
        <button onClick={handleRetry} className="retry-button">
          <RefreshCw size={18} />
          {t('RETRY')}
        </button>
      </div>
    </div>
  );
};

export default NetworkErrorOverlay;
