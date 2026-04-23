const fs = require('fs');
const path = require('path');

const pdsDir = './public/data/pds';
const files = fs.readdirSync(pdsDir).filter(f => f.endsWith('.json'));

const index = [];

files.forEach(file => {
    const content = fs.readFileSync(path.join(pdsDir, file), 'utf8');
    const data = JSON.parse(content);
    data.features.forEach(f => {
        const p = f.properties;
        const coords = f.geometry.coordinates;
        // Format: [shop_code, name, taluk, district, lat, lng]
        index.push([
            p.shop_code || '',
            p.name || '',
            p.taluk || '',
            p.district || '',
            coords[1], // lat
            coords[0]  // lng
        ]);
    });
});

fs.writeFileSync('./public/data/pds_index.json', JSON.stringify(index));
console.log(`Generated index with ${index.length} shops.`);
