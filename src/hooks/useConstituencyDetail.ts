import { useState, useEffect } from 'react';
import { useMapStore } from '../store/useMapStore';
import type { DetailedElectionResult } from '../types/gis';

export const useConstituencyDetail = (constituencyId: number | null, constituencyName: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { detailedElectionResults, setDetailedElectionResult } = useMapStore();

  useEffect(() => {
    if (!constituencyId) return;

    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch structured JSON from our Cloud Function
        const response = await fetch(`/api/election-detail?id=${constituencyId}&name=${encodeURIComponent(constituencyName)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        
        // Update global results cache
        if (data.candidates && data.candidates.length > 0) {
          setDetailedElectionResult(constituencyId, data);
        }
      } catch (err) {
        console.error('Error fetching election details:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [constituencyId, constituencyName, setDetailedElectionResult]);

  return {
    detail: constituencyId ? detailedElectionResults[constituencyId] : null,
    isLoading,
    error
  };
};
