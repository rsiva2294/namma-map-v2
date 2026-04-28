import React from 'react';
import { Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useMapStore } from '../../store/useMapStore';

const UserLocationMarker: React.FC = () => {
  const userLocation = useMapStore(state => state.userLocation);

  if (!userLocation) return null;

  // Custom icon for the "Blue Person Dot"
  const userIcon = L.divIcon({
    className: 'user-location-marker',
    html: `
      <div class="user-dot-pulse"></div>
      <div class="user-dot"></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <>
      <Circle
        center={[userLocation.lat, userLocation.lng]}
        radius={100}
        pathOptions={{
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          color: '#3b82f6',
          weight: 1,
          dashArray: '5, 5'
        }}
      />
      <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />
    </>
  );
};

export default UserLocationMarker;
