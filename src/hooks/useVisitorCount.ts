import { useState, useEffect } from 'react';
import { ref, onValue, runTransaction } from 'firebase/database';
import { database } from '../lib/firebase';

export const useVisitorCount = () => {
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  useEffect(() => {
    if (!database) return;

    const statsRef = ref(database, 'stats/visitor_count');

    // 1. Increment count once per session
    const hasVisited = sessionStorage.getItem('nm_visited');
    if (!hasVisited) {
      runTransaction(statsRef, (currentCount) => {
        return (currentCount || 0) + 1;
      }).then(() => {
        sessionStorage.setItem('nm_visited', 'true');
      }).catch(err => {
        console.warn('[VisitorCount] Failed to increment:', err);
      });
    }

    // 2. Subscribe to live updates
    const unsubscribe = onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      if (typeof data === 'number') {
        setVisitorCount(data);
      }
    });

    return () => unsubscribe();
  }, []);

  return visitorCount;
};
