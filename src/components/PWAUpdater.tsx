import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { APP_VERSION } from '../constants';
import UpdateNotification from './UpdateNotification';

const DISMISSED_VERSION_KEY = 'nammaMap:lastDismissedUpdateVersion';

const getStoredDismissedVersion = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(DISMISSED_VERSION_KEY);
};

const PWAUpdater: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [availableVersion, setAvailableVersion] = useState<string | undefined>(undefined);
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(getStoredDismissedVersion);

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
        setAvailableVersion(data.version);
      } catch (err) {
        console.error('[VersionControl] Failed to poll version:', err);
      }
    };

    const interval = setInterval(checkVersion, 5 * 60 * 1000);
    checkVersion();

    return () => clearInterval(interval);
  }, []);

  const shouldShowUpdate =
    Boolean(needRefresh) &&
    Boolean(availableVersion) &&
    availableVersion !== APP_VERSION &&
    availableVersion !== dismissedVersion;

  return (
    <UpdateNotification 
      show={shouldShowUpdate} 
      isUpdating={isUpdating}
      currentVersion={APP_VERSION}
      availableVersion={availableVersion}
      onRefresh={handleUpdate} 
      onClose={() => {
        if (availableVersion) {
          setDismissedVersion(availableVersion);
          window.localStorage.setItem(DISMISSED_VERSION_KEY, availableVersion);
        }
        setNeedRefresh(false);
      }}
    />
  );
};

export default PWAUpdater;
