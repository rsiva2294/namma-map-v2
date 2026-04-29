import type { ServiceLayer } from '../types/gis';
import { LAYER_CONFIGS } from '../constants/layers';
import { translations } from '../i18n/translations';

/**
 * Maps internal ServiceLayer constants to URL slugs.
 */
const LAYER_SLUG_MAP: Record<ServiceLayer, string> = Object.entries(LAYER_CONFIGS).reduce(
  (acc, [layer, config]) => {
    acc[layer as ServiceLayer] = config.slug;
    return acc;
  },
  {} as Record<ServiceLayer, string>
);

/**
 * Inverse map for URL -> ServiceLayer
 */
const SLUG_LAYER_MAP: Record<string, ServiceLayer> = Object.entries(LAYER_CONFIGS).reduce(
  (acc, [layer, config]) => {
    acc[config.slug] = layer as ServiceLayer;
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
 * Gets the human-readable name for a service layer.
 */
export const getLayerName = (layer: ServiceLayer): string => {
  return LAYER_CONFIGS[layer]?.name || layer;
};

/**
 * Gets the description for a service layer.
 */
export const getLayerDescription = (layer: ServiceLayer): string => {
  return LAYER_CONFIGS[layer]?.description || '';
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
  
  // Strict fallback
  const fallback = normalizedSlug.toUpperCase() as ServiceLayer;
  return LAYER_CONFIGS[fallback] ? fallback : null;
};

/**
 * Resolves a translated route name for SEO titles.
 */
export const resolveRouteName = (layer: ServiceLayer, lang: 'en' | 'ta'): string => {
  const layerTranslations = translations[lang] as any;
  return layerTranslations[layer] || LAYER_CONFIGS[layer]?.name || layer;
};

/**
 * List of valid layer slugs for routing.
 */
export const VALID_LAYER_SLUGS = Object.values(LAYER_SLUG_MAP);

