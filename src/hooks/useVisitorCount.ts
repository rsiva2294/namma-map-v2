import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../lib/firebase';

export interface VisitorStats {
  total: number | null;
  today: number | null;
}

export const useVisitorCount = (): VisitorStats => {
  const [stats, setStats] = useState<VisitorStats>({ total: null, today: null });

  useEffect(() => {
    if (!database) return;

    // 1. Determine Today's Key in IST (matches Cloud Function)
    const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    
    const totalRef = ref(database, 'stats/total_unique_ips');
    const dailyRef = ref(database, `stats/daily_visits/${todayKey}`);

    // 2. Trigger tracking once per session via Cloud Function
    const hasVisited = sessionStorage.getItem('nm_visited');
    if (!hasVisited) {
      // We use the relative /api path which is proxied to the emulator in dev 
      // and handled by hosting rewrites in production.
      fetch('/api/record-visit', { 
        method: 'POST', 
        mode: 'no-cors' 
      }).then(() => {
        sessionStorage.setItem('nm_visited', 'true');
      }).catch(err => {
        console.warn('[VisitorCount] Cloud tracking skipped:', err);
      });
    }

    // 3. Subscribe to live updates for both counters
    const unsubTotal = onValue(totalRef, (snapshot) => {
      setStats(prev => ({ ...prev, total: snapshot.val() }));
    });

    const unsubDaily = onValue(dailyRef, (snapshot) => {
      setStats(prev => ({ ...prev, today: snapshot.val() }));
    });

    return () => {
      unsubTotal();
      unsubDaily();
    };
  }, []);

  return stats;
};
