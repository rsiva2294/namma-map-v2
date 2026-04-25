const fs = require('fs');
const path = require('path');

const SHARD_DIR = 'public/data/tneb_by_district';

function generate() {
    console.log('Generating TNEB search index...');
    
    if (!fs.existsSync(SHARD_DIR)) {
        console.error('TNEB shard directory not found');
        return;
    }

    const files = fs.readdirSync(SHARD_DIR).filter(f => f.endsWith('_offices.json'));
    const index = [];

    files.forEach(file => {
        const district = file.replace('_offices.json', '');
        const data = JSON.parse(fs.readFileSync(path.join(SHARD_DIR, file), 'utf8'));
        
        data.features.forEach(f => {
            const p = f.properties;
            const coords = f.geometry.coordinates;
            
            // Format: [name, section_code, circle_code, lat, lng, district]
            index.push([
                p.section_na,
                p.section_co,
                p.circle_cod,
                parseFloat(coords[1].toFixed(6)),
                parseFloat(coords[0].toFixed(6)),
                district
            ]);
        });
    });

    fs.writeFileSync('public/data/tneb_index.json', JSON.stringify(index));
    console.log(`Successfully generated TNEB index with ${index.length} sections.`);
}

generate();
