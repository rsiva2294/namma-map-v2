import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, ZoomControl, GeoJSON, useMap, Tooltip, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGisWorker } from '../../hooks/useGisWorker';
import { useMapStore } from '../../store/useMapStore';
import type { GisFeature, PdsShop, Geometry, Point, PoliceStationProperties, PoliceResolutionResult } from '../../types/gis';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import VectorTileLayer from '../../components/VectorTileLayer';

const MapController: React.FC<{ 
  result: GisFeature | null; 
  geometry: Geometry | null;
  policeResolution: PoliceResolutionResult | null;
}> = ({ result, geometry, policeResolution }) => {
  const map = useMap();
  const { isSidebarOpen } = useMapStore();

  useEffect(() => {
    if (!map) return;

    const isMobile = window.innerWidth <= 768;
    const leftPad = isMobile ? 20 : (isSidebarOpen ? 340 : 80);
    const bottomPad = isMobile ? 320 : 80; // Space for bottom sheet

    if (result && result.geometry) {
      try {
        const bounds = L.geoJSON(result).getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { 
            paddingTopLeft: [leftPad, 120], 
            paddingBottomRight: [80, bottomPad],
            maxZoom: 14,
            duration: 0.8
          });
        }
      } catch (e) {
        console.warn('Could not fly to bounds for result', e);
      }
    } else if (policeResolution && !policeResolution.isBoundaryValid && policeResolution.station) {
      // Fly to station point if boundary is invalid
      const [lng, lat] = policeResolution.station.geometry.coordinates;
      map.flyTo([lat, lng], 14, { duration: 0.8 });
    } else if (geometry) {
      try {
        const bounds = L.geoJSON(geometry).getBounds();
        if (bounds.isValid()) {
          // Aggressive padding to force the selection into the visible 'hole'
          map.flyToBounds(bounds, { 
            paddingTopLeft: [leftPad, 150], // Extra top padding for search bar
            paddingBottomRight: [isMobile ? 20 : 420, bottomPad], // Extra right padding for result card
            maxZoom: 14,
            duration: 0.8
          });
        }
      } catch (e) {
        console.warn('Could not fly to bounds for geometry', e);
      }
    }
  }, [result, geometry, map, isSidebarOpen, policeResolution]);
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
  const { isReady, loadDistricts, loadStateBoundary, loadPincodes, loadTneb, loadPdsIndex, loadConstituencies, loadPoliceData, loadPostalOffices, loadHealthManifest, loadHealthPriority, loadHealthDistrict, loadHealthSearchIndex, resolveLocation, getSuggestions, selectSuggestion, resolveHealthFacility } = useGisWorker();
  const { activeLayer, searchQuery, searchResult, activeDistrict, jurisdictionDetails, jurisdictionGeometry, districtsData, stateBoundaryData, acData, pcData, constituencyType, selectedPoliceStation, policeResolution, policeStationsData, selectedPdsShop, setSelectedPdsShop, theme, selectedSuggestion, setSelectedSuggestion, triggerLocateMe, setTriggerLocateMe, setIsLocating, setSearchSuggestions, isUserTyping, setUserTyping, selectedPostalOffices, setSelectedPostalOffice, selectedPostalOffice, healthPriorityData, healthDistrictData, selectedHealthFacility, isHealthLoading, healthScope } = useMapStore();

  useEffect(() => {
    if (isReady) {
      loadDistricts();
      loadStateBoundary();
      loadPincodes();
      loadTneb();
      loadPdsIndex();
      loadConstituencies();
      loadPoliceData();
      loadPostalOffices();
      loadHealthManifest();
      loadHealthSearchIndex();
    }
  }, [isReady, loadDistricts, loadStateBoundary, loadPincodes, loadTneb, loadPdsIndex, loadConstituencies, loadPoliceData, loadPostalOffices, loadHealthManifest, loadHealthSearchIndex]);

  // Handle Search Trigger (Pincode or Text) - only if user is actively typing
  useEffect(() => {
    if (isUserTyping && searchQuery && searchQuery.length >= 3) {
      getSuggestions(searchQuery, activeLayer);
    } else if (!isUserTyping || !searchQuery) {
      setSearchSuggestions([]);
    }
  }, [searchQuery, activeLayer, isUserTyping, getSuggestions, setSearchSuggestions]);

  // Handle Suggestion Selection
  useEffect(() => {
    if (selectedSuggestion) {
      setUserTyping(false);
      selectSuggestion(selectedSuggestion, activeLayer);
      setSelectedSuggestion(null); // Clear it after processing
    }
  }, [selectedSuggestion, activeLayer, selectSuggestion, setSelectedSuggestion, setUserTyping]);

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
  // PDS data is now handled via Vector Tiles

  // Auto-trigger Health load
  useEffect(() => {
    if (activeLayer === 'HEALTH' && isReady) {
      if (healthScope === 'STATE') {
        loadHealthPriority();
      } else if (healthScope === 'DISTRICT' && activeDistrict) {
        const distManifest = useMapStore.getState().healthManifest?.districts.find(d => 
          d.district.toLowerCase().replace(/\s+/g, '') === activeDistrict.toLowerCase().replace(/\s+/g, '')
        );
        if (distManifest) {
          loadHealthDistrict(distManifest.district, distManifest.file_name);
        }
      }
    }
  }, [activeLayer, isReady, healthScope, activeDistrict, loadHealthPriority, loadHealthDistrict]);

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

  const constituencyStyle = {
    fillColor: '#6366f1',
    weight: 1.5,
    opacity: isAreaSelected ? 0.3 : 0.6,
    color: '#4f46e5',
    fillOpacity: isAreaSelected ? 0.05 : 0.1,
    interactive: false
  };
 

 
  const policeSelectedStyle = {
    fillColor: '#475569',
    weight: 3,
    opacity: 1,
    color: '#1e293b',
    fillOpacity: 0.1,
    dashArray: '5, 5',
    interactive: false
  };

  const constituencySelectedStyle = {
    fillColor: '#6366f1',
    weight: 3,
    opacity: 1,
    color: '#4338ca',
    fillOpacity: 0.1,
    interactive: false
  };

  const boltIcon = L.divIcon({
    html: `
      <div class="pulse-tneb"></div>
      <div style="background: #f59e0b; width: 36px; height: 36px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(0,0,0,0.3); position: relative; z-index: 1;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
      </div>`,
    className: 'custom-bolt-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
 
  const policeDotIcon = L.divIcon({
    html: `<div style="background: #334155; width: 12px; height: 12px; border-radius: 50%; border: 1.5px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>`,
    className: 'police-dot-icon',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  const postOfficeIcon = L.divIcon({
    html: `
      <div class="pulse-postal"></div>
      <div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); position: relative; z-index: 1;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
      </div>`,
    className: 'custom-postal-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  const healthPriorityIcon = (type: string) => {
    let color = '#be123c';
    let size = 12;
    if (type.includes('District')) { color = '#9d174d'; size = 16; }
    else if (type.includes('Medical College')) { color = '#881337'; size = 20; }
    else if (type.includes('Sub-Centre')) { color = '#f43f5e'; size = 8; }
    
    return L.divIcon({
      html: `<div style="background: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 1.5px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
      className: 'health-priority-icon',
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  };

  const selectedHealthIcon = L.divIcon({
    html: `
      <div class="pulse-health"></div>
      <div style="background: #be123c; width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4); position: relative; z-index: 10;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
        </svg>
      </div>`,
    className: 'selected-health-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
 


  const memoizedPoliceMarkers = useMemo(() => {
    if (!policeStationsData) return null;
    return policeStationsData.features.map((f: GisFeature<Point, PoliceStationProperties>, i: number) => {
      const [lng, lat] = f.geometry.coordinates as [number, number];
      const isSelected = selectedPoliceStation?.properties.ps_code === f.properties.ps_code;
      if (isSelected) return null;
      
      return (
        <Marker
          key={`ps-marker-${f.properties.ps_code}-${i}`}
          position={[lat, lng]}
          icon={policeDotIcon}
          eventHandlers={{
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              resolveLocation(lat, lng, 'POLICE', false, undefined, f.properties.ps_code);
            }
          }}
        >
          <Tooltip direction="top" offset={[0, -5]} opacity={1}>
            <div style={{ padding: '5px' }}>
              <strong>{f.properties.ps_name || 'Police Station'}</strong>
              <br />
              <small>Click to view jurisdiction</small>
            </div>
          </Tooltip>
        </Marker>
      );
    });
  }, [policeStationsData, selectedPoliceStation, policeDotIcon, resolveLocation]);

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
      preferCanvas={true}
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

      {(activeLayer === 'PDS' || activeLayer === 'TNEB' || activeLayer === 'POLICE' || activeLayer === 'HEALTH') && stateBoundaryData && (
        <GeoJSON 
          key={`state-${theme}-${isAreaSelected}`}
          data={stateBoundaryData}
          style={{ ...districtStyle, weight: 2, fillOpacity: 0.02 }}
          interactive={false}
        />
      )}
 


      {activeLayer === 'CONSTITUENCY' && (constituencyType === 'AC' ? acData : pcData) && (
        <GeoJSON 
          key={`constituencies-${constituencyType}-${theme}-${isAreaSelected}`}
          data={constituencyType === 'AC' ? acData! : pcData!}
          style={constituencyStyle}
          interactive={false}
        />
      )}
      
      {searchResult && !jurisdictionGeometry && (
        <GeoJSON 
          key={`search-${searchQuery}-${searchResult.properties.PIN_CODE || searchResult.properties.NAME || searchResult.properties.assembly_c || searchResult.properties.parliame_1 || searchResult.properties.ps_code}`}
          data={searchResult} 
          style={activeLayer === 'CONSTITUENCY' ? constituencySelectedStyle : activeLayer === 'POLICE' ? policeSelectedStyle : pincodeStyle} 
          interactive={false}
        />
      )}

      {activeLayer === 'PINCODE' && selectedPostalOffices && selectedPostalOffices.map((po, i) => (
        <Marker
          key={`po-${po.pincode}-${i}`}
          position={[parseFloat(po.latitude as string), parseFloat(po.longitude as string)]}
          icon={postOfficeIcon}
          eventHandlers={{
            click: () => {
              setSelectedPostalOffice(po);
            }
          }}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={1}>
            <div style={{ padding: '4px 8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{po.officename}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>{po.officetype} - {po.delivery}</div>
            </div>
          </Tooltip>
        </Marker>
      ))}

      {activeLayer === 'TNEB' && (
        <VectorTileLayer 
          url="/tiles/tneb/{z}/{x}/{y}.pbf"
          style={{
            vectorTileLayerStyles: {
              tneb: (_properties: any) => ({
                weight: 1.5,
                color: '#f59e0b',
                opacity: isAreaSelected ? 0.2 : 0.5,
                fillColor: '#f59e0b',
                fillOpacity: isAreaSelected ? 0.02 : 0.1,
                fill: true
              })
            }
          }}
          onClick={(e: any) => {
            if (e.latlng) {
              resolveLocation(e.latlng.lat, e.latlng.lng, 'TNEB');
            }
          }}
        />
      )}

      {activeLayer === 'TNEB' && jurisdictionGeometry && (
        <>
          <GeoJSON 
            key={`tneb-${jurisdictionGeometry.type}-${JSON.stringify((jurisdictionGeometry.coordinates as unknown[])[0])}`}
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
 
      {activeLayer === 'POLICE' && jurisdictionGeometry && policeResolution?.isBoundaryValid && (
        <GeoJSON
          key={`police-jurisdiction-${policeResolution.boundary.properties.police_s_1}`}
          data={{
            type: 'Feature',
            geometry: jurisdictionGeometry,
            properties: {}
          } as GisFeature}
          style={{
            color: '#334155',
            weight: 3,
            opacity: 0.8,
            fillColor: '#334155',
            fillOpacity: 0.15,
            dashArray: '5, 5'
          }}
        />
      )}
 

 
      {activeLayer === 'POLICE' && policeStationsData && (
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {memoizedPoliceMarkers}
        </MarkerClusterGroup>
      )}

      {activeLayer === 'POLICE' && selectedPoliceStation && (
        <Marker
          position={[
            (selectedPoliceStation.geometry.coordinates as [number, number])[1],
            (selectedPoliceStation.geometry.coordinates as [number, number])[0]
          ]}
          icon={L.divIcon({
            html: `
              <div class="pulse-police"></div>
              <div style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #334155; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); position: relative; z-index: 10;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>`,
            className: 'selected-police-icon',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          })}
        />
      )}

      {activeLayer === 'PDS' && (
        <VectorTileLayer 
          url="/tiles/pds/{z}/{x}/{y}.pbf"
          style={{
            vectorTileLayerStyles: {
              pds: (_properties: any) => ({
                weight: 1.5,
                color: 'white',
                opacity: 0.9,
                fillColor: '#ef4444',
                fillOpacity: 0.9,
                radius: 6,
                fill: true
              })
            }
          }}
          onClick={(e: any) => {
            if (e.layer && e.layer.properties) {
              const props = e.layer.properties;
              // Mock a feature object for setSelectedPdsShop
              const mockFeature: PdsShop = {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [e.latlng.lng, e.latlng.lat]
                },
                properties: {
                  ...props,
                  name: props.name || props.shop_name,
                  shop_code: props.shop_code || props.code
                }
              } as PdsShop;
              setSelectedPdsShop(mockFeature);
            }
          }}
        />
      )}

      {activeLayer === 'PDS' && selectedPdsShop && (
        <Marker
          position={[
            (selectedPdsShop.geometry.coordinates as [number, number])[1],
            (selectedPdsShop.geometry.coordinates as [number, number])[0]
          ]}
          interactive={false}
          icon={L.divIcon({
            html: `
              <div class="pulse-pds"></div>
              <div style="background: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); position: relative; z-index: 1;"></div>`,
            className: 'selected-pds-icon',
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          })}
        />
      )}

      {activeLayer === 'PINCODE' && selectedPostalOffice && (
        <Marker
          position={[
            parseFloat(selectedPostalOffice.latitude as string),
            parseFloat(selectedPostalOffice.longitude as string)
          ]}
          interactive={false}
          icon={L.divIcon({
            html: `
              <div class="pulse-postal"></div>
              <div style="background: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); position: relative; z-index: 1;"></div>`,
            className: 'selected-postal-icon',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          })}
        />
      )}

      {activeLayer === 'HEALTH' && (healthScope === 'STATE' ? healthPriorityData : healthDistrictData) && (
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={40}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {(healthScope === 'STATE' ? healthPriorityData : healthDistrictData)!.features.map((f, i) => {
             const isSelected = selectedHealthFacility?.properties.ogc_fid === f.properties.ogc_fid;
             if (isSelected) return null;

             return (
               <Marker
                 key={`health-${f.properties.ogc_fid}-${i}`}
                 position={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
                 icon={healthPriorityIcon(f.properties.facility_t || '')}
                 eventHandlers={{
                   click: (e) => {
                     L.DomEvent.stopPropagation(e);
                     const dist = (f.properties.district || f.properties.district_n)?.toString() || activeDistrict;
                     resolveHealthFacility(
                        (f.properties.ogc_fid || 0) as string | number, 
                        f.properties.nin_number as string | number | undefined, 
                        dist || null
                      );
                   }
                 }}
               >
                 <Tooltip direction="top" offset={[0, -5]} opacity={1}>
                    <div style={{ padding: '4px' }}>
                      <strong>{f.properties.facility_n || f.properties.NAME}</strong>
                      <br/>
                      <small>{f.properties.facility_t}</small>
                    </div>
                 </Tooltip>
               </Marker>
             );
          })}
        </MarkerClusterGroup>
      )}

      {activeLayer === 'HEALTH' && selectedHealthFacility && (
        <Marker
          position={[
            selectedHealthFacility.geometry.coordinates[1],
            selectedHealthFacility.geometry.coordinates[0]
          ]}
          icon={selectedHealthIcon}
          zIndexOffset={1000}
          eventHandlers={{
            click: (e) => {
              L.DomEvent.stopPropagation(e);
            }
          }}
        >
          <Tooltip direction="top" offset={[0, -14]} opacity={1} permanent>
            <div style={{ padding: '4px 8px' }}>
              <div style={{ fontWeight: 'bold' }}>{selectedHealthFacility.properties.facility_n || selectedHealthFacility.properties.NAME}</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>{selectedHealthFacility.properties.facility_t}</div>
            </div>
          </Tooltip>
        </Marker>
      )}

      <MapController result={searchResult} geometry={jurisdictionGeometry} policeResolution={policeResolution} />

      {/* Safety check for district data */}
      {activeLayer === 'HEALTH' && isHealthLoading && (
        <div className="map-loading-overlay">
          Loading health facilities...
        </div>
      )}

      <MapEvents onResolve={resolveLocation} activeLayer={activeLayer} />
      <ZoomControl position="bottomright" />

      {/* Health Layer Legend Overlay */}
      {activeLayer === 'HEALTH' && !isHealthLoading && (
        <div style={{
          position: 'absolute',
          bottom: '100px',
          right: '20px',
          zIndex: 1000,
          padding: '12px 16px',
          background: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block' }}>
            Map Hierarchy
          </span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#9d174d', border: '1.5px solid white', boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }} />
              <span style={{ fontSize: '10px', color: 'var(--text-primary)', fontWeight: 700 }}>Major</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e', border: '1.5px solid white', boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }} />
              <span style={{ fontSize: '10px', color: 'var(--text-primary)', fontWeight: 700 }}>Local</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#94a3b8', border: '1px solid white', boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }} />
              <span style={{ fontSize: '10px', color: 'var(--text-primary)', fontWeight: 700 }}>Sub-Centre</span>
            </div>
          </div>
        </div>
      )}
    </MapContainer>
  );
};

export default GisMap;
