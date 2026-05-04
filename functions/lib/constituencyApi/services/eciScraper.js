"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchStateSummary = exports.fetchConstituencyData = void 0;
const htmlParser_1 = require("../parser/htmlParser");
// In-memory cache for fast response times
const cache = new Map();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds
const fetchConstituencyData = async (id) => {
    const now = Date.now();
    // Check cache
    const cached = cache.get(id);
    if (cached && cached.expiresAt > now) {
        return cached.data;
    }
    const url = `https://results.eci.gov.in/ResultAcGenMay2026/candidateswise-S22${id}.htm`;
    const response = await fetch(url, {
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S22.htm'
        }
    });
    if (!response.ok) {
        throw new Error(`ECI API responded with status: ${response.status}`);
    }
    const html = await response.text();
    // Parse HTML using our isolated parser
    const candidates = (0, htmlParser_1.parseEciHtml)(html);
    const data = {
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
exports.fetchConstituencyData = fetchConstituencyData;
// In-memory cache for state summary
let stateSummaryCache = null;
const STATE_SUMMARY_CACHE_TTL_MS = 60 * 1000; // 60 seconds
const fetchStateSummary = async () => {
    const now = Date.now();
    if (stateSummaryCache && stateSummaryCache.expiresAt > now) {
        return stateSummaryCache.data;
    }
    const url = 'https://results.eci.gov.in/ResultAcGenMay2026/partywiseresult-S22.htm';
    const response = await fetch(url, {
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    if (!response.ok) {
        throw new Error(`ECI API responded with status: ${response.status}`);
    }
    const html = await response.text();
    const data = (0, htmlParser_1.parseStateSummaryHtml)(html);
    stateSummaryCache = {
        data,
        expiresAt: now + STATE_SUMMARY_CACHE_TTL_MS
    };
    return data;
};
exports.fetchStateSummary = fetchStateSummary;
//# sourceMappingURL=eciScraper.js.map