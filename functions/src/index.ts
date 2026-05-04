import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import * as cors from "cors";

// Initialize admin SDK for RTDB access
admin.initializeApp();

// Define the secret parameter. The value will be injected securely at runtime
// from Firebase Secret Manager.
const googleMapsApiKey = defineSecret("GOOGLE_MAPS_API_KEY");

// Initialize CORS middleware to allow requests from any origin (or specify the domain)
const corsHandler = cors({ origin: true });

export const geocodeAddress = onRequest(
  { 
    secrets: [googleMapsApiKey], 
    cors: false, // We'll handle CORS manually with the middleware to ensure preflight works
    region: "asia-south1" // Closer to Tamil Nadu users for lower latency
  }, 
  (req, res) => {
    corsHandler(req, res, async () => {
      const address = req.query.address as string;

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
      } catch (error) {
        console.error("Geocoding error:", error);
        res.status(500).send({ error: "Failed to resolve address" });
      }
    });
  }
);

export const fetchElectionResults = onRequest(
  { 
    cors: true,
    region: "asia-south1"
  }, 
  async (req, res) => {
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
    } catch (error) {
      console.error("Election fetch error:", error);
      res.status(500).send({ error: "Failed to fetch election results" });
    }
  }
);

/**
 * Record a visitor's session and IP for strict analytics.
 * - Increments total_unique_ips if IP is new.
 * - Increments daily_visits for every session.
 */
export const recordVisit = onRequest(
  { 
    cors: true,
    region: "asia-south1"
  }, 
  async (req, res) => {
    try {
      // 1. Extract IP address (handles proxies)
      const ipRaw = (req.headers['x-forwarded-for'] as string || req.ip || 'unknown');
      const ip = ipRaw.split(',')[0].trim();
      const escapedIp = ip.replace(/\./g, '_').replace(/[:[\]]/g, '_'); // Escape dots and IPv6 chars for RTDB
      
      // 2. Determine Date in IST (Asia/Kolkata)
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
      
      const db = admin.database();
      
      // 3. Unique IP Tracking (Total)
      const ipRef = db.ref(`visitor_ips/${escapedIp}`);
      const ipSnapshot = await ipRef.get();
      
      if (!ipSnapshot.exists()) {
        await ipRef.set({ 
          firstSeen: admin.database.ServerValue.TIMESTAMP,
          ip: ip // Store original for debugging if needed (RTDB keys are escaped)
        });
        await db.ref('stats/total_unique_ips').transaction(c => (c || 0) + 1);
      }
      
      // 4. Daily Session Tracking
      await db.ref(`stats/daily_visits/${today}`).transaction(c => (c || 0) + 1);
      
      res.status(200).send({ success: true, ip_status: ipSnapshot.exists() ? 'returning' : 'new' });
    } catch (error) {
      console.error("Visit recording error:", error);
      res.status(500).send({ error: "Internal tracking error" });
    }
  }
);

import constituencyApp from "./constituencyApi/app";

export const constituencyApi = onRequest(
  {
    cors: false, // CORS is handled in the Express app
    region: "asia-south1"
  },
  constituencyApp
);
