const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://namma-map.web.app';
const LAYERS = ['pincode', 'pds', 'tneb', 'constituency', 'police', 'health', 'local-bodies'];
const DISTRICT_DATA_DIR = 'public/data/postal_by_district';

function generate() {
    console.log('Generating sitemap...');
    
    if (!fs.existsSync(DISTRICT_DATA_DIR)) {
        console.error('District data directory not found');
        return;
    }

    const districts = fs.readdirSync(DISTRICT_DATA_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main Entry Point -->
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

    // Base Layer URLs
    LAYERS.forEach(layer => {
        sitemap += `  <url>
    <loc>${BASE_URL}/${layer}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>\n`;
    });

    // District-specific URLs
    districts.forEach(district => {
        const encodedDistrict = encodeURIComponent(district);
        LAYERS.forEach(layer => {
            sitemap += `  <url>
    <loc>${BASE_URL}/${layer}/${encodedDistrict}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
        });
    });

    sitemap += `</urlset>`;

    fs.writeFileSync('public/sitemap.xml', sitemap);
    console.log(`Successfully generated sitemap with ${districts.length * LAYERS.length + LAYERS.length + 1} URLs.`);
}

generate();
