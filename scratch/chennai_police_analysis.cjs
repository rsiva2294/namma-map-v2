const fs = require('fs');

const points = JSON.parse(fs.readFileSync('public/data/police_by_district/Chennai_stations.json', 'utf8'));
const boundaries = JSON.parse(fs.readFileSync('public/data/police_by_district/Chennai_boundaries.json', 'utf8'));

// --- HELPERS ---

function normalize(str) {
  if (!str) return '';
  return str.toString().toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function extractCode(name) {
  if (!name) return null;
  // Match 1-2 letters followed by 1-3 digits
  const match = name.match(/\b([A-Z]{1,2})\s*(\d{1,3})\b/i);
  if (match) {
    return (match[1] + match[2]).toUpperCase();
  }
  return null;
}

function pointInPolygon(point, vs) {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function isInside(point, geometry) {
  if (geometry.type === 'Polygon') {
    return pointInPolygon(point, geometry.coordinates[0]);
  } else if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some(poly => pointInPolygon(point, poly[0]));
  }
  return false;
}

function haversineDistance(coords1, coords2) {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getCentroid(geometry) {
  let coords = [];
  if (geometry.type === 'Polygon') {
    coords = geometry.coordinates[0];
  } else if (geometry.type === 'MultiPolygon') {
    coords = geometry.coordinates[0][0];
  }
  let x = 0, y = 0;
  coords.forEach(c => { x += c[0]; y += c[1]; });
  return [x / coords.length, y / coords.length];
}

// --- ANALYSIS ---

const mapping = [];
const boundaryMatched = new Set();

points.features.forEach(p => {
  const pProps = p.properties;
  const pCoords = p.geometry.coordinates;
  const pCode = extractCode(pProps.ps_name || pProps.name);
  const pNameFull = pProps.ps_name || pProps.name;
  const pNameNorm = normalize(pNameFull).replace(normalize(pCode || ''), '');

  let bestMatch = null;
  let maxScore = -1;

  boundaries.features.forEach((b, idx) => {
    const bProps = b.properties;
    const bCode = bProps.police_s_1?.toString().toUpperCase();
    const bNameNorm = normalize(bProps.police_s_2 || bProps.police_sta || '');
    const spatialInside = isInside(pCoords, b.geometry);
    
    let score = 0;
    let matchType = '';

    const codeMatch = pCode && bCode && pCode === bCode;
    const nameMatch = pNameNorm && bNameNorm && (pNameNorm.includes(bNameNorm) || bNameNorm.includes(pNameNorm));

    if (codeMatch && nameMatch && spatialInside) {
      score = 100; matchType = 'Code+Name+Spatial';
    } else if (codeMatch && nameMatch) {
      score = 95; matchType = 'Code+Name';
    } else if (codeMatch && spatialInside) {
      score = 90; matchType = 'Code+Spatial';
    } else if (codeMatch) {
      score = 75; matchType = 'Code Only';
    } else if (nameMatch && spatialInside) {
      score = 70; matchType = 'Name+Spatial';
    } else if (spatialInside) {
      score = 60; matchType = 'Spatial Only';
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = { b, score, matchType, spatialInside, bIdx: idx };
    }
  });

  // Fallback to nearest if score is 0
  if (maxScore <= 0) {
    let minDist = Infinity;
    let nearest = null;
    boundaries.features.forEach((b, idx) => {
      const dist = haversineDistance(pCoords, getCentroid(b.geometry));
      if (dist < minDist) {
        minDist = dist;
        nearest = { b, bIdx: idx };
      }
    });
    bestMatch = { ...nearest, score: 50, matchType: 'Nearest Fallback', spatialInside: false };
  }

  if (bestMatch) {
    boundaryMatched.add(bestMatch.bIdx);
    mapping.push({
      station_name: pNameFull,
      station_code: pCode,
      matched_boundary_name: bestMatch.b.properties.police_sta,
      match_type: bestMatch.matchType,
      confidence_score: bestMatch.score,
      distance: bestMatch.spatialInside ? 0 : haversineDistance(pCoords, getCentroid(bestMatch.b.geometry)).toFixed(3),
      inside_polygon: bestMatch.spatialInside
    });
  }
});

// Detect unmapped boundaries
const unmatchedBoundaries = boundaries.features
  .map((b, i) => ({ b, i }))
  .filter(item => !boundaryMatched.has(item.i))
  .map(item => item.b.properties.police_sta);

// Summary Stats
const stats = {
  total_stations: points.features.length,
  total_boundaries: boundaries.features.length,
  auto_matched: mapping.filter(m => m.confidence_score >= 90).length,
  needs_review: mapping.filter(m => m.confidence_score < 90 && m.confidence_score >= 50).length,
  unmatched_stations: points.features.length - mapping.length,
  unmatched_boundaries: unmatchedBoundaries.length,
  data_errors: {
    swapped_codes: mapping.filter(m => m.match_type.includes('Spatial') && m.station_code && extractCode(m.matched_boundary_name) && m.station_code !== extractCode(m.matched_boundary_name)).length
  }
};

fs.writeFileSync('scratch/chennai_police_report.json', JSON.stringify({ mapping, unmatchedBoundaries, stats }, null, 2));
console.log('Analysis complete. Report written to scratch/chennai_police_report.json');
