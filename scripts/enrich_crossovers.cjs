/**
 * enrich_crossovers.cjs
 * Incorporates high-resolution official/community tokens for Crossover monsters:
 * 1. Monster Hunter (294 creatures) via Capcom official guild icons (CrimsonNynja/monster-hunter-DB)
 * 2. Skyrim Homebrew (61 creatures) via Elder Scrolls / WotC base archetypes
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('🔄 Fetching Monster Hunter icon index from GitHub...');
  const iconList = await fetchJson('https://api.github.com/repos/CrimsonNynja/monster-hunter-DB/contents/icons');
  console.log(`✓ Fetched ${iconList.length} Monster Hunter icon assets.`);

  const iconMap = new Map();
  for (const icon of iconList) {
    const clean = icon.name
      .replace(/^[A-Za-z0-9]+-/, '')
      .replace(/_Icon\.png$/i, '')
      .replace(/_/g, ' ')
      .trim().toLowerCase();

    // Prefer higher resolution versions (Iceborne, Sunbreak, World)
    if (!iconMap.has(clean) || icon.name.startsWith('MHW') || icon.name.startsWith('MHRS') || icon.name.startsWith('MHWI')) {
      iconMap.set(clean, icon.download_url);
    }
  }

  const manualAliases = {
    'safijiiva': iconMap.get('safijiiva'),
    'xenojiiva': iconMap.get('xenojiiva'),
    'dahren mohran': iconMap.get('dahren mohran'),
    'dalamadur': iconMap.get('dalamadur-head') || iconMap.get('dalamadur'),
    'shah dalamadur': iconMap.get('shah dalamadur-head') || iconMap.get('dalamadur-head'),
    'kestodon': iconMap.get('kestodon male') || iconMap.get('kestodon female'),
    'girros pup': iconMap.get('great girros') || iconMap.get('girros'),
    'vespoid princess': iconMap.get('vespoid queen') || iconMap.get('vespoid'),
    'ahtal-neset': iconMap.get('ahtal-ka'),
    'chaotic gigginox': iconMap.get('baleful gigginox') || iconMap.get('gigginox'),
    'bullfango shoat': iconMap.get('bullfango'),
    'gobling': iconMap.get('gobul'),
    'wingdrake': iconMap.get('barnos') || iconMap.get('noios') || iconMap.get('cortos'),
    'qurio': iconMap.get('gaismagorm') || iconMap.get('malzeno'),
    'qurio swarm': iconMap.get('gaismagorm') || iconMap.get('malzeno'),
    'dire miralis': iconMap.get('fatalis') || iconMap.get('crimson fatalis'),
    'archtempered dire miralis': iconMap.get('fatalis'),
    'tempered dire miralis': iconMap.get('fatalis'),
    'palamute': iconMap.get('felyne')
  };

  function resolveMHToken(m) {
    const norm = m.name.toLowerCase().trim();
    const noPunct = norm.replace(/['’]/g, '');

    if (iconMap.has(norm)) return iconMap.get(norm);
    if (iconMap.has(noPunct)) return iconMap.get(noPunct);
    if (manualAliases[norm] || manualAliases[noPunct]) return manualAliases[norm] || manualAliases[noPunct];

    const base = norm
      .replace(/^(tempered|archtempered|adolescent|baby|young|juvenile|blood soaked|fey|pumpkin|wild)\s+/i, '')
      .replace(/\s+(cub|pup|kit|shoat|swarm|\(shell\)|\(true form\))$/i, '')
      .replace(/tobi-kitachi/i, 'tobi-kadachi')
      .replace(/amatsumagatsuchi/i, 'amatsu')
      .replace(/['’]/g, '')
      .trim();

    if (iconMap.has(base)) return iconMap.get(base);
    if (manualAliases[base]) return manualAliases[base];

    return null;
  }

  // Load bestiary
  const publicPath = path.join(__dirname, '../public/data/bestiary.json');
  const distPath = path.join(__dirname, '../dist/data/bestiary.json');

  const bestiaryData = JSON.parse(fs.readFileSync(publicPath, 'utf8'));
  const isArray = Array.isArray(bestiaryData);
  const monsters = isArray ? bestiaryData : (bestiaryData.monster || []);

  // Build dictionary of existing official tokens for archetype matching
  const tokenByName = new Map();
  for (const m of monsters) {
    if (m.hasToken || m.tokenUrl) {
      const norm = m.name.toLowerCase().trim();
      if (!tokenByName.has(norm)) tokenByName.set(norm, m.tokenUrl);
    }
  }

  let mhCount = 0;
  let skyrimCount = 0;

  for (const m of monsters) {
    // 1. Monster Hunter
    if (m.sourceGroup === 'Monster Hunter Monster Manual' && (!m.hasToken || !m.tokenUrl)) {
      const token = resolveMHToken(m);
      if (token) {
        m.tokenUrl = token;
        m.hasToken = true;
        mhCount++;
      }
    }

    // 2. Skyrim Homebrew archetypes & bandits
    if (m.sourceGroup === 'Skyrim Homebrew' && (!m.hasToken || !m.tokenUrl)) {
      const norm = m.name.toLowerCase().trim();
      let matchedToken = null;

      if (/^bandit\s+/i.test(norm) && tokenByName.has('bandit')) {
        matchedToken = tokenByName.get('bandit');
      } else if (/^draugr/i.test(norm) && (tokenByName.has('wight') || tokenByName.has('zombie'))) {
        matchedToken = tokenByName.get('wight') || tokenByName.get('zombie');
      } else if (norm.includes('ballista') && tokenByName.has('ballista')) {
        matchedToken = tokenByName.get('ballista');
      } else if (norm.includes('skeleton') && tokenByName.has('skeleton')) {
        matchedToken = tokenByName.get('skeleton');
      } else if (norm.includes('ghost') && tokenByName.has('ghost')) {
        matchedToken = tokenByName.get('ghost');
      }

      if (matchedToken) {
        m.tokenUrl = matchedToken;
        m.hasToken = true;
        skyrimCount++;
      }
    }
  }

  console.log(`\n🎉 ENRICHMENT RESULTS:`);
  console.log(`  ✓ Monster Hunter tokens added: ${mhCount} / 294`);
  console.log(`  ✓ Skyrim archetypes matched: ${skyrimCount}`);
  console.log(`  ✓ Total new tokens: ${mhCount + skyrimCount}`);

  const remainingNoToken = monsters.filter(m => !m.hasToken && !m.tokenUrl).length;
  console.log(`  📊 Remaining without token: ${remainingNoToken}`);

  const outData = isArray ? monsters : { ...bestiaryData, monster: monsters };
  fs.writeFileSync(publicPath, JSON.stringify(outData, null, 2), 'utf8');
  console.log(`💾 Saved to ${publicPath}`);

  if (fs.existsSync(distPath)) {
    fs.writeFileSync(distPath, JSON.stringify(outData, null, 2), 'utf8');
    console.log(`💾 Saved to ${distPath}`);
  }
}

run().catch(err => {
  console.error('❌ Error during crossover enrichment:', err);
  process.exit(1);
});
