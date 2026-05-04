import { useState, useCallback, useEffect } from 'react';
import { useMapStore } from '../store/useMapStore';
import type { CandidateResult, DetailedElectionResult } from '../types/gis';

export const useConstituencyDetail = (constituencyId: number | null, constituencyName: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { detailedElectionResults, setDetailedElectionResult } = useMapStore();

  const fetchDetail = useCallback(async (id: number) => {
    // If we have data cached in the last 2 minutes, don't refetch
    // For simplicity, we just check if it exists for now.
    if (detailedElectionResults[id]) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use proxy to avoid CORS
      const url = `/eci-api/ResultAcGenMay2026/candidateswise-S22${id}.htm`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const candBoxes = doc.querySelectorAll('.cand-box');
      const candidates: CandidateResult[] = [];

      candBoxes.forEach((box) => {
        const name = box.querySelector('h5')?.textContent?.trim() || '';
        const party = box.querySelector('h6')?.textContent?.trim() || '';
        const statusEl = box.querySelector('.status');
        
        const isLeading = statusEl?.classList.contains('leading');
        const status: 'leading' | 'trailing' = isLeading ? 'leading' : 'trailing';
        
        // Extract votes and delta from .status div:nth-child(2)
        const votesDiv = statusEl?.querySelector('div:nth-child(2)');
        const votesText = votesDiv?.textContent || '';
        
        // Pattern: "Votes: 12345 ( +100 )" or similar
        const votesMatch = votesText.match(/(\d+)/);
        const deltaMatch = votesText.match(/\(\s*([+-]?\d+)\s*\)/);

        const votes = votesMatch ? parseInt(votesMatch[1]) : 0;
        const delta = deltaMatch ? parseInt(deltaMatch[1]) : 0;

        if (name && party) {
          candidates.push({ name, party, votes, status, delta });
        }
      });

      // Sort by votes descending
      candidates.sort((a, b) => b.votes - a.votes);

      const margin = candidates.length >= 2 ? candidates[0].votes - candidates[1].votes : 0;

      const result: DetailedElectionResult = {
        constituencyId: id,
        constituencyName,
        candidates: candidates.slice(0, 10), // Keep top 10 for detailed view
        margin,
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setDetailedElectionResult(id, result);
    } catch (err) {
      console.error('Error fetching election details:', err);
      setError('Detailed results unavailable');
    } finally {
      setIsLoading(false);
    }
  }, [detailedElectionResults, setDetailedElectionResult, constituencyName]);

  useEffect(() => {
    if (constituencyId) {
      fetchDetail(constituencyId);
    }
  }, [constituencyId, fetchDetail]);

  return {
    detail: constituencyId ? detailedElectionResults[constituencyId] : null,
    isLoading,
    error
  };
};
