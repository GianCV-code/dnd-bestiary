/**
 * import_local_tokens.cjs
 * Scans public/tokens/ (e.g. public/tokens/darkest-dungeon/, public/tokens/dark-souls/, public/tokens/skyrim/)
 * and automatically matches local image files to monsters in bestiary.json.
 */

const fs = require('fs');
const path = require('path');

const TOKENS_ROOT = path.join(__dirname, '../public/tokens');
const PUBLIC_DATA = path.join(__dirname, '../public/data/bestiary.json');
const DIST_DATA = path.join(__dirname, '../dist/data/bestiary.json');

function normalizeName(str) {
  return (str || '')
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '') // remove extension
    .replace(/[_\-]+/g, ' ')
    .replace(/['’]/g, '')
    .trim();
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function run() {
  if (!fs.existsSync(TOKENS_ROOT)) {
    fs.mkdirSync(TOKENS_ROOT, { recursive: true });
    fs.mkdirSync(path.join(TOKENS_ROOT, 'darkest-dungeon'), { recursive: true });
    fs.mkdirSync(path.join(TOKENS_ROOT, 'dark-souls'), { recursive: true });
    fs.mkdirSync(path.join(TOKENS_ROOT, 'skyrim'), { recursive: true });
    console.log(`📁 Created folder structure in public/tokens/ for local drop-in assets.`);
  }

  const allFiles = getAllFiles(TOKENS_ROOT);
  const imageFiles = allFiles.filter(f => /\.(png|webp|jpg|jpeg|svg)$/i.test(f));

  console.log(`🔍 Found ${imageFiles.length} image files in public/tokens/`);

  if (imageFiles.length === 0) {
    console.log(`ℹ️ To import Darkest Dungeon or Dark Souls tokens:`);
    console.log(`   1. Drop images/tokens into public/tokens/darkest-dungeon/ or public/tokens/dark-souls/`);
    console.log(`   2. Run: node scripts/import_local_tokens.cjs`);
    return;
  }

  const fileMap = new Map();
  for (const f of imageFiles) {
    const relPath = '/' + path.relative(path.join(__dirname, '../public'), f).replace(/\\/g, '/');
    const baseName = path.basename(f);
    const norm = normalizeName(baseName);
    fileMap.set(norm, relPath);
  }

  const bestiaryData = JSON.parse(fs.readFileSync(PUBLIC_DATA, 'utf8'));
  const isArray = Array.isArray(bestiaryData);
  const monsters = isArray ? bestiaryData : (bestiaryData.monster || []);

  let matched = 0;
  for (const m of monsters) {
    if (!m.hasToken || !m.tokenUrl) {
      const norm = normalizeName(m.name);
      if (fileMap.has(norm)) {
        m.tokenUrl = fileMap.get(norm);
        m.hasToken = true;
        matched++;
      }
    }
  }

  console.log(`✓ Matched and bound ${matched} local tokens to creatures in bestiary.json!`);

  const outData = isArray ? monsters : { ...bestiaryData, monster: monsters };
  fs.writeFileSync(PUBLIC_DATA, JSON.stringify(outData, null, 2), 'utf8');
  if (fs.existsSync(DIST_DATA)) {
    fs.writeFileSync(DIST_DATA, JSON.stringify(outData, null, 2), 'utf8');
  }
}

run();
