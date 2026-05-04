import { useState, useEffect } from 'react';

export interface Candidate {
  name: string;
  party: string;
  votes: number;
  status: 'Leading' | 'Won' | 'Trailing';
}

export interface ConstituencyData {
  constituencyId: number;
  candidates: Candidate[];
  lastUpdated: number;
}

export const useConstituencyDetail = (constituencyId: number | string | null | undefined) => {
  const [data, setData] = useState<ConstituencyData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!constituencyId) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // In local development, try to hit the emulator if available, otherwise just use relative path
        // which will fall back to Vite proxy or standard handling
        const url = import.meta.env.DEV
          ? `http://127.0.0.1:5001/${import.meta.env.VITE_FIREBASE_PROJECT_ID}/asia-south1/constituencyApi/api/constituency/${constituencyId}`
          : `/api/constituency/${constituencyId}`;
          
        const response = await fetch(url).catch(() => {
          // If emulator is not running, fallback to relative path
          return fetch(`/api/constituency/${constituencyId}`);
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch constituency details: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Re-fetch every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [constituencyId]);

  return { data, loading, error };
};
