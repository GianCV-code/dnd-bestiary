const fs = require('fs');
const path = require('path');
const {
  CACHE_DIR,
  BESTIARY_PATH,
  OUTPUT_FLUFF_PATH,
  fetchJson,
  cleanTag,
  cleanEntries,
  resolveImageHref,
  extractImagesFromFluff,
  THIRD_PARTY_SOURCES
} = require('./fluff_utils.cjs');

async function downloadCached(url, cacheFilename) {
  const cacheFile = path.join(CACHE_DIR, cacheFilename);
  if (fs.existsSync(cacheFile)) {
    try {
      return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    } catch (e) {
      // Re-download if corrupted
    }
  }
  try {
    const data = await fetchJson(url);
    fs.writeFileSync(cacheFile, JSON.stringify(data));
    return data;
  } catch (err) {
    // console.warn(`  ⚠️ Could not fetch ${url}: ${err.message}`);
    return null;
  }
}

async function run() {
  console.log('📖 Starting 5eTools Monster Fluff Extraction & Resolution...');

  if (!fs.existsSync(BESTIARY_PATH)) {
    console.error(`❌ Bestiary not found at ${BESTIARY_PATH}`);
    process.exit(1);
  }
  const bestiary = JSON.parse(fs.readFileSync(BESTIARY_PATH, 'utf8'));
  console.log(`Loaded bestiary.json with ${bestiary.length} creatures.`);

  // 1. Fetch fluff index
  console.log('\n--- 1. Fetching WotC Fluff Index ---');
  const fluffIndex = await downloadCached(
    'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data/bestiary/fluff-index.json',
    'fluff-index.json'
  );

  const rawFluffMap = new Map(); // key: `${name.toLowerCase()}__${source.toLowerCase()}`
  const rawFluffByName = new Map(); // key: `${name.toLowerCase()}` -> array of fluffs
  const mmFluffMap = new Map(); // key: `${name.toLowerCase()}` from MM

  // Helper to register raw fluff
  function registerRawFluff(item, sourceOverride) {
    if (!item || !item.name) return;
    const name = item.name.trim();
    const source = (item.source || sourceOverride || '').trim();
    const key = `${name.toLowerCase()}__${source.toLowerCase()}`;
    rawFluffMap.set(key, item);

    const nameKey = name.toLowerCase();
    if (!rawFluffByName.has(nameKey)) rawFluffByName.set(nameKey, []);
    rawFluffByName.get(nameKey).push(item);

    if (source.toUpperCase() === 'MM') {
      mmFluffMap.set(nameKey, item);
    }
  }

  // 2. Download all official WotC fluff files
  console.log('\n--- 2. Downloading & Indexing Official WotC Fluff ---');
  if (fluffIndex) {
    const entries = Object.entries(fluffIndex);
    console.log(`Processing ${entries.length} official fluff files...`);
    let downloadedCount = 0;
    for (const [code, filename] of entries) {
      const url = `https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data/bestiary/${filename}`;
      const data = await downloadCached(url, filename);
      if (data && Array.isArray(data.monsterFluff)) {
        for (const item of data.monsterFluff) {
          registerRawFluff(item, code);
        }
        downloadedCount++;
      }
    }
    console.log(`Indexed official fluff from ${downloadedCount} books.`);
  }

  // 3. Download & Index 3PP Fluff
  console.log('\n--- 3. Downloading & Indexing 3PP Fluff ---');
  for (const src of THIRD_PARTY_SOURCES) {
    const filename = `3pp_${src.sourceGroup.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    const data = await downloadCached(src.url, filename);
    if (!data) continue;

    let count = 0;
    if (Array.isArray(data.monsterFluff)) {
      for (const item of data.monsterFluff) {
        registerRawFluff(item, item.source || src.sourceGroup);
        count++;
      }
    }
    if (Array.isArray(data.monster)) {
      for (const m of data.monster) {
        if (m.fluff && (m.fluff.entries || m.fluff.images)) {
          registerRawFluff({
            name: m.name,
            source: m.source || src.sourceGroup,
            entries: m.fluff.entries || [],
            images: m.fluff.images || []
          }, m.source || src.sourceGroup);
          count++;
        }
      }
    }
    if (count > 0) {
      console.log(`  ✓ [${src.publisher}] ${src.sourceGroup}: ${count} fluff entries.`);
    }
  }

  console.log(`\nTotal raw fluff entries in database: ${rawFluffMap.size}`);
  console.log(`MM standalone fluff entries: ${mmFluffMap.size}`);

  // 4. Resolve _copy and _mod in all fluff entries
  console.log('\n--- 4. Resolving _copy and _mod references ---');
  function resolveFluff(item, depth = 0) {
    if (!item) return null;
    if (depth > 5) return item; // cycle protection

    if (!item._copy) {
      return item;
    }

    const copyTargetName = item._copy.name;
    const copyTargetSource = item._copy.source || item.source;
    const targetKey = `${(copyTargetName || '').toLowerCase()}__${(copyTargetSource || '').toLowerCase()}`;
    let target = rawFluffMap.get(targetKey) || (rawFluffByName.get((copyTargetName || '').toLowerCase()) || [])[0];

    if (!target) {
      // Return what it has
      return item;
    }

    // Recursively resolve target
    target = resolveFluff(target, depth + 1);

    // Merge entries
    let resolvedEntries = Array.isArray(target.entries) ? [...target.entries] : [];
    const mod = item._copy._mod;
    if (mod && mod.entries) {
      const mode = mod.entries.mode;
      const items = mod.entries.items ? (Array.isArray(mod.entries.items) ? mod.entries.items : [mod.entries.items]) : [];
      if (mode === 'prependArr') {
        resolvedEntries = [...items, ...resolvedEntries];
      } else if (mode === 'appendArr') {
        resolvedEntries = [...resolvedEntries, ...items];
      } else if (mode === 'replaceArr' || mode === 'setProp') {
        resolvedEntries = items.length > 0 ? items : (mod.entries.value ? (Array.isArray(mod.entries.value) ? mod.entries.value : [mod.entries.value]) : resolvedEntries);
      }
    } else if (Array.isArray(item.entries) && item.entries.length > 0) {
      resolvedEntries = [...item.entries, ...resolvedEntries];
    }

    // Merge images
    let resolvedImages = Array.isArray(item.images) && item.images.length > 0 ? [...item.images] : (Array.isArray(target.images) ? [...target.images] : []);

    return {
      name: item.name,
      source: item.source || target.source,
      entries: resolvedEntries,
      images: resolvedImages
    };
  }

  // Pre-resolve all items
  const resolvedFluffMap = new Map();
  for (const [key, item] of rawFluffMap.entries()) {
    const resolved = resolveFluff(item);
    if (resolved && ((resolved.entries && resolved.entries.length > 0) || (resolved.images && resolved.images.length > 0))) {
      resolvedFluffMap.set(key, resolved);
    }
  }
  console.log(`Resolved fluff entries with content: ${resolvedFluffMap.size}`);

  // Build sorted list of MM base species for fallback matching
  const MM_NPC_PROFESSIONS = new Set([
    'acolyte', 'archmage', 'assassin', 'bandit', 'bandit captain', 'berserker',
    'commoner', 'cultist', 'cult fanatic', 'druid', 'gladiator', 'guard',
    'knight', 'mage', 'noble', 'priest', 'scout', 'spy', 'thug', 'veteran', 'warrior'
  ]);

  const mmBaseSpecies = [];
  const mmNpcProfessions = [];

  for (const [nameKey, raw] of mmFluffMap.entries()) {
    const resolved = resolveFluff(raw);
    if (resolved && resolved.entries && resolved.entries.length > 0) {
      const entry = {
        name: raw.name,
        nameKey: nameKey,
        fluff: resolved
      };
      if (MM_NPC_PROFESSIONS.has(nameKey)) {
        mmNpcProfessions.push(entry);
      } else {
        mmBaseSpecies.push(entry);
      }
    }
  }

  // Sort monster species by length descending (e.g. "Mind Flayer" before "Flayer")
  mmBaseSpecies.sort((a, b) => b.name.length - a.name.length);
  mmNpcProfessions.sort((a, b) => b.name.length - a.name.length);

  // Full priority list: True monster species first, then generic NPC titles
  const allMmCandidates = [...mmBaseSpecies, ...mmNpcProfessions];
  console.log(`Available MM species: ${mmBaseSpecies.length}, NPC professions: ${mmNpcProfessions.length}`);

  // 5. Match against bestiary creatures
  console.log('\n--- 5. Matching Fluff against bestiary.json creatures ---');
  const finalFluffOutput = {};
  let exactMatches = 0;
  let bookFallbackMatches = 0;
  let mmFallbackMatches = 0;
  let noFluffCount = 0;

  for (const creature of bestiary) {
    const creatureName = (creature.name || '').trim();
    const creatureSource = (creature.source || '').trim();
    const creatureSourceGroup = (creature.sourceGroup || '').trim();
    const creatureId = creature.id;

    const directKey = `${creatureName.toLowerCase()}__${creatureSource.toLowerCase()}`;
    let directFluff = resolvedFluffMap.get(directKey);
    let matchedFluff = null;
    let isFallback = false;
    let fallbackSource = null;
    let fallbackCreature = null;

    // Check if direct fluff has actual narrative text entries
    if (directFluff && directFluff.entries && directFluff.entries.length > 0) {
      matchedFluff = directFluff;
      exactMatches++;
    } else {
      // Step A: Search for exact name in same sourceGroup / publisher that has text entries
      const byNameList = rawFluffByName.get(creatureName.toLowerCase()) || [];
      const sameSource = byNameList.find(f => f.source && f.source.toLowerCase() === creatureSource.toLowerCase() && f.entries && f.entries.length > 0);
      if (sameSource) {
        matchedFluff = resolveFluff(sameSource);
        exactMatches++;
      } else {
        // Step A2: Check other official books for same exact creature name with text entries
        const withEntries = byNameList.find(f => f.entries && f.entries.length > 0);
        if (withEntries) {
          matchedFluff = resolveFluff(withEntries);
          isFallback = true;
          fallbackSource = matchedFluff.source || 'WotC';
          fallbackCreature = matchedFluff.name;
          bookFallbackMatches++;
        } else {
          // Step B: Smart Fallback (Cascada Inteligente)
          const cleanNameLower = creatureName.toLowerCase().replace(/["']/g, '');
          let matchedBase = null;

          // B1. Priority 1: Check creature typeTags for base species (e.g. humanoid with tag "kobold", "goblin", "orc")
          if (creature.typeTags && Array.isArray(creature.typeTags)) {
            for (const tag of creature.typeTags) {
              const found = mmBaseSpecies.find(b => b.nameKey === tag.toLowerCase());
              if (found) {
                matchedBase = found;
                break;
              }
            }
          }

          // B2. Priority 2: Check creatureName for true monstrous species (e.g. "Dragon Kobold Warrior", "Goblin Hexer")
          if (!matchedBase) {
            for (const base of mmBaseSpecies) {
              const pattern = new RegExp(`\\b${base.nameKey}\\b|\\b${base.nameKey}s\\b`, 'i');
              if (pattern.test(cleanNameLower)) {
                matchedBase = base;
                break;
              }
            }
          }

          // B3. Priority 3: Check creature rules text (traits and actions) for base species noun
          // e.g. "The Demogorgon" (IMR) whose traits say "The ettin has advantage..."
          if (!matchedBase) {
            const rulesText = [
              ...(creature.trait || []).map(t => (t.entries || []).join(' ')),
              ...(creature.action || []).map(a => (a.entries || []).join(' '))
            ].join(' ');

            if (rulesText) {
              for (const base of mmBaseSpecies) {
                const pattern = new RegExp(`\\bthe ${base.nameKey} (has|is|can|makes|takes|regains|deals|turns|\'s)\\b`, 'i');
                if (pattern.test(rulesText)) {
                  matchedBase = base;
                  break;
                }
              }
            }
          }

          // B4. Priority 4: Check generic NPC professions only if no species was found
          if (!matchedBase) {
            for (const npc of mmNpcProfessions) {
              const pattern = new RegExp(`\\b${npc.nameKey}\\b`, 'i');
              if (pattern.test(cleanNameLower)) {
                matchedBase = npc;
                break;
              }
            }
          }

          if (matchedBase) {
            matchedFluff = matchedBase.fluff;
            isFallback = true;
            fallbackSource = 'Monster Manual (MM)';
            fallbackCreature = matchedBase.name;
            mmFallbackMatches++;
          }
        }
      }
    }

    if (matchedFluff) {
      const cleanEntryList = cleanEntries(matchedFluff.entries);
      const cleanImgList = extractImagesFromFluff(directFluff || matchedFluff);

      // Also preserve any specific artUrl from creature itself if available
      if (creature.artUrl && !cleanImgList.includes(creature.artUrl)) {
        cleanImgList.unshift(creature.artUrl);
      }

      if (cleanEntryList.length > 0) {
        const fluffPayload = {
          id: creatureId,
          name: creatureName,
          source: creatureSource,
          sourceGroup: creatureSourceGroup,
          entries: cleanEntryList,
          images: cleanImgList,
          isFallback: isFallback,
          fallbackSource: fallbackSource,
          fallbackCreature: fallbackCreature
        };

        finalFluffOutput[creatureId] = fluffPayload;
        // Also index by directKey for quick lookup
        finalFluffOutput[directKey] = fluffPayload;
        continue;
      }
    }

    // No lore available (e.g. Monster Hunter, Daedric Imports, custom crossovers)
    noFluffCount++;
  }

  console.log(`\nResults summary:`);
  console.log(`  ✓ Exact Lore Matches: ${exactMatches}`);
  console.log(`  ✓ Book Fallback Matches: ${bookFallbackMatches}`);
  console.log(`  ✓ Monster Manual (MM) Placeholder Fallbacks: ${mmFallbackMatches}`);
  console.log(`  - No Lore Available (omitted as requested): ${noFluffCount}`);

  // Write output
  console.log(`\nWriting optimized monster_fluff.json...`);
  fs.writeFileSync(OUTPUT_FLUFF_PATH, JSON.stringify(finalFluffOutput));
  const stats = fs.statSync(OUTPUT_FLUFF_PATH);
  console.log(`✅ Finished! Output size: ${(stats.size / 1024 / 1024).toFixed(2)} MB at ${OUTPUT_FLUFF_PATH}`);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
