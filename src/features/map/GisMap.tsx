import React, { useEffect } from 'react';
import { MapContainer, TileLayer, ZoomControl, GeoJSON, useMap, CircleMarker, Tooltip, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGisWorker } from '../../hooks/useGisWorker';
import { useMapStore } from '../../store/useMapStore';

const MapController: React.FC<{ result: any; geometry: any }> = ({ result, geometry }) => {
  const map = useMap();
  const { isSidebarOpen } = useMapStore();

  useEffect(() => {
    if (!map) return;

    if (result) {
      const bounds = L.geoJSON(result).getBounds();
      const leftPad = isSidebarOpen ? 340 : 80;
      map.flyToBounds(bounds, { 
        paddingTopLeft: [leftPad, 120], 
        paddingBottomRight: [80, 80],
        maxZoom: 14,
        duration: 0.8
      });
    } else if (geometry) {
      const bounds = L.geoJSON(geometry).getBounds();
      const leftPad = isSidebarOpen ? 340 : 80;
      // Aggressive padding to force the selection into the visible 'hole'
      map.flyToBounds(bounds, { 
        paddingTopLeft: [leftPad, 150], // Extra top padding for search bar
        paddingBottomRight: [420, 100], // Extra right padding for result card
        maxZoom: 14,
        duration: 0.8
      });
    }
  }, [result, geometry, map, isSidebarOpen]);
  return null;
};

const MapEvents: React.FC<{ onResolve: (lat: number, lng: number, layer: string) => void; activeLayer: string }> = ({ onResolve, activeLayer }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    
    const onClick = (e: L.LeafletMouseEvent) => {
      onResolve(e.latlng.lat, e.latlng.lng, activeLayer);
    };

    map.on('click', onClick);
    return () => {
      map.off('click', onClick);
    };
  }, [map, onResolve, activeLayer]);

  return null;
};

const GisMap: React.FC = () => {
  const { isReady, loadDistricts, loadStateBoundary, loadPincodes, loadTneb, loadPds, resolveLocation, getSuggestions, selectSuggestion } = useGisWorker();
  const { activeLayer, searchQuery, searchResult, pdsData, activeDistrict, jurisdictionDetails, jurisdictionGeometry, districtsData, stateBoundaryData, theme, selectedSuggestion, setSelectedSuggestion, setSelectedPdsShop, triggerLocateMe, setTriggerLocateMe, setIsLocating, setSearchSuggestions, isUserTyping, setUserTyping } = useMapStore();

  useEffect(() => {
    if (isReady) {
      loadDistricts();
      loadStateBoundary();
      loadPincodes();
      loadTneb();
    }
  }, [isReady]);

  // Handle Search Trigger (Pincode or Text) - only if user is actively typing
  useEffect(() => {
    if (isUserTyping && searchQuery && searchQuery.length >= 3) {
      getSuggestions(searchQuery, activeLayer);
    } else if (!isUserTyping || !searchQuery) {
      setSearchSuggestions([]);
    }
  }, [searchQuery, activeLayer, isUserTyping]);

  // Handle Suggestion Selection
  useEffect(() => {
    if (selectedSuggestion) {
      setUserTyping(false);
      selectSuggestion(selectedSuggestion, activeLayer);
      setSelectedSuggestion(null); // Clear it after processing
    }
  }, [selectedSuggestion, activeLayer]);

  // Handle Geolocation
  useEffect(() => {
    if (triggerLocateMe) {
      if (navigator.geolocation) {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolveLocation(position.coords.latitude, position.coords.longitude, activeLayer);
            setTriggerLocateMe(false);
            setIsLocating(false);
          },
          (error) => {
            console.error("Error getting location:", error);
            setTriggerLocateMe(false);
            setIsLocating(false);
            alert("Could not retrieve your location. Please check your browser permissions.");
          }
        );
      } else {
        alert("Geolocation is not supported by your browser.");
        setTriggerLocateMe(false);
      }
    }
  }, [triggerLocateMe, activeLayer, resolveLocation, setTriggerLocateMe, setIsLocating]);

  // Auto-trigger PDS load on layer switch
  useEffect(() => {
    if (activeLayer === 'PDS' && searchResult) {
      const district = searchResult.properties.district || searchResult.properties.DISTRICT || searchResult.properties.DISTRICT_NAME || searchResult.properties.NAME;
      if (district) {
        loadPds(district, searchResult.geometry);
      }
    }
  }, [activeLayer, searchResult]);

   const isAreaSelected = !!searchResult || !!jurisdictionGeometry;

   const districtStyle = {
     fillColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
     weight: 1.5,
     opacity: isAreaSelected ? 0.3 : 0.6,
     color: theme === 'dark' ? '#475569' : '#94a3b8',
     fillOpacity: isAreaSelected ? 0.05 : 0.1,
     interactive: false
   };

   const pincodeStyle = {
     fillColor: '#3b82f6',
     weight: 3,
     opacity: 1,
     color: '#2563eb',
     fillOpacity: 0.1,
     interactive: false
   };

  const jurisdictionStyle = {
    fillColor: '#f59e0b',
    weight: 3,
    opacity: 1,
    color: '#d97706',
    fillOpacity: 0.15,
    dashArray: '5, 5',
    interactive: false
  };

  const boltIcon = L.divIcon({
    html: `<div style="background: #f59e0b; padding: 8px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
    </div>`,
    className: 'custom-bolt-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  const tnBounds: L.LatLngBoundsLiteral = [
    [8.0775, 76.2307], // Southwest
    [13.5670, 80.3444] // Northeast
  ];

  return (
    <MapContainer 
      center={[11.1271, 78.6569]} 
      zoom={7}
      minZoom={6}
      maxBounds={tnBounds}
      maxBoundsViscosity={1.0}
      scrollWheelZoom={true}
      zoomControl={false}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        key={theme}
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={theme === 'dark' ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
      />
      
      {/* Background Boundaries based on Active Layer */}
      {activeLayer === 'PINCODE' && districtsData && (
        <GeoJSON 
          key={`districts-${theme}-${isAreaSelected}`}
          data={districtsData}
          style={districtStyle}
          interactive={false}
        />
      )}

      {(activeLayer === 'PDS' || activeLayer === 'TNEB') && stateBoundaryData && (
        <GeoJSON 
          key={`state-${theme}-${isAreaSelected}`}
          data={stateBoundaryData}
          style={{ ...districtStyle, weight: 2, fillOpacity: 0.02 }}
          interactive={false}
        />
      )}
      
      {searchResult && !jurisdictionGeometry && (
        <GeoJSON 
          key={`search-${searchQuery}-${searchResult.properties.PIN_CODE || searchResult.properties.NAME}`}
          data={searchResult} 
          style={pincodeStyle} 
          interactive={false}
        />
      )}

      {activeLayer === 'TNEB' && jurisdictionGeometry && (
        <>
          <GeoJSON 
            key={`tneb-${jurisdictionGeometry.type}-${JSON.stringify(jurisdictionGeometry.coordinates[0][0])}`}
            data={jurisdictionGeometry} 
            style={jurisdictionStyle} 
            interactive={false}
          />
          <Marker 
            position={
              jurisdictionDetails?.office_location 
                ? [jurisdictionDetails.office_location[1], jurisdictionDetails.office_location[0]]
                : L.geoJSON(jurisdictionGeometry).getBounds().getCenter()
            }
            icon={boltIcon}
          >
            <Tooltip direction="top" offset={[0, -20]} opacity={1}>
              <div style={{ padding: '2px 5px', fontWeight: 'bold' }}>
                Section Office
              </div>
            </Tooltip>
          </Marker>
        </>
      )}

      {activeLayer === 'PDS' && pdsData && pdsData.features.map((f: any, i: number) => {
        const [lng, lat] = f.geometry.coordinates;
        return (
          <CircleMarker
            key={`pds-${activeDistrict}-${i}`}
            center={[lat, lng]}
            radius={6}
            pathOptions={{
              fillColor: '#ef4444',
              fillOpacity: 0.9,
              color: 'white',
              weight: 1.5,
              bubblingMouseEvents: false
            }}
            eventHandlers={{
              click: () => {
                setSelectedPdsShop(f);
              }
            }}
          >
            <Tooltip direction="top" offset={[0, -5]} opacity={1}>
              <div style={{ padding: '5px' }}>
                <strong>{f.properties.name || 'PDS Shop'}</strong>
                <br />
                <small>{f.properties.village || 'Tamil Nadu'}</small>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}

      <MapController result={searchResult} geometry={jurisdictionGeometry} />
      <MapEvents onResolve={resolveLocation} activeLayer={activeLayer} />
      <ZoomControl position="bottomright" />
    </MapContainer>
  );
};

export default GisMap;
