import fs from 'fs';
import path from 'path';

async function run() {
  console.log('🚀 Starting Postal Office District Split...');

  const dataDir = path.resolve('public/data');
  const outputDir = path.join(dataDir, 'postal_by_district');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Load Data
  console.log('📖 Reading large postal JSON...');
  const postalData = JSON.parse(fs.readFileSync(path.join(dataDir, 'tn_postal_offices.json'), 'utf8'));

  const districtGroups: Record<string, any[]> = {};

  // 2. Group by District
  console.log(`📊 Processing ${postalData.length} postal offices...`);

  for (const office of postalData) {
    const district = office.district || 'Unknown';
    // Normalize district name to match our other files (Sentence Case)
    const normalizedDistrict = district.trim()
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    if (!districtGroups[normalizedDistrict]) {
      districtGroups[normalizedDistrict] = [];
    }
    districtGroups[normalizedDistrict].push(office);
  }

  // 3. Save Files
  for (const [district, offices] of Object.entries(districtGroups)) {
    const filePath = path.join(outputDir, `${district}.json`);
    fs.writeFileSync(filePath, JSON.stringify(offices, null, 2));
    console.log(`✅ Saved ${offices.length} offices to ${district}.json`);
  }

  console.log('🎉 Postal splitting complete!');
}

run().catch(console.error);
