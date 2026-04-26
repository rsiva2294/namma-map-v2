import React, { useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useMapStore } from '../../store/useMapStore';
import type { ServiceLayer } from '../../types/gis';

export const RouteManager = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { layer, district } = useParams();
  
  const activeLayer = useMapStore(state => state.activeLayer);
  const setActiveLayer = useMapStore(state => state.setActiveLayer);
  const activeDistrict = useMapStore(state => state.activeDistrict);
  const setActiveDistrict = useMapStore(state => state.setActiveDistrict);

  const isSyncingRef = React.useRef(false);

  // Sync URL -> Store
  useEffect(() => {
    isSyncingRef.current = true;
    if (layer) {
      const upperLayer = layer.toUpperCase() as ServiceLayer;
      const validLayers: ServiceLayer[] = ['PINCODE', 'PDS', 'TNEB', 'CONSTITUENCY', 'POLICE', 'HEALTH', 'LOCAL_BODIES'];
      if (validLayers.includes(upperLayer) && upperLayer !== activeLayer) {
        setActiveLayer(upperLayer);
      }
    }

    if (district && district !== activeDistrict) {
      const decodedDistrict = decodeURIComponent(district);
      setActiveDistrict(decodedDistrict);
    } else if (!district && activeDistrict) {
      // Clear district if navigating to a base layer URL
      setActiveDistrict(null);
    }
    
    // Reset the flag after a short delay or in next tick to allow store updates to settle
    setTimeout(() => { isSyncingRef.current = false; }, 0);
  }, [layer, district, activeLayer, activeDistrict, setActiveLayer, setActiveDistrict]);

  // Sync Store -> URL (for internal state changes not triggered by URL)
  useEffect(() => {
    if (isSyncingRef.current) return;

    const currentLayerPath = activeLayer.toLowerCase();
    const currentDistrictPath = activeDistrict ? `/${encodeURIComponent(activeDistrict)}` : '';
    const newPath = `/${currentLayerPath}${currentDistrictPath}`;

    const normalizedCurrentPath = location.pathname.replace(/\/$/, '');
    const normalizedNewPath = newPath.replace(/\/$/, '');

    if (normalizedCurrentPath !== normalizedNewPath) {
       navigate(newPath, { replace: true });
    }
  }, [activeLayer, activeDistrict, location.pathname, navigate]);

  return null;
};
