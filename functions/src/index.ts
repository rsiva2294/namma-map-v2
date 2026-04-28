import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as cors from "cors";

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
