import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useMapStore } from '../../store/useMapStore';
import { useTranslation } from '../../i18n/translations';
import { getLayerName, getLayerDescription, getLayerSlug } from '../../utils/routeUtils';
import { SITE_DESCRIPTION, SITE_NAME, buildSiteUrl } from '../../constants/site';

const SEO: React.FC = () => {
  const { language: _language } = useTranslation();
  const activeLayer = useMapStore(state => state.activeLayer);
  const activeDistrict = useMapStore(state => state.activeDistrict);
  const searchResult = useMapStore(state => state.searchResult);

  const getPageTitle = () => {
    const layerName = getLayerName(activeLayer);
    
    if (searchResult) {
      const locationName = searchResult.properties.office_name || 
                          searchResult.properties.district || 
                          searchResult.properties.NAME || 
                          (searchResult.properties.pin_code || searchResult.properties.PIN_CODE);
      return `${layerName} in ${locationName} | NammaMap`;
    }

    if (activeDistrict) {
      return `${layerName} in ${activeDistrict} District | NammaMap`;
    }
    
    return `${SITE_NAME} | Tamil Nadu ${layerName} Locator`;
  };

  const getPageUrl = () => {
    const layerSlug = getLayerSlug(activeLayer);
    const districtPart = activeDistrict ? `/${encodeURIComponent(activeDistrict)}` : '';
    return buildSiteUrl(`/${layerSlug}${districtPart}`);
  };

  const pageTitle = getPageTitle();
  const pageUrl = getPageUrl();
  const layerName = getLayerName(activeLayer);
  const layerDesc = getLayerDescription(activeLayer);
  const pageDescription = searchResult
    ? `Find ${layerName} details for ${searchResult.properties.office_name || searchResult.properties.district || searchResult.properties.NAME || activeDistrict || 'Tamil Nadu'} with precision GIS mapping and instant search.`
    : activeDistrict
      ? `Find ${layerDesc} across ${activeDistrict} District with precision GIS mapping and global search.`
      : `${SITE_DESCRIPTION} Explore Tamil Nadu with precision GIS mapping and global search.`;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
      <link rel="canonical" href={pageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />
      
      {/* OpenGraph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={buildSiteUrl('/branding/og-image.png')} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:site" content="@NammaMap" />
      <meta property="twitter:url" content={pageUrl} />
      <meta property="twitter:title" content={pageTitle} />
      <meta property="twitter:description" content={pageDescription} />
      <meta property="twitter:image" content={buildSiteUrl('/branding/og-image.png')} />
    </Helmet>
  );
};

export default SEO;
