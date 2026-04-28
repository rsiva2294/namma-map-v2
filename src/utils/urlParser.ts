/**
 * Extracts coordinates from various Google Maps URL formats.
 * 
 * Supported formats:
 * - https://www.google.com/maps/@13.0827,80.2707,15z
 * - https://www.google.com/maps/place/Chennai,+Tamil+Nadu/@13.0827,80.2707,15z/...
 * - https://www.google.com/maps?q=13.0827,80.2707
 * - https://www.google.com/maps?ll=13.0827,80.2707
 * - https://maps.app.goo.gl/ (Limited support, only if coordinates are in the URL after redirect or fragment)
 */
export const extractCoordinatesFromUrl = (url: string): { lat: number; lng: number } | null => {
  try {
    const decodedUrl = decodeURIComponent(url);
    
    // 1. Check for @lat,lng (most common in web URLs)
    const atMatch = decodedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      return {
        lat: parseFloat(atMatch[1]),
        lng: parseFloat(atMatch[2])
      };
    }

    // 2. Check for query parameters q=lat,lng or ll=lat,lng
    const urlObj = new URL(url);
    const q = urlObj.searchParams.get('q') || urlObj.searchParams.get('ll') || urlObj.searchParams.get('query');
    if (q) {
      const qMatch = q.match(/(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (qMatch) {
        return {
          lat: parseFloat(qMatch[1]),
          lng: parseFloat(qMatch[2])
        };
      }
    }

    // 3. Check for lat/lng in the path segments (some mobile shared links)
    const pathMatch = decodedUrl.match(/place\/.*\/(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (pathMatch) {
      return {
        lat: parseFloat(pathMatch[1]),
        lng: parseFloat(pathMatch[2])
      };
    }

    return null;
  } catch (e) {
    console.error('[UrlParser] Failed to parse URL:', e);
    return null;
  }
};

/**
 * Validates if a coordinate is roughly within Tamil Nadu.
 * TN Bounding Box (Approximate):
 * Lat: 8.0 to 14.0
 * Lng: 76.0 to 81.0
 */
export const isWithinTamilNadu = (lat: number, lng: number): boolean => {
  return lat >= 8.0 && lat <= 14.0 && lng >= 76.0 && lng <= 81.0;
};
