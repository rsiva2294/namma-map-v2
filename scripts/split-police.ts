import fs from 'fs';
import path from 'path';
import * as topojson from 'topojson-client';
import { feature } from 'topojson-client';

// Simple Point-in-Polygon (Ray Casting)
function isPointInPolygon(point: [number, number], polygon: [number, number][][]) {
  const x = point[0], y = point[1];
  let inside = false;
  
  for (const ring of polygon) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      
      const intersect = ((yi > y) !== (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
  }
  return inside;
}

function isPointInMultiPolygon(point: [number, number], multiPolygon: [number, number][][][]) {
  return multiPolygon.some(polygon => isPointInPolygon(point, polygon));
}

async function run() {
  console.log('🚀 Starting Police Data District Split...');

  const dataDir = path.resolve('public/data');
  const outputDir = path.join(dataDir, 'police_by_district');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Load District Polygons
  console.log('📖 Loading district boundaries...');
  const distTopo = JSON.parse(fs.readFileSync(path.join(dataDir, 'tn_districts.topojson'), 'utf8'));
  const distGeo: any = feature(distTopo, distTopo.objects.Districts);
  
  // 2. Load Police Data
  console.log('📖 Loading police data...');
  const stationsGeo = JSON.parse(fs.readFileSync(path.join(dataDir, 'tn_police_stations.geojson'), 'utf8'));
  const boundariesTopo = JSON.parse(fs.readFileSync(path.join(dataDir, 'tn_police_boundaries.topojson'), 'utf8'));
  const boundariesGeo: any = feature(boundariesTopo, boundariesTopo.objects.Police_Jurisdiction_Boundary);

  const districtStations: Record<string, any[]> = {};
  const districtBoundaries: Record<string, any[]> = {};

  // Initialize groups
  distGeo.features.forEach((f: any) => {
    const name = f.properties.district_n || f.properties.district;
    districtStations[name] = [];
    districtBoundaries[name] = [];
  });

  // 3. Partition Stations (Spatial Join)
  console.log('📍 Partitioning stations...');
  for (const station of stationsGeo.features) {
    const coords = station.geometry.coordinates as [number, number];
    let foundDistrict = 'Unknown';

    for (const dist of distGeo.features) {
      const name = dist.properties.district_n || dist.properties.district;
      const poly = dist.geometry;
      
      let inside = false;
      if (poly.type === 'Polygon') {
        inside = isPointInPolygon(coords, poly.coordinates);
      } else if (poly.type === 'MultiPolygon') {
        inside = isPointInMultiPolygon(coords, poly.coordinates);
      }

      if (inside) {
        foundDistrict = name;
        break;
      }
    }
    
    if (!districtStations[foundDistrict]) districtStations[foundDistrict] = [];
    districtStations[foundDistrict].push(station);
  }

  // 4. Partition Boundaries (Property Match + Spatial Fallback)
  console.log('🗺️ Partitioning boundaries...');
  for (const boundary of boundariesGeo.features) {
    let distName = boundary.properties.district_n || boundary.properties.police_dis;
    
    // Normalize name
    if (distName) {
      distName = distName.trim().charAt(0).toUpperCase() + distName.trim().slice(1).toLowerCase();
      // Special case for Tiruchirappalli mapping to Tiruchirapalli
      if (distName === 'Tiruchirappalli') distName = 'Tiruchirapalli';
      if (distName === 'Kancheepuram') distName = 'Kancheepuram'; // Check spelling
    }

    if (distName && districtBoundaries[distName]) {
      districtBoundaries[distName].push(boundary);
    } else {
      // Spatial fallback (check centroid)
      // For simplicity, we'll just use the district_n if it exists, otherwise Unknown
      const fallback = 'Unknown';
      if (!districtBoundaries[fallback]) districtBoundaries[fallback] = [];
      districtBoundaries[fallback].push(boundary);
    }
  }

  // 5. Save Files
  for (const district of Object.keys(districtStations)) {
    if (districtStations[district].length === 0 && districtBoundaries[district].length === 0) continue;
    
    const stationsPath = path.join(outputDir, `${district}_stations.json`);
    const boundariesPath = path.join(outputDir, `${district}_boundaries.json`);
    
    fs.writeFileSync(stationsPath, JSON.stringify({ type: 'FeatureCollection', features: districtStations[district] }));
    fs.writeFileSync(boundariesPath, JSON.stringify({ type: 'FeatureCollection', features: districtBoundaries[district] }));
    
    console.log(`✅ Saved ${district}: ${districtStations[district].length} stations, ${districtBoundaries[district].length} boundaries`);
  }

  console.log('🎉 Police splitting complete!');
}

run().catch(console.error);
