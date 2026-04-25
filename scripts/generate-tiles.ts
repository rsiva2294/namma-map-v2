import fs from 'fs';
import path from 'path';
import geojsonvt from 'geojson-vt';
import vtpbf from 'vt-pbf';

const DATA_DIR = path.join(process.cwd(), 'public/data');
const TILE_DIR = path.join(process.cwd(), 'public/tiles');

async function generateTiles(layerName: string, sourceFile: string) {
  console.log(`Generating binary tiles for ${layerName}...`);
  
  const rawData = fs.readFileSync(path.join(DATA_DIR, sourceFile), 'utf8');
  const geojson = JSON.parse(rawData);

  const tileIndex = geojsonvt(geojson, {
    maxZoom: 14,
    indexMaxZoom: 5,
    tolerance: 3,
    extent: 4096,
    buffer: 64
  });

  const layerPath = path.join(TILE_DIR, layerName);
  if (!fs.existsSync(layerPath)) fs.mkdirSync(layerPath, { recursive: true });

  // For the proof of concept, we'll generate tiles for Madurai area at zoom 12-14
  // Madurai is around lat 9.9, lng 78.1
  // We'll generate a small box to verify
  
  console.log('Writing binary .pbf tiles...');
  
  // Madurai z12 tile coords: x=2936, y=1878 approx
  for (let z = 5; z <= 14; z++) {
    // Generate a few tiles per zoom level for testing
    // In production, we'd iterate over the whole index
    const tiles = (tileIndex as any).tileCoords; // Not easily accessible in JS
    
    // We'll just generate the one tile for Madurai at each level to verify
    const lon = 78.1;
    const lat = 9.9;
    const x = Math.floor((lon + 180) / 360 * Math.pow(2, z));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));

    const tile = tileIndex.getTile(z, x, y);
    if (tile) {
      const pbf = vtpbf.fromGeojsonVt({ [layerName]: tile });
      const zPath = path.join(layerPath, z.toString());
      const xPath = path.join(zPath, x.toString());
      if (!fs.existsSync(xPath)) fs.mkdirSync(xPath, { recursive: true });
      fs.writeFileSync(path.join(xPath, `${y}.pbf`), Buffer.from(pbf));
    }
  }

  console.log(`Done! Binary tiles ready in public/tiles/${layerName}`);
}

generateTiles('health', 'health_statewide_priority.geojson').catch(console.error);
