import fs from 'fs';
import path from 'path';
import geojsonvt from 'geojson-vt';
// @ts-ignore
import vtpbf from 'vt-pbf';
import * as topojson from 'topojson-client';

const DATA_DIR = path.join(process.cwd(), 'public/data');
const TILE_DIR = path.join(process.cwd(), 'public/tiles');

async function generateTiles(layerName: string, geojson: any) {
  console.log(`Generating binary tiles for ${layerName} (${geojson.features.length} features)...`);
  
  const tileIndex = geojsonvt(geojson, {
    maxZoom: 14,
    indexMaxZoom: 5,
    tolerance: 3,
    extent: 4096,
    buffer: 64
  });

  const layerPath = path.join(TILE_DIR, layerName);
  if (!fs.existsSync(layerPath)) fs.mkdirSync(layerPath, { recursive: true });

  const zoomLevels = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  let totalTiles = 0;

  for (const z of zoomLevels) {
    // Tamil Nadu bounds: approx 76.2 to 80.3 E, 8.1 to 13.5 N
    const minLon = 76.0, maxLon = 80.5, minLat = 8.0, maxLat = 14.0;
    
    const minX = Math.floor((minLon + 180) / 360 * Math.pow(2, z));
    const maxX = Math.floor((maxLon + 180) / 360 * Math.pow(2, z));
    const minY = Math.floor((1 - Math.log(Math.tan(maxLat * Math.PI / 180) + 1 / Math.cos(maxLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
    const maxY = Math.floor((1 - Math.log(Math.tan(minLat * Math.PI / 180) + 1 / Math.cos(minLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const tile = tileIndex.getTile(z, x, y);
        if (tile && tile.features.length > 0) {
          const pbf = vtpbf.fromGeojsonVt({ [layerName]: tile });
          const zPath = path.join(layerPath, z.toString());
          const xPath = path.join(zPath, x.toString());
          if (!fs.existsSync(xPath)) fs.mkdirSync(xPath, { recursive: true });
          fs.writeFileSync(path.join(xPath, `${y}.pbf`), Buffer.from(pbf));
          totalTiles++;
        }
      }
    }
  }

  console.log(`Done! Generated ${totalTiles} binary tiles for ${layerName} in public/tiles/${layerName}`);
}

async function run() {
  // 1. TNEB Boundaries
  const tnebTopo = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'tneb_boundaries.topojson'), 'utf8'));
  const tnebGeo = topojson.feature(tnebTopo, tnebTopo.objects[Object.keys(tnebTopo.objects)[0]]) as any;
  await generateTiles('tneb', tnebGeo);

  // 2. PDS Shops (Aggregated)
  console.log('Aggregating PDS shops...');
  const pdsDir = path.join(DATA_DIR, 'pds');
  const pdsFiles = fs.readdirSync(pdsDir).filter(f => f.endsWith('.json'));
  const allPdsFeatures: any[] = [];
  
  for (const file of pdsFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(pdsDir, file), 'utf8'));
    allPdsFeatures.push(...data.features);
  }
  
  const pdsGeo = { type: 'FeatureCollection', features: allPdsFeatures };
  await generateTiles('pds', pdsGeo);
}

run().catch(console.error);
