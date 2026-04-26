const fs = require('fs');
const path = require('path');

const filePath = 'public/data/local_bodies/Panchayat_Village.json';
const content = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(content);

console.log('Type:', data.type);
const objectKeys = Object.keys(data.objects);
console.log('Object Keys:', objectKeys);

const firstObject = data.objects[objectKeys[0]];
console.log('Number of features:', firstObject.geometries.length);
console.log('First feature properties:', firstObject.geometries[0].properties);

// Collect all district names to see if we can split by district
const districts = new Set();
firstObject.geometries.forEach(g => {
  if (g.properties && g.properties.District) {
    districts.add(g.properties.District);
  } else if (g.properties && g.properties.district) {
    districts.add(g.properties.district);
  } else if (g.properties && g.properties.DISTRICT) {
    districts.add(g.properties.DISTRICT);
  }
});

console.log('Districts found:', Array.from(districts).sort());
