import type { GisFeature } from '../../types/gis';

export interface ScoredSuggestion extends GisFeature {
  score: number;
  suggestionType?: 'PINCODE' | 'PDS_SHOP' | 'TNEB_SECTION' | 'DISTRICT' | 'CONSTITUENCY' | 'POLICE_STATION' | 'HEALTH_FACILITY' | 'COORDINATES' | 'GLOBAL_PLACE';
}

export async function fetchGoogleGeocode(query: string): Promise<ScoredSuggestion[]> {
  if (query.length < 4) return [];

  try {
    // Determine the origin to handle dev vs prod environments correctly
    const origin = self.location.origin.includes('localhost') 
      ? 'http://127.0.0.1:5001/namma-map-407ca/asia-south1/geocodeAddress' 
      : '/api/geocode';

    const url = `${origin}?address=${encodeURIComponent(query)}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      return data.results.map((res: any) => {
        const mainText = res.address_components[0]?.long_name || res.formatted_address;
        const secondaryText = res.formatted_address.replace(mainText + ', ', '').replace(mainText, '');

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [res.geometry.location.lng, res.geometry.location.lat]
          },
          properties: {
            name: res.formatted_address,
            main_text: mainText,
            secondary_text: secondaryText || 'Tamil Nadu, India',
            place_id: res.place_id,
            lat: res.geometry.location.lat,
            lng: res.geometry.location.lng,
            viewport: res.geometry.viewport,
            bounds: res.geometry.bounds
          },
          score: 40,
          suggestionType: 'GLOBAL_PLACE'
        } as ScoredSuggestion;
      });
    }
  } catch (e) {
    console.warn('[Worker] Google Geocode failed', e);
  }
  return [];
}
