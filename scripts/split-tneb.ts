import fs from 'fs';
import path from 'path';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';

// Simple Point-in-Polygon (Ray Casting)
function isPointInPolygon(point: [number, number], polygon: any[][]): boolean {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function isPointInMultiPolygon(point: [number, number], multiPolygon: any[][][]): boolean {
  return multiPolygon.some(polygon => isPointInPolygon(point, polygon[0]));
}

async function run() {
  console.log('🚀 Starting TNEB District Split (Boundaries & Offices)...');

  const dataDir = path.resolve('public/data');
  const outputDir = path.join(dataDir, 'tneb_by_district');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Load Data
  const tnebOfficesData = JSON.parse(fs.readFileSync(path.join(dataDir, 'tneb_offices.geojson'), 'utf8'));
  const tnebBoundariesTopo = JSON.parse(fs.readFileSync(path.join(dataDir, 'tneb_boundaries.topojson'), 'utf8')) as unknown as Topology;
  const districtsTopo = JSON.parse(fs.readFileSync(path.join(dataDir, 'tn_districts.topojson'), 'utf8')) as unknown as Topology;

  // 2. Convert TopoJSON to GeoJSON
  const districtsGeo = feature(districtsTopo, districtsTopo.objects.Districts as any) as any;
  const tnebBoundariesGeo = feature(tnebBoundariesTopo, tnebBoundariesTopo.objects.TNEB_Section_Boundary as any) as any;

  const districtBoundaries: Record<string, any[]> = {};
  const districtOffices: Record<string, any[]> = {};

  // 3. Process Boundaries
  console.log(`📊 Partitioning ${tnebBoundariesGeo.features.length} TNEB boundaries...`);
  for (const boundary of tnebBoundariesGeo.features) {
    // TNEB boundaries often don't have a district field, or it's messy. 
    // We'll use the centroid or a point inside to find the district.
    const coords = boundary.geometry.type === 'Polygon' 
      ? boundary.geometry.coordinates[0][0] 
      : boundary.geometry.coordinates[0][0][0];
    
    let foundDistrict = 'Unknown';
    for (const dist of districtsGeo.features) {
      const name = dist.properties.district_n || dist.properties.district || dist.properties.DISTRICT || dist.properties.NAME;
      if (dist.geometry.type === 'Polygon') {
        if (isPointInPolygon(coords, dist.geometry.coordinates[0])) {
          foundDistrict = name;
          break;
        }
      } else if (dist.geometry.type === 'MultiPolygon') {
        if (isPointInMultiPolygon(coords, dist.geometry.coordinates)) {
          foundDistrict = name;
          break;
        }
      }
    }
    
    if (!districtBoundaries[foundDistrict]) districtBoundaries[foundDistrict] = [];
    districtBoundaries[foundDistrict].push(boundary);
  }

  // 4. Process Offices
  console.log(`📊 Partitioning ${tnebOfficesData.features.length} TNEB offices...`);
  for (const office of tnebOfficesData.features) {
    const coords = office.geometry.coordinates as [number, number];
    let foundDistrict = 'Unknown';

    for (const district of districtsGeo.features) {
      const name = district.properties.district_n || district.properties.district || district.properties.DISTRICT || district.properties.NAME;
      if (district.geometry.type === 'Polygon') {
        if (isPointInPolygon(coords, district.geometry.coordinates[0])) {
          foundDistrict = name;
          break;
        }
      } else if (district.geometry.type === 'MultiPolygon') {
        if (isPointInMultiPolygon(coords, district.geometry.coordinates)) {
          foundDistrict = name;
          break;
        }
      }
    }

    if (!districtOffices[foundDistrict]) districtOffices[foundDistrict] = [];
    districtOffices[foundDistrict].push(office);
  }

  // 5. Save Shards
  const allDistricts = new Set([...Object.keys(districtBoundaries), ...Object.keys(districtOffices)]);
  
  for (const district of allDistricts) {
    if (district === 'Unknown') continue;

    const boundPath = path.join(outputDir, `${district}_boundaries.json`);
    const offPath = path.join(outputDir, `${district}_offices.json`);

    fs.writeFileSync(boundPath, JSON.stringify({ type: 'FeatureCollection', features: districtBoundaries[district] || [] }, null, 2));
    fs.writeFileSync(offPath, JSON.stringify({ type: 'FeatureCollection', features: districtOffices[district] || [] }, null, 2));
    
    console.log(`✅ Saved ${district}: ${districtBoundaries[district]?.length || 0} boundaries, ${districtOffices[district]?.length || 0} offices`);
  }

  console.log('🎉 TNEB sharding complete!');
}

run().catch(console.error);
