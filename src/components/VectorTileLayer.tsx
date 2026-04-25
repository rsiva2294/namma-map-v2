import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.vectorgrid';

interface VectorTileLayerProps {
  url: string;
  style?: any;
  onMouseOver?: (e: any) => void;
  onMouseOut?: (e: any) => void;
  onClick?: (e: any) => void;
}

const VectorTileLayer: React.FC<VectorTileLayerProps> = ({ 
  url, 
  style, 
  onMouseOver, 
  onMouseOut, 
  onClick 
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Create the vector grid layer
    const vectorLayer = (L as any).vectorGrid.protobuf(url, {
      interactive: true,
      vectorTileLayerStyles: style?.vectorTileLayerStyles || {},
      ...style
    });

    if (onMouseOver) vectorLayer.on('mouseover', onMouseOver);
    if (onMouseOut) vectorLayer.on('mouseout', onMouseOut);
    if (onClick) vectorLayer.on('click', onClick);

    vectorLayer.addTo(map);

    return () => {
      map.removeLayer(vectorLayer);
    };
  }, [map, url, style, onMouseOver, onMouseOut, onClick]);

  return null;
};

export default VectorTileLayer;
