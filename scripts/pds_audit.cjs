const fs = require('fs');
const path = require('path');

// Resolve paths relative to the script location
const MANIFEST_PATH = path.join(__dirname, '../public/data/pds_manifest.json');
const PDS_DATA_DIR = path.join(__dirname, '../public/data/pds');

function audit() {
  console.log('--- PDS District Registry Audit ---');

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('Error: Manifest file not found at:', MANIFEST_PATH);
    console.log('Make sure you are running the script from the project root.');
    return;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    const pdsFiles = fs.readdirSync(PDS_DATA_DIR);

    const errors = [];
    const warnings = [];

    // 1. Check for missing PDS files
    manifest.forEach(d => {
      const fileName = `${d.pds_file}.json`;
      if (!pdsFiles.includes(fileName)) {
        errors.push(`Missing PDS file: "${fileName}" referenced by district ID "${d.id}"`);
      }
    });

    // 2. Check for duplicate aliases
    const aliasMap = new Map();
    manifest.forEach(d => {
      d.aliases.forEach(alias => {
        const norm = alias.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (aliasMap.has(norm)) {
          errors.push(`Duplicate alias mapping: "${alias}" is mapped to both "${aliasMap.get(norm)}" and "${d.id}"`);
        } else {
          aliasMap.set(norm, d.id);
        }
      });
    });

    // 3. Check for orphan PDS files
    const referencedFiles = new Set(manifest.map(d => `${d.pds_file}.json`));
    pdsFiles.forEach(file => {
      if (file.endsWith('.json') && !referencedFiles.has(file)) {
        warnings.push(`Orphan PDS file: "${file}" is not referenced by any district in the manifest.`);
      }
    });

    console.log(`\nAudit Summary:`);
    console.log(`- Canonical Districts: ${manifest.length}`);
    console.log(`- Total Aliases: ${aliasMap.size}`);
    console.log(`- PDS Files in Folder: ${pdsFiles.length}`);

    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach(e => console.log('  -', e));
    } else {
      console.log('\n✅ No critical errors found.');
    }

    if (warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      warnings.forEach(w => console.log('  -', w));
    }

  } catch (err) {
    console.error('Audit failed due to an error:', err.message);
  }

  console.log('\n--- Audit Complete ---');
}

audit();
