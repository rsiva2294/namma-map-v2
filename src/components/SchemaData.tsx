import React from 'react';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '../constants/site';

const SchemaData: React.FC = () => {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        "url": SITE_URL,
        "name": SITE_NAME,
        "description": SITE_DESCRIPTION,
        "publisher": {
          "@type": "Organization",
          "name": SITE_NAME
        },
        "inLanguage": "en-US"
      },
      {
        "@type": "GovernmentService",
        "serviceType": "Civic Jurisdiction Locator",
        "provider": {
          "@type": "GovernmentOrganization",
          "name": "Government of Tamil Nadu (Data Source)",
          "address": {
            "@type": "PostalAddress",
            "addressRegion": "Tamil Nadu",
            "addressCountry": "IN"
          }
        },
        "description": "Spatial tool to locate Pincodes, Ration Shops, TNEB Section Offices, Health Facilities, Police Jurisdictions, and Constituencies across Tamil Nadu with Global Geocoding fallback.",
        "areaServed": {
          "@type": "AdministrativeArea",
          "name": "Tamil Nadu"
        }
      },
      {
        "@type": "Dataset",
        "name": "Tamil Nadu Civic Jurisdictions & Services Dataset",
        "description": "Aggregated spatial data for administrative boundaries, utility sections, and public distribution centers in Tamil Nadu.",
        "license": "https://data.gov.in/open-government-data-ogd-license-india",
        "creator": {
          "@type": "Person",
          "name": "Sivakaminathan Muthusamy"
        },
        "spatialCoverage": {
          "@type": "Place",
          "name": "Tamil Nadu, India",
          "geo": {
            "@type": "GeoShape",
            "box": "8.0 76.0 13.5 80.5"
          }
        },
        "variableMeasured": [
          "Pincode Boundaries",
          "TNEB Section Jurisdictions",
          "Ration Shop Locations",
          "Health Facility Locations",
          "Police Station Jurisdictions",
          "Local Body Boundaries (Corporations, Municipalities, Panchayats)",
          "Assembly & Parliamentary Constituencies"
        ]
      }
    ]
  };

  return (
    <script type="application/ld+json">
      {JSON.stringify(schema)}
    </script>
  );
};

export default SchemaData;
