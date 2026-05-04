import { useEffect, useCallback, useRef } from 'react';
import { useMapStore } from '../store/useMapStore';
import type { ElectionResult } from '../types/gis';
import { PARTY_COLORS } from '../types/gis';

const ECI_LIVE_URL = import.meta.env.DEV 
  ? '/eci-api/ResultAcGenMay2026/election-json-S22-live.json'
  : '/api/election';
const POLLING_INTERVAL = 30000; // 30 seconds

export const useElectionResults = () => {
  const { setElectionResults, setIsElectionLive, activeLayer } = useMapStore();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      const response = await fetch(ECI_LIVE_URL);
      if (!response.ok) throw new Error('Failed to fetch ECI results');
      const data = await response.json();
      
      const tnData = data.S22;
      if (!tnData) return;

      const results: Record<number, ElectionResult> = {};
      
      // chartData: [party, stateCode, constituencyId, candidateName, color]
      if (tnData.chartData) {
        (tnData.chartData as [string, string, number, string, string][]).forEach((item) => {
          const [party, , constId, candidate, colorCode] = item;
          
          // Skip "NA" (Not Available) entries which represent non-reporting constituencies
          if (party === 'NA' || candidate === 'NA') return;

          results[constId] = {
            party,
            candidate,
            color: PARTY_COLORS[party] || colorCode || '#94a3b8',
            status: 'LEADING', // Usually represents leads in this endpoint
            constituencyId: constId
          };
        });
      }

      setElectionResults(results);
      setIsElectionLive(Object.keys(results).length > 0);
    } catch (err) {
      console.error('Election data error:', err);
      // Keep existing results if fetch fails
    }
  }, [setElectionResults, setIsElectionLive]);

  useEffect(() => {
    if (activeLayer === 'CONSTITUENCY') {
      fetchResults();
      pollingRef.current = setInterval(fetchResults, POLLING_INTERVAL);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [activeLayer, fetchResults]);

  return { refresh: fetchResults };
};
