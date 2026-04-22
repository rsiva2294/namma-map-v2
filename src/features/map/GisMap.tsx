import React, { useEffect } from 'react';
import { MapContainer, TileLayer, ZoomControl, GeoJSON, useMap, CircleMarker, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGisWorker } from '../../hooks/useGisWorker';
import { useMapStore } from '../../store/useMapStore';

const MapController: React.FC<{ result: any; geometry: any }> = ({ result, geometry }) => {
  const map = useMap();
  useEffect(() => {
    if (result) {
      const bounds = L.geoJSON(result).getBounds();
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else if (geometry) {
      const bounds = L.geoJSON(geometry).getBounds();
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [result, geometry, map]);
  return null;
};

const MapEvents: React.FC<{ onResolve: (lat: number, lng: number) => void; activeLayer: string }> = ({ onResolve, activeLayer }) => {
  useMapEvents({
    click: (e) => {
      if (activeLayer === 'TNEB') {
        onResolve(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

const GisMap: React.FC = () => {
  const { isReady, loadDistricts, loadPincodes, loadTneb, resolveLocation, executeSearch } = useGisWorker();
  const { activeLayer, searchQuery, searchResult, pdsData, activeDistrict, jurisdictionGeometry } = useMapStore();

  useEffect(() => {
    if (isReady) {
      loadDistricts();
      loadPincodes();
      loadTneb();
    }
  }, [isReady]);

  // Handle Search Trigger (Pincode or Text)
  useEffect(() => {
    if (searchQuery && searchQuery.length >= 3) {
      executeSearch(searchQuery);
    }
  }, [searchQuery]);

  const pincodeStyle = {
    fillColor: 'transparent',
    weight: 2.5,
    opacity: 0.9,
    color: 'white',
    fillOpacity: 0.05
  };

  const jurisdictionStyle = {
    fillColor: 'var(--accent)',
    weight: 2,
    opacity: 1,
    color: 'var(--accent-hover)',
    fillOpacity: 0.2
  };

  return (
    <MapContainer 
      center={[11.1271, 78.6569]} 
      zoom={7} 
      preferCanvas={true}
      scrollWheelZoom={true}
      zoomControl={false}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      <MapEvents onResolve={resolveLocation} activeLayer={activeLayer} />
      
      {searchResult && (
        <GeoJSON 
          key={`search-${searchQuery}-${searchResult.properties.PIN_CODE || searchResult.properties.NAME}`}
          data={searchResult} 
          style={pincodeStyle} 
        />
      )}

      {activeLayer === 'TNEB' && jurisdictionGeometry && (
        <GeoJSON 
          key={`tneb-${jurisdictionGeometry.type}-${JSON.stringify(jurisdictionGeometry.coordinates[0][0])}`}
          data={jurisdictionGeometry} 
          style={jurisdictionStyle} 
        />
      )}

      {activeLayer === 'PDS' && pdsData && pdsData.features.map((f: any, i: number) => {
        const [lng, lat] = f.geometry.coordinates;
        return (
          <CircleMarker
            key={`pds-${activeDistrict}-${i}`}
            center={[lat, lng]}
            radius={4}
            pathOptions={{
              fillColor: '#22c55e',
              fillOpacity: 0.9,
              color: 'white',
              weight: 1
            }}
          >
            <Tooltip direction="top" offset={[0, -5]} opacity={1}>
              <div style={{ padding: '5px' }}>
                <strong>{f.properties.name || 'PDS Shop'}</strong>
                <br />
                <small>{f.properties.address || 'Tamil Nadu'}</small>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}

      <MapController result={searchResult} geometry={jurisdictionGeometry} />
      <ZoomControl position="bottomright" />
    </MapContainer>
  );
};

export default GisMap;
