import { parseEciHtml } from '../parser/htmlParser';

interface Candidate {
  name: string;
  party: string;
  votes: number;
  status: 'Leading' | 'Won' | 'Trailing';
}

interface ConstituencyData {
  constituencyId: number;
  candidates: Candidate[];
  lastUpdated: number;
}

// In-memory cache for fast response times
const cache = new Map<string, { data: ConstituencyData; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

export const fetchConstituencyData = async (id: string): Promise<ConstituencyData> => {
  const now = Date.now();
  
  // Check cache
  const cached = cache.get(id);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const url = `https://results.eci.gov.in/ResultAcGenMay2026/candidateswise-S22${id}.htm`;
  
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'referer': 'https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S22.htm'
    }
  });

  if (!response.ok) {
    throw new Error(`ECI API responded with status: ${response.status}`);
  }

  const html = await response.text();
  
  // Parse HTML using our isolated parser
  const candidates = parseEciHtml(html);
  
  const data: ConstituencyData = {
    constituencyId: Number(id),
    candidates,
    lastUpdated: now
  };

  // Update cache
  cache.set(id, {
    data,
    expiresAt: now + CACHE_TTL_MS
  });

  return data;
};
