const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/data/health_by_district/Madurai.geojson', 'utf8'));
const thirunagar = data.features.filter(f => f.properties.facility_n && f.properties.facility_n.toUpperCase().includes('THIRUPARANKUNDRAM'));
console.log(JSON.stringify(thirunagar, null, 2));
