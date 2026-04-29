import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { APP_VERSION } from '../constants';
import UpdateNotification from './UpdateNotification';

const PWAUpdater: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [availableVersion, setAvailableVersion] = useState<string | undefined>(undefined);
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        setInterval(() => {
          r.update();
        }, 15 * 60 * 1000);
      }
    },
    onNeedRefresh() {
      fetch('/version.json', { cache: 'no-cache' })
        .then(res => res.json())
        .then(data => setAvailableVersion(data.version))
        .catch(() => setAvailableVersion(undefined));
    }
  });

  const handleUpdate = async () => {
    setIsUpdating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    updateServiceWorker(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch('/version.json', { cache: 'no-cache' });
        const data = await res.json();
        if (data.version && data.version !== APP_VERSION && data.version !== dismissedVersion) {
          setAvailableVersion(data.version);
          setNeedRefresh(true);
        }
      } catch (err) {
        console.error('[VersionControl] Failed to poll version:', err);
      }
    };

    const interval = setInterval(checkVersion, 5 * 60 * 1000);
    checkVersion();

    return () => clearInterval(interval);
  }, [setNeedRefresh, dismissedVersion]);

  return (
    <UpdateNotification 
      show={needRefresh} 
      isUpdating={isUpdating}
      currentVersion={APP_VERSION}
      availableVersion={availableVersion}
      onRefresh={handleUpdate} 
      onClose={() => {
        if (availableVersion) {
          setDismissedVersion(availableVersion);
        }
        setNeedRefresh(false);
      }}
    />
  );
};

export default PWAUpdater;
