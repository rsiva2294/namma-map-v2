import { useState, useEffect } from 'react';
import { ref, onValue, runTransaction } from 'firebase/database';
import { database } from '../lib/firebase';

const STORAGE_KEY_PREFIX = 'nammamap_verified_';

const sanitizePath = (path: string) => path.replace(/[.#$[\]]/g, '_');

export const useVerification = (featureId: string | undefined) => {
  const [count, setCount] = useState<number>(0);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!featureId || !database) return;

    // Check local storage for previous verification
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${featureId}`);
    setIsVerified(!!stored);

    // Subscribe to real-time count
    const countRef = ref(database, `verifications/${sanitizePath(featureId)}`);
    const unsubscribe = onValue(countRef, (snapshot) => {
      setCount(snapshot.val() || 0);
      setIsLoading(false);
    }, (error) => {
      console.error('Firebase read error:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [featureId]);

  const verify = async () => {
    if (!featureId || !database || isVerified) return;

    try {
      const countRef = ref(database, `verifications/${sanitizePath(featureId)}`);
      
      // Atomic increment using transaction
      await runTransaction(countRef, (currentCount) => {
        return (currentCount || 0) + 1;
      });

      // Persist locally
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${featureId}`, 'true');
      setIsVerified(true);
      return true;
    } catch (error) {
      console.error('Verification failed:', error);
      return false;
    }
  };

  return { count, isVerified, verify, isLoading };
};
