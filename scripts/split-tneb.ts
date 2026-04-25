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
  console.log('🚀 Starting TNEB District Split...');

  const dataDir = path.resolve('public/data');
  const outputDir = path.join(dataDir, 'tneb_by_district');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Load Data
  const tnebData = JSON.parse(fs.readFileSync(path.join(dataDir, 'tneb_offices.geojson'), 'utf8'));
  const districtsTopo = JSON.parse(fs.readFileSync(path.join(dataDir, 'tn_districts.topojson'), 'utf8')) as unknown as Topology;

  // 2. Convert TopoJSON to GeoJSON
  const districtsGeo = feature(districtsTopo, districtsTopo.objects.Districts as any) as any;

  const districtGroups: Record<string, any[]> = {};

  // 3. Process Offices
  console.log(`📊 Processing ${tnebData.features.length} TNEB offices...`);

  for (const office of tnebData.features) {
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

    if (!districtGroups[foundDistrict]) {
      districtGroups[foundDistrict] = [];
    }
    districtGroups[foundDistrict].push(office);
  }

  // 4. Save Files
  for (const [district, features] of Object.entries(districtGroups)) {
    const filePath = path.join(outputDir, `${district}.json`);
    fs.writeFileSync(filePath, JSON.stringify(features, null, 2));
    console.log(`✅ Saved ${features.length} offices to ${district}.json`);
  }

  console.log('🎉 TNEB splitting complete!');
}

run().catch(console.error);
