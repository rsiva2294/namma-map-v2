import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useMapStore } from '../../store/useMapStore';
import { useTranslation } from '../../i18n/translations';
import { getLayerName, getLayerDescription, getLayerSlug } from '../../utils/routeUtils';

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
    
    return `NammaMap | Tamil Nadu ${layerName} Locator`;
  };

  const getPageUrl = () => {
    const layerSlug = getLayerSlug(activeLayer);
    const districtPart = activeDistrict ? `/${encodeURIComponent(activeDistrict)}` : '';
    return `https://namma-map.web.app/${layerSlug}${districtPart}`;
  };

  const pageTitle = getPageTitle();
  const pageUrl = getPageUrl();
  const layerName = getLayerName(activeLayer);
  const layerDesc = getLayerDescription(activeLayer);

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={`Find ${layerDesc} across ${activeDistrict || 'Tamil Nadu'} with precision GIS mapping and global search.`} />
      <link rel="canonical" href={pageUrl} />
      
      {/* OpenGraph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={`Explore Tamil Nadu's civic infrastructure with NammaMap. Find ${layerName}, police stations, constituencies, and local bodies instantly.`} />
      <meta property="og:image" content="https://namma-map.web.app/branding/og-image.png" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={pageUrl} />
      <meta property="twitter:title" content={pageTitle} />
      <meta property="twitter:description" content={`Explore Tamil Nadu's civic infrastructure with NammaMap. Find ${layerName}, police stations, constituencies, and local bodies instantly.`} />
      <meta property="twitter:image" content="https://namma-map.web.app/branding/og-image.png" />
    </Helmet>
  );
};

export default SEO;
