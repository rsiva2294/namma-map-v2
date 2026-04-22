import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, ZoomControl, GeoJSON, useMap, CircleMarker, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGisWorker } from '../../hooks/useGisWorker';
import { useMapStore } from '../../store/useMapStore';

const MapController: React.FC<{ result: any }> = ({ result }) => {
  const map = useMap();
  useEffect(() => {
    if (result) {
      const bounds = L.geoJSON(result).getBounds();
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [result, map]);
  return null;
};

const MapEvents: React.FC<{ onResolve: (lat: number, lng: number) => void }> = ({ onResolve }) => {
  useMapEvents({
    click: (e) => {
      onResolve(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const GisMap: React.FC = () => {
  const { isReady, loadDistricts, loadPincodes, loadTneb, resolveLocation, searchPincode } = useGisWorker();
  const { searchQuery, searchResult, pdsData, activeDistrict } = useMapStore();
  const [showPds, _setShowPds] = useState(true);

  useEffect(() => {
    if (isReady) {
      loadDistricts();
      loadPincodes();
      loadTneb();
    }
  }, [isReady]);

  useEffect(() => {
    if (searchQuery && searchQuery.length >= 6) {
      searchPincode(searchQuery);
    }
  }, [searchQuery]);

  const districtStyle = {
    fillColor: 'transparent',
    weight: 1.5,
    opacity: 0.1,
    color: 'rgba(14, 165, 233, 0.4)',
    dashArray: '3',
    fillOpacity: 0.05
  };

  const highlightStyle = {
    fillColor: 'var(--accent)',
    weight: 2,
    opacity: 0.8,
    color: 'white',
    fillOpacity: 0.15
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
      
      <MapEvents onResolve={resolveLocation} />
      
      {/* Districts Layer */}
      <GeoJSON data={[] as any} style={districtStyle} />

      {searchResult && (
        <GeoJSON 
          key={`search-${searchQuery}`}
          data={searchResult} 
          style={highlightStyle} 
        />
      )}

      {/* PDS Points Layer */}
      {showPds && pdsData && pdsData.features.map((f: any, i: number) => {
        const [lng, lat] = f.geometry.coordinates;
        return (
          <CircleMarker
            key={`pds-${activeDistrict}-${i}`}
            center={[lat, lng]}
            radius={3}
            pathOptions={{
              fillColor: '#22c55e',
              fillOpacity: 0.8,
              color: 'white',
              weight: 0.5
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

      <MapController result={searchResult} />
      <ZoomControl position="bottomright" />
    </MapContainer>
  );
};

export default GisMap;
