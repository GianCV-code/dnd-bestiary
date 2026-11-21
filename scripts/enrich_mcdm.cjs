/**
 * enrich_mcdm.cjs
 * Links high-resolution MCDM tokens from TheGiddyLimit/homebrew-img:
 * 1. Exact MCDM token matches from FleeMortals/monsterToken
 * 2. MCDM Slime Servant and variant matches to their MCDM base tokens
 * 3. MCDM species and minion variants mapped to MCDM's official art for that species
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_PATH = path.join(__dirname, '../public/data/bestiary.json');
const DIST_PATH = path.join(__dirname, '../dist/data/bestiary.json');
const ASSETS_PATH = path.join(__dirname, 'mcdm_assets.json');

function run() {
  if (!fs.existsSync(ASSETS_PATH)) {
    console.error('Missing mcdm_assets.json');
    process.exit(1);
  }

  const assets = JSON.parse(fs.readFileSync(ASSETS_PATH, 'utf8'));
  const fmTokens = new Map();

  for (const item of (assets.fmTokens || [])) {
    const norm = item.name.toLowerCase().replace(/\.webp$/i, '').trim();
    fmTokens.set(norm, item.download_url);
  }

  if (assets.welTokens) {
    for (const item of assets.welTokens) {
      const norm = item.name.toLowerCase().replace(/\.webp$/i, '').trim();
      fmTokens.set(norm, item.download_url);
    }
  }

  const bestiaryData = JSON.parse(fs.readFileSync(PUBLIC_PATH, 'utf8'));
  const isArray = Array.isArray(bestiaryData);
  const monsters = isArray ? bestiaryData : (bestiaryData.monster || []);

  let exactCount = 0;
  let variantCount = 0;

  const remaining = [];

  for (const m of monsters) {
    const isMCDM = (m.sourceGroup || m.source || '').toLowerCase().includes('flee') ||
                   (m.sourceGroup || m.source || '').toLowerCase().includes('evil lives');

    if (!isMCDM) continue;
    if (m.hasToken || m.tokenUrl) continue;

    const norm = m.name.toLowerCase().trim();

    // 1. Exact match
    if (fmTokens.has(norm)) {
      m.tokenUrl = fmTokens.get(norm);
      m.hasToken = true;
      exactCount++;
      continue;
    }

    // 2. Slime Servant / Variant of an MCDM token
    const baseVariant = norm
      .replace(/\s+slime servant$/i, '')
      .replace(/\s+companion$/i, '')
      .replace(/\s*\(.*?\)/g, '')
      .trim();

    if (fmTokens.has(baseVariant)) {
      m.tokenUrl = fmTokens.get(baseVariant);
      m.hasToken = true;
      variantCount++;
      continue;
    }

    // 3. MCDM Family & Species match (using MCDM's official artwork for each species)
    let familyToken = null;

    if (/^hobgoblin\s+/i.test(norm)) familyToken = fmTokens.get('hobgoblin trooper');
    else if (/^orc\s+/i.test(norm)) familyToken = fmTokens.get('orc blitzer');
    else if (/^bugbear\s+/i.test(norm)) familyToken = fmTokens.get('bugbear predator');
    else if (/^goblin\s+/i.test(norm)) familyToken = fmTokens.get('goblin sneak');
    else if (/^ogre\s+/i.test(norm)) familyToken = fmTokens.get('ogre basher');
    else if (/^time raider\s+/i.test(norm)) familyToken = fmTokens.get('time raider armiger');
    else if (/^fire giant\s+/i.test(norm)) familyToken = fmTokens.get('fire giant red fist');
    else if (/^frost giant\s+/i.test(norm)) familyToken = fmTokens.get('frost giant storm hurler');
    else if (/^stone giant\s+|basalt stone giant|granite stone giant/i.test(norm)) familyToken = fmTokens.get('marble stone giant');
    else if (/^gnoll\s+/i.test(norm)) familyToken = fmTokens.get('gnoll marauder');
    else if (/^kobold\s+/i.test(norm)) familyToken = fmTokens.get('kobold legionary');
    else if (/^lizardfolk\s+/i.test(norm)) familyToken = fmTokens.get('lizardfolk hunter');
    else if (/^voiceless talker\s+/i.test(norm)) familyToken = fmTokens.get('voiceless talker');
    else if (/^harpy\s+/i.test(norm)) familyToken = fmTokens.get('harpy');
    else if (/^minotaur\s+/i.test(norm)) familyToken = fmTokens.get('minotaur');
    else if (/^mummy\s+/i.test(norm)) familyToken = fmTokens.get('mummy');
    else if (/^treant\s+/i.test(norm)) familyToken = fmTokens.get('treant');
    else if (/^troll\s+/i.test(norm)) familyToken = fmTokens.get('troll');
    else if (/^vampire\s+/i.test(norm)) familyToken = fmTokens.get('vampire');
    else if (/^wight\s+/i.test(norm)) familyToken = fmTokens.get('wight deathguard');
    else if (/^hill giant\s+/i.test(norm)) familyToken = fmTokens.get('hill giant flunky');

    if (familyToken) {
      m.tokenUrl = familyToken;
      m.hasToken = true;
      variantCount++;
      continue;
    }

    remaining.push(m);
  }

  console.log(`\n🎉 MCDM ENRICHMENT RESULTS:`);
  console.log(`  ✓ Exact tokens bound: ${exactCount}`);
  console.log(`  ✓ Variant/species tokens bound: ${variantCount}`);
  console.log(`  ✓ Total MCDM tokens added: ${exactCount + variantCount}`);
  console.log(`  📊 MCDM creatures remaining without token: ${remaining.length}`);

  const outData = isArray ? monsters : { ...bestiaryData, monster: monsters };
  fs.writeFileSync(PUBLIC_PATH, JSON.stringify(outData, null, 2), 'utf8');
  console.log(`💾 Saved to ${PUBLIC_PATH}`);

  if (fs.existsSync(DIST_PATH)) {
    fs.writeFileSync(DIST_PATH, JSON.stringify(outData, null, 2), 'utf8');
    console.log(`💾 Saved to ${DIST_PATH}`);
  }
}

run();
