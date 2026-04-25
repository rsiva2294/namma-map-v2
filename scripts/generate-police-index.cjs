const fs = require('fs');
const path = require('path');

const SHARD_DIR = 'public/data/police_by_district';

function generate() {
    console.log('Generating Police search index...');
    
    if (!fs.existsSync(SHARD_DIR)) {
        console.error('Police shard directory not found');
        return;
    }

    const files = fs.readdirSync(SHARD_DIR).filter(f => f.endsWith('_stations.json'));
    const index = [];

    files.forEach(file => {
        const district = file.replace('_stations.json', '');
        const data = JSON.parse(fs.readFileSync(path.join(SHARD_DIR, file), 'utf8'));
        
        data.features.forEach(f => {
            const p = f.properties;
            const coords = f.geometry.coordinates;
            
            // Format: [name, ps_code, lat, lng, district]
            index.push([
                p.ps_name || p.name,
                p.ps_code,
                parseFloat(coords[1].toFixed(6)),
                parseFloat(coords[0].toFixed(6)),
                district
            ]);
        });
    });

    fs.writeFileSync('public/data/police_index.json', JSON.stringify(index));
    console.log(`Successfully generated Police index with ${index.length} stations.`);
}

generate();
