import React from 'react';

const SchemaData: React.FC = () => {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://namma-map.web.app/#website",
        "url": "https://namma-map.web.app/",
        "name": "NammaMap",
        "description": "Independent Tamil Nadu Civic GIS Portal. Find Police Stations, TNEB Offices, Health Facilities, Ration Shops, and Local Bodies using pinpoint local or global search.",
        "publisher": {
          "@type": "Person",
          "name": "Sivakaminathan Muthusamy"
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
