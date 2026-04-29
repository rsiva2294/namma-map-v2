import { getLayerSlug } from './routeUtils';
import type { GisFeature, ServiceLayer } from '../types/gis';

/**
 * Generates a unique, URL-safe key for a GIS feature to be used in sharing.
 */
export const getFeatureShareKey = (feature: GisFeature, layer: ServiceLayer): string | null => {
  const p = feature.properties;
  if (!p) return null;

  switch (layer) {
    case 'PINCODE':
    case 'PDS':
    case 'POLICE':
    case 'HEALTH':
    case 'TNEB':
    case 'CONSTITUENCY':
    case 'LOCAL_BODIES_V2':
      return (p.pincode || p.PIN_CODE || p.pin_code || p.Pincode || '').toString() || null;
    
    default:
      return null;
  }
};

/**
 * Generates a full shareable URL for a feature.
 */
export const getFeatureShareUrl = (feature: GisFeature, layer: ServiceLayer): string | null => {
  const key = getFeatureShareKey(feature, layer);
  if (!key) return null;

  const baseUrl = window.location.origin + window.location.pathname;
  const url = new URL(baseUrl);
  
  // Set layer path if not already correct (RouteManager will handle syncing)
  // But for the link itself, we want it to be direct
  url.pathname = `/${getLayerSlug(layer)}`;
  url.searchParams.set('f', key);
  
  return url.toString();
};
