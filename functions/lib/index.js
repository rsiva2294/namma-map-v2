"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConstituencyDetail = exports.fetchElectionResults = exports.geocodeAddress = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const cors = require("cors");
const cheerio = require("cheerio");
// Define the secret parameter. The value will be injected securely at runtime
// from Firebase Secret Manager.
const googleMapsApiKey = (0, params_1.defineSecret)("GOOGLE_MAPS_API_KEY");
// Initialize CORS middleware to allow requests from any origin (or specify the domain)
const corsHandler = cors({ origin: true });
exports.geocodeAddress = (0, https_1.onRequest)({
    secrets: [googleMapsApiKey],
    cors: false, // We'll handle CORS manually with the middleware to ensure preflight works
    region: "asia-south1" // Closer to Tamil Nadu users for lower latency
}, (req, res) => {
    corsHandler(req, res, async () => {
        const address = req.query.address;
        if (!address) {
            res.status(400).send({ error: "Missing address parameter" });
            return;
        }
        try {
            const apiKey = googleMapsApiKey.value();
            if (!apiKey) {
                throw new Error("API Key not found");
            }
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&components=administrative_area:TN|country:IN`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Google API responded with status: ${response.status}`);
            }
            const data = await response.json();
            // Cache the response on the CDN to save costs and reduce latency
            res.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
            res.status(200).send(data);
        }
        catch (error) {
            console.error("Geocoding error:", error);
            res.status(500).send({ error: "Failed to resolve address" });
        }
    });
});
exports.fetchElectionResults = (0, https_1.onRequest)({
    cors: true,
    region: "asia-south1"
}, async (req, res) => {
    try {
        const url = "https://results.eci.gov.in/ResultAcGenMay2026/election-json-S22-live.json";
        // We add a browser-like User-Agent because some government sites block default node-fetch agents
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`ECI API responded with status: ${response.status}`);
        }
        const data = await response.json();
        // Short cache for live results (30 seconds) to match polling interval
        res.set("Cache-Control", "public, max-age=30, s-maxage=30");
        res.status(200).send(data);
    }
    catch (error) {
        console.error("Election fetch error:", error);
        res.status(500).send({ error: "Failed to fetch election results" });
    }
});
exports.getConstituencyDetail = (0, https_1.onRequest)({
    cors: true,
    region: "asia-south1",
    maxInstances: 10
}, async (req, res) => {
    try {
        const constituencyId = req.query.id;
        const constituencyName = req.query.name;
        if (!constituencyId) {
            res.status(400).send({ error: "Missing constituency id" });
            return;
        }
        const url = `https://results.eci.gov.in/ResultAcGenMay2026/candidateswise-S22${constituencyId}.htm`;
        console.log(`[ECI] Fetching details for ${constituencyName} (#${constituencyId}) from ${url}`);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://results.eci.gov.in/ResultAcGenMay2026/',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'DNT': '1'
            }
        });
        if (!response.ok) {
            console.error(`[ECI] Error ${response.status} fetching ${url}`);
            res.status(response.status).send({
                error: "ECI server error",
                status: response.status
            });
            return;
        }
        const html = await response.text();
        const $ = cheerio.load(html);
        const candidates = [];
        let totalMargin = 0;
        $(".cand-box").each((_, element) => {
            const name = $(element).find("h5").text().trim();
            const party = $(element).find("h6").text().trim();
            const statusElement = $(element).find(".status");
            const statusText = statusElement.text().trim().toLowerCase();
            const status = statusText.includes("leading") ? "leading" : "trailing";
            // Extract vote count and delta
            const votesText = $(element).find(".votes").text().trim();
            const votes = parseInt(votesText.replace(/,/g, ''), 10) || 0;
            const deltaText = statusElement.find("span").text().trim();
            const delta = parseInt(deltaText.replace(/[^\d]/g, ''), 10) || 0;
            if (name && party) {
                candidates.push({ name, party, votes, status, delta });
                if (status === "leading") {
                    totalMargin = delta;
                }
            }
        });
        // Sort by votes descending just in case
        candidates.sort((a, b) => b.votes - a.votes);
        const result = {
            constituencyId: parseInt(constituencyId, 10),
            constituencyName: constituencyName || "Unknown",
            candidates,
            margin: totalMargin,
            lastUpdated: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' })
        };
        // Cache for 30 seconds
        res.set("Cache-Control", "public, max-age=30, s-maxage=30");
        res.status(200).send(result);
    }
    catch (error) {
        console.error("[ECI] Critical Exception:", error);
        res.status(500).send({
            error: "Internal Processing Error",
            message: error?.message || String(error)
        });
    }
});
//# sourceMappingURL=index.js.map