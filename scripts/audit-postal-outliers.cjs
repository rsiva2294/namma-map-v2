const fs = require('fs');
const path = require('path');
const topojson = require('topojson-client');

const THRESHOLD = 0.15; // Degrees (~16km)

function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}

function getBBox(geometry) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const processCoords = (coords) => {
        if (!coords) return;
        if (typeof coords[0] === 'number') {
            minX = Math.min(minX, coords[0]);
            minY = Math.min(minY, coords[1]);
            maxX = Math.max(maxX, coords[0]);
            maxY = Math.max(maxY, coords[1]);
        } else {
            coords.forEach(processCoords);
        }
    };
    processCoords(geometry.coordinates);
    return { minX, minY, maxX, maxY };
}

function getCentroid(geometry) {
    if (!geometry) return [0, 0];
    if (geometry.type === 'Point') return geometry.coordinates;
    const bbox = getBBox(geometry);
    return [(bbox.minX + bbox.maxX) / 2, (bbox.minY + bbox.maxY) / 2];
}

async function run() {
    console.log('Starting Postal Data Audit...');
    
    // 1. Load Pincode Boundaries
    const topoPath = 'public/data/tn_pincodes.topojson';
    if (!fs.existsSync(topoPath)) {
        console.error(`Error: ${topoPath} not found.`);
        return;
    }
    
    const topoData = JSON.parse(fs.readFileSync(topoPath, 'utf8'));
    const pincodesGeoJson = topojson.feature(topoData, topoData.objects.PIN_code_Boundary);
    const pincodeMap = new Map();

    pincodesGeoJson.features.forEach(f => {
        const pin = (f.properties.pin_code || f.properties.PIN_CODE || f.properties.pincode).toString();
        pincodeMap.set(pin, getCentroid(f.geometry));
    });

    console.log(`Loaded ${pincodeMap.size} pincode boundaries.`);

    // 2. Scan all district files
    const postalDir = 'public/data/postal_by_district';
    if (!fs.existsSync(postalDir)) {
        console.error(`Error: ${postalDir} not found.`);
        return;
    }
    
    const files = fs.readdirSync(postalDir);
    let totalOffices = 0;
    let totalOutliers = 0;
    let unknownPincodes = 0;
    const outliersByDistrict = {};

    files.forEach(file => {
        if (!file.endsWith('.json')) return;
        const district = file.replace('.json', '');
        const data = JSON.parse(fs.readFileSync(path.join(postalDir, file), 'utf8'));
        
        data.forEach(off => {
            totalOffices++;
            const pin = off.pincode.toString();
            const centroid = pincodeMap.get(pin);
            
            if (!centroid) {
                unknownPincodes++;
                return;
            }
            
            const dist = getDistance(centroid, [off.longitude, off.latitude]);
            if (dist > THRESHOLD) {
                totalOutliers++;
                if (!outliersByDistrict[district]) outliersByDistrict[district] = 0;
                outliersByDistrict[district]++;
            }
        });
    });

    console.log(`\n--- AUDIT SUMMARY ---`);
    console.log(`Total Offices Scanned: ${totalOffices}`);
    console.log(`Total Outliers Found:  ${totalOutliers} (${((totalOutliers/totalOffices)*100).toFixed(2)}%)`);
    console.log(`Unknown Pincode Areas: ${unknownPincodes}`);
    console.log(`\nOutliers by District:`);
    
    Object.entries(outliersByDistrict)
        .sort((a, b) => b[1] - a[1])
        .forEach(([dist, count]) => {
            console.log(`- ${dist.padEnd(20)}: ${count}`);
        });
}

run();
