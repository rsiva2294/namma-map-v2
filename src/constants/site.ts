export const SITE_NAME = 'NammaMap';
export const SITE_DOMAIN = 'nammamap.in';
export const SITE_URL = `https://${SITE_DOMAIN}`;
export const SITE_DESCRIPTION =
  'Tamil Nadu civic GIS portal for finding pincodes, PDS ration shops, TNEB offices, police stations, health facilities, and local bodies.';

export const LEGACY_HOSTNAMES = ['namma-map.web.app', 'namma-map.firebaseapp.com'];

export const buildSiteUrl = (path = '/') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, SITE_URL).toString();
};
