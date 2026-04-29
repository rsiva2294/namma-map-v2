import type { ServiceLayer } from '../types/gis';

/**
 * Maps internal ServiceLayer constants to URL slugs.
 */
const LAYER_SLUG_MAP: Record<ServiceLayer, string> = {
  'PINCODE': 'pincode',
  'PDS': 'pds',
  'TNEB': 'tneb',
  'CONSTITUENCY': 'constituency',
  'POLICE': 'police',
  'HEALTH': 'health',
  'LOCAL_BODIES_V2': 'local-bodies'
};

/**
 * Inverse map for URL -> ServiceLayer
 */
const SLUG_LAYER_MAP: Record<string, ServiceLayer> = Object.entries(LAYER_SLUG_MAP).reduce(
  (acc, [layer, slug]) => {
    acc[slug] = layer as ServiceLayer;
    return acc;
  },
  {} as Record<string, ServiceLayer>
);

/**
 * Gets the URL slug for a service layer.
 */
export const getLayerSlug = (layer: ServiceLayer): string => {
  return LAYER_SLUG_MAP[layer] || layer.toLowerCase();
};

/**
 * Gets the service layer for a URL slug.
 */
export const getLayerFromSlug = (slug: string): ServiceLayer | null => {
  const normalizedSlug = slug.toLowerCase();
  
  // Direct match from map
  if (SLUG_LAYER_MAP[normalizedSlug]) {
    return SLUG_LAYER_MAP[normalizedSlug];
  }
  
  // Legacy support for local_bodies_v2
  if (normalizedSlug === 'local_bodies_v2') {
    return 'LOCAL_BODIES_V2';
  }
  
  // Fallback to uppercase
  return normalizedSlug.toUpperCase() as ServiceLayer;
};

/**
 * List of valid layer slugs for routing.
 */
export const VALID_LAYER_SLUGS = Object.values(LAYER_SLUG_MAP);
