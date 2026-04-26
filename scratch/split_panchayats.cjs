const fs = require('fs');
const path = require('path');
const topojson = require('topojson-client');

const inputPath = 'public/data/local_bodies/Panchayat_Village.json';
const outputDir = 'public/data/local_bodies/village_panchayat';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Reading TopoJSON...');
const topology = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

console.log('Converting to GeoJSON...');
const geojson = topojson.feature(topology, topology.objects.Panchayat_Village);

console.log('Splitting by district...');
const districts = {};

geojson.features.forEach(feature => {
  const district = feature.properties.District || feature.properties.district || feature.properties.DISTRICT || 'Unknown';
  if (!districts[district]) {
    districts[district] = {
      type: 'FeatureCollection',
      features: []
    };
  }
  districts[district].features.push(feature);
});

Object.keys(districts).forEach(district => {
  const fileName = `${district.replace(/\s+/g, '_')}.json`;
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(districts[district]));
  console.log(`Saved: ${fileName} (${districts[district].features.length} features)`);
});

console.log('Done!');
