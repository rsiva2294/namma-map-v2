const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '..', 'public', 'data', 'Health_Facilities.json');
const dataDir = path.join(__dirname, '..', 'public', 'data');
const districtDir = path.join(dataDir, 'health_by_district');

const PRIORITY_TYPES = new Set(['CHC', 'SDH', 'DH', 'MCH']);
const CAPABILITY_FIELDS = [
  'hwc',
  'kayakalp',
  'delivery_p',
  'fru',
  'nqas',
  'dental_uni',
  'blood_bank',
  'blood_stor',
  'dialysis_c',
  'ct',
  'mri',
  'sncu',
  'nbsu',
  'deic',
  'cbnaat_sit',
  'tele_v_car',
  'stemi_hubs',
  'stemi_spok',
  'cath_lab_m',
  'prem_centr',
  'script_hub',
  'script_spo'
];

const asFeatureCollection = (features) => ({
  type: 'FeatureCollection',
  features,
});

const increment = (target, key, amount = 1) => {
  target[key] = (target[key] || 0) + amount;
};

const hasCapability = (properties, field) => {
  const value = properties[field];
  if (field === 'fru') {
    return value !== null && value !== undefined && `${value}`.trim() !== '';
  }
  return value === 1 || value === '1' || value === true;
};

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
if (!source || source.type !== 'FeatureCollection' || !Array.isArray(source.features)) {
  throw new Error('Health_Facilities.json is not a valid GeoJSON FeatureCollection');
}

ensureDir(districtDir);

const districts = new Map();
const statewideByType = {};
const statewideLocation = {};
const statewideCapabilities = Object.fromEntries(CAPABILITY_FIELDS.map((field) => [field, 0]));
const priorityFeatures = [];
const searchIndex = [];

for (const feature of source.features) {
  const properties = feature.properties || {};
  const geometry = feature.geometry || {};
  const coordinates = Array.isArray(geometry.coordinates) ? geometry.coordinates : [null, null];
  const [lng, lat] = coordinates;

  const districtName = (properties.district_n || 'Unknown').toString().trim() || 'Unknown';
  const facilityType = (properties.facility_t || 'UNKNOWN').toString().trim() || 'UNKNOWN';
  const locationType = (properties.location_t || 'Unknown').toString().trim() || 'Unknown';

  if (!districts.has(districtName)) {
    districts.set(districtName, {
      district: districtName,
      file_name: `${districtName}.geojson`,
      total: 0,
      by_type: {},
      location: {},
      capabilities: Object.fromEntries(CAPABILITY_FIELDS.map((field) => [field, 0])),
      features: [],
    });
  }

  const districtEntry = districts.get(districtName);
  districtEntry.features.push(feature);
  districtEntry.total += 1;
  increment(districtEntry.by_type, facilityType);
  increment(districtEntry.location, locationType);

  increment(statewideByType, facilityType);
  increment(statewideLocation, locationType);

  for (const field of CAPABILITY_FIELDS) {
    if (hasCapability(properties, field)) {
      districtEntry.capabilities[field] += 1;
      statewideCapabilities[field] += 1;
    }
  }

  if (PRIORITY_TYPES.has(facilityType)) {
    priorityFeatures.push(feature);
  }

  searchIndex.push([
    (properties.facility_n || '').toString(),
    districtName,
    (properties.block_name || '').toString(),
    facilityType,
    lat,
    lng,
    (properties.location_t || '').toString(),
    (properties.sub_distri || '').toString(),
    properties.reference_ ?? null,
  ]);
}

const districtManifest = [...districts.values()]
  .sort((a, b) => a.district.localeCompare(b.district))
  .map(({ features, ...districtMeta }) => districtMeta);

for (const districtEntry of districts.values()) {
  const outputPath = path.join(districtDir, districtEntry.file_name);
  fs.writeFileSync(outputPath, JSON.stringify(asFeatureCollection(districtEntry.features)));
}

const manifest = {
  generated_at: new Date().toISOString(),
  source_file: 'Health_Facilities.json',
  total_facilities: source.features.length,
  district_count: districtManifest.length,
  priority_types: [...PRIORITY_TYPES],
  capability_fields: CAPABILITY_FIELDS,
  statewide: {
    by_type: statewideByType,
    location: statewideLocation,
    capabilities: statewideCapabilities,
    priority_total: priorityFeatures.length,
  },
  districts: districtManifest,
};

fs.writeFileSync(
  path.join(dataDir, 'health_manifest.json'),
  JSON.stringify(manifest, null, 2)
);

fs.writeFileSync(
  path.join(dataDir, 'health_statewide_priority.geojson'),
  JSON.stringify(asFeatureCollection(priorityFeatures))
);

fs.writeFileSync(
  path.join(dataDir, 'health_search_index.json'),
  JSON.stringify(searchIndex)
);

console.log(
  `Generated health assets for ${source.features.length} facilities across ${districtManifest.length} districts.`
);
