import React, { useEffect } from 'react';
import { MapContainer, TileLayer, ZoomControl, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGisWorker } from '../../hooks/useGisWorker';
import { useMapStore } from '../../store/useMapStore';

// Helper component to handle map flying
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

const GisMap: React.FC = () => {
  const { isReady, districts, searchResult, loadDistricts, loadPincodes, searchPincode } = useGisWorker();
  const { searchQuery, setSearchResult } = useMapStore();

  useEffect(() => {
    if (isReady) {
      loadDistricts();
      loadPincodes();
    }
  }, [isReady]);

  // Handle Search Trigger
  useEffect(() => {
    if (searchQuery && searchQuery.length >= 6) {
      searchPincode(searchQuery);
    }
  }, [searchQuery]);

  // Sync worker result with store
  useEffect(() => {
    setSearchResult(searchResult);
  }, [searchResult, setSearchResult]);

  const districtStyle = {
    fillColor: 'transparent',
    weight: 1.5,
    opacity: 0.4,
    color: 'rgba(14, 165, 233, 0.4)', // Faded accent
    dashArray: '3',
    fillOpacity: 0.05
  };

  const highlightStyle = {
    fillColor: 'var(--accent)',
    weight: 3,
    opacity: 1,
    color: 'white',
    fillOpacity: 0.3
  };

  return (
    <MapContainer 
      center={[11.1271, 78.6569]} 
      zoom={7} 
      scrollWheelZoom={true}
      zoomControl={false}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      {/* Base District Boundaries */}
      {districts && (
        <GeoJSON data={districts} style={districtStyle} />
      )}

      {/* Highlighted Search Result */}
      {searchResult && (
        <GeoJSON 
          key={JSON.stringify(searchResult.properties)} // Force re-render on change
          data={searchResult} 
          style={highlightStyle} 
        />
      )}

      <MapController result={searchResult} />
      <ZoomControl position="bottomright" />
    </MapContainer>
  );
};

export default GisMap;
