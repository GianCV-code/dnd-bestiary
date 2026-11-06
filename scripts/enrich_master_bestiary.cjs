const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(__dirname, '../public/data');
const BESTIARY_PATH = path.join(DATA_DIR, 'bestiary.json');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchJson(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch ${url} (Status: ${res.statusCode})`));
      }
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(rawData));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function clean5eTags(text) {
  if (!text || typeof text !== 'string') return '';
  let str = text;

  str = str.replace(/dSalvaci[oó]n\s*\(([^)]+)\):/gi, 'Salvación ($1):');

  let prev = '';
  let iterations = 0;
  while (str !== prev && iterations < 6) {
    prev = str;
    iterations++;

    str = str
      .replace(/\{@actTrigger\}/gi, 'Disparador: ')
      .replace(/\{@actResponse(?:\s+[^}]+)?\}/gi, 'Respuesta: ')
      
      .replace(/\{@actSave\s+(str|fue)[^}]*\}/gi, 'Salvación de Fuerza (Strength): ')
      .replace(/\{@actSave\s+(dex|des)[^}]*\}/gi, 'Salvación de Destreza (Dexterity): ')
      .replace(/\{@actSave\s+(con)[^}]*\}/gi, 'Salvación de Constitución (Constitution): ')
      .replace(/\{@actSave\s+(int)[^}]*\}/gi, 'Salvación de Inteligencia (Intelligence): ')
      .replace(/\{@actSave\s+(wis|sab)[^}]*\}/gi, 'Salvación de Sabiduría (Wisdom): ')
      .replace(/\{@actSave\s+(cha|car)[^}]*\}/gi, 'Salvación de Carisma (Charisma): ')
      .replace(/\{@actSave\s+([^}]+)\}/gi, 'Salvación ($1): ')
      
      .replace(/\{@actSaveFail\s*1\}/gi, 'Primer Fallo: ')
      .replace(/\{@actSaveFail\s*2\}/gi, 'Segundo Fallo: ')
      .replace(/\{@actSaveFail(?:\s+[^}]+)?\}/gi, 'Fallo: ')
      .replace(/\{@actSaveFailBy\s+([^}]+)\}/gi, 'Fallo por $1 o más: ')
      .replace(/\{@actSaveSuccess\}/gi, 'Éxito: ')
      .replace(/\{@actSaveSuccessOrFail\}/gi, 'Fallo o Éxito: ')

      .replace(/\{@atk\s+mw\}/gi, 'Ataque con arma cuerpo a cuerpo:')
      .replace(/\{@atk\s+rw\}/gi, 'Ataque con arma a distancia:')
      .replace(/\{@atk\s+ms\}/gi, 'Ataque de conjuro cuerpo a cuerpo:')
      .replace(/\{@atk\s+rs\}/gi, 'Ataque de conjuro a distancia:')
      .replace(/\{@atkr\s+m\}|\{@atk\s+m\}/gi, 'Ataque cuerpo a cuerpo:')
      .replace(/\{@atkr\s+r\}|\{@atk\s+r\}/gi, 'Ataque a distancia:')
      .replace(/\{@atk\s+([^}]+)\}/gi, 'Ataque ($1):')

      .replace(/\{@hit\s+([+-]?\d+)\}/gi, (_, n) => (n.startsWith('+') || n.startsWith('-')) ? n : `+${n}`)
      .replace(/\{@hitYourSpellAttack(?:\s+[^}]+)?\}/gi, 'tu modificador de ataque de conjuro')
      .replace(/\{@dcYourSpellSave\}/gi, 'tu CD de salvación de conjuros')
      .replace(/\{@h\}/gi, 'Impacto: ')
      .replace(/\{@m\}/gi, 'Fallo: ')
      .replace(/\{@hom\}/gi, 'Impacto o Fallo: ')

      .replace(/\{@recharge\s*([^}]+)?\}/gi, (_, n) => {
        const val = n ? n.trim() : '6';
        if (val === '5') return '(Recarga 5-6)';
        if (val === '4') return '(Recarga 4-6)';
        if (val === '3') return '(Recarga 3-6)';
        if (val === '2') return '(Recarga 2-6)';
        if (val === '6') return '(Recarga 6)';
        return `(Recarga ${val})`;
      })
      .replace(/\{@dice\s+([^}]+)\}/gi, '$1')
      .replace(/\{@damage\s+([^}]+)\}/gi, '$1')
      .replace(/\{@d20\s*([+-]?\d+)?\}/gi, (_, mod) => mod ? `d20${mod}` : 'd20')
      .replace(/\{@dc\s+([^}]+)\}/gi, 'CD $1')

      .replace(/\{@spell\s+([^}|]+)(?:\|[^}|]+)?(?:\|([^}]+))?\}/gi, (_, name, disp) => disp || name)
      .replace(/\{@item\s+([^}|]+)(?:\|[^}|]+)?(?:\|([^}]+))?\}/gi, (_, name, disp) => disp || name)
      .replace(/\{@creature\s+([^}|]+)(?:\|[^}|]+)?(?:\|([^}]+))?\}/gi, (_, name, disp) => disp || name)
      .replace(/\{@condition\s+([^}|]+)(?:\|[^}|]+)?(?:\|([^}]+))?\}/gi, (_, name, disp) => disp || name)
      .replace(/\{@status\s+([^}|]+)(?:\|[^}|]+)?(?:\|([^}]+))?\}/gi, (_, name, disp) => disp || name)
      .replace(/\{@skill\s+([^}|]+)(?:\|[^}|]+)?(?:\|([^}]+))?\}/gi, (_, name, disp) => disp || name)
      .replace(/\{@sense\s+([^}|]+)(?:\|[^}|]+)?(?:\|([^}]+))?\}/gi, (_, name, disp) => disp || name)
      .replace(/\{@action\s+([^}|]+)(?:\|[^}|]+)?(?:\|([^}]+))?\}/gi, (_, name, disp) => disp || name)
      .replace(/\{@classFeature\s+([^}|]+)(?:\|[^}|]+)?(?:\|([^}]+))?\}/gi, (_, name, disp) => disp || name)
      .replace(/\{@itemProperty\s+([^}|]+)\|[^}|]*\|([^}]+)\}/gi, '$2')
      .replace(/\{@quickref\s+[^}|]+\|[^}|]+\|[^}|]+\|[^}|]+\|([^}]+)\}/gi, '$1')
      .replace(/\{@skillCheck\s+([a-zA-Z]+)\s+([+-]?\d+)\}/gi, '$1 +$2')
      .replace(/\{@savingThrow\s+([a-zA-Z]+)\s+([+-]?\d+)\}/gi, '$1 +$2')

      .replace(/\{@b\s+([^}]+)\}/gi, '$1')
      .replace(/\{@i\s+([^}]+)\}/gi, '$1')
      .replace(/\{@sup\s+([^}]+)\}/gi, ' $1 ')
      .replace(/\{@note\s+([^}]+)\}/gi, ' ($1) ')
      .replace(/\{@cite\s+([^}|]+)(?:\|[^}]+)?\}/gi, '$1')
      .replace(/\{@footnote\s+([^}|]+)(?:\|[^}]+)?\}/gi, ' ($1) ')
      .replace(/\{@color\s+([^}|]+)(?:\|[^}]+)?\}/gi, '$1')
      .replace(/\{@highlight\s+([^}|]+)(?:\|[^}]+)?\}/gi, '$1')
      .replace(/\{@homebrew\s+[^}|]*\|([^}]+)\}/gi, '$1')
      .replace(/\{@variantrule\s+([^}|]+)(?:\|[^}]+)?\}/gi, '$1')
      .replace(/\{@filter\s+([^}|]+)(?:\|[^}]+)?\}/gi, '$1')

      .replace(/\{@[a-zA-Z]+\s*([^}|]+)?(?:\|[^}|]*)*(?:\|([^}]+))?\}/gi, (_, p1, p2) => p2 || p1 || '');
  }

  return str.replace(/\s{2,}/g, ' ').trim();
}

function cleanEntries(entries) {
  if (!entries) return [];
  if (typeof entries === 'string') return [clean5eTags(entries)];
  if (!Array.isArray(entries)) return [];
  
  const result = [];
  for (const item of entries) {
    if (typeof item === 'string') {
      const cleaned = clean5eTags(item);
      if (cleaned) result.push(cleaned);
    } else if (item && typeof item === 'object') {
      if (item.entries) {
        result.push({
          name: clean5eTags(item.name || ''),
          entries: cleanEntries(item.entries)
        });
      } else if (item.entry) {
        result.push({
          name: clean5eTags(item.name || ''),
          entries: [clean5eTags(item.entry)]
        });
      } else if (item.items) {
        cleanEntries(item.items).forEach(sub => result.push(sub));
      }
    }
  }
  return result;
}

function cleanObjectDeep(obj) {
  if (!obj) return obj;
  if (typeof obj === 'string') return clean5eTags(obj);
  if (Array.isArray(obj)) return obj.map(cleanObjectDeep);
  if (typeof obj === 'object') {
    const res = {};
    for (const [k, v] of Object.entries(obj)) {
      res[k] = cleanObjectDeep(v);
    }
    return res;
  }
  return obj;
}

async function run() {
  console.log('Loading current bestiary.json...');
  const bestiary = JSON.parse(fs.readFileSync(BESTIARY_PATH, 'utf8'));
  console.log(`Loaded ${bestiary.length} existing creatures.`);

  // Load index from 5eTools repo to know all available files
  console.log('Fetching 5eTools bestiary index...');
  const indexUrl = 'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/master/data/bestiary/index.json';
  const index = await fetchJson(indexUrl);
  
  const officialFiles = Object.values(index).map(f => `https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/master/data/bestiary/${f}`);
  console.log(`Found ${officialFiles.length} official bestiary files in index.`);

  // Fetch templates
  console.log('Fetching monster templates...');
  let templates = [];
  try {
    const templateData = await fetchJson('https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/master/data/bestiary/template.json');
    templates = templateData.monsterTemplate || [];
    console.log(`Loaded ${templates.length} monster templates.`);
  } catch (e) {
    console.log('Templates load error (skipping):', e.message);
  }

  // Fetch all official files in parallel batches
  console.log('Fetching all official files in batches...');
  const rawMonsterMap = new Map(); // key: "name|source"
  const copyMonsters = []; // list of monsters with _copy

  const BATCH_SIZE = 15;
  for (let i = 0; i < officialFiles.length; i += BATCH_SIZE) {
    const batch = officialFiles.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (url) => {
      try {
        const data = await fetchJson(url);
        const monsters = data.monster || [];
        monsters.forEach(m => {
          const key = `${m.name.toLowerCase()}|${(m.source || '').toLowerCase()}`;
          rawMonsterMap.set(key, m);
          if (m._copy) {
            copyMonsters.push(m);
          }
        });
      } catch (err) {
        // Silently skip missing files
      }
    }));
  }

  console.log(`Indexed ${rawMonsterMap.size} raw monsters. Found ${copyMonsters.length} monsters with _copy.`);

  // Helper to find raw monster by name and optional source
  function findRawMonster(name, source) {
    if (!name) return null;
    const nameLow = name.toLowerCase();
    if (source) {
      const match = rawMonsterMap.get(`${nameLow}|${source.toLowerCase()}`);
      if (match) return match;
    }
    for (const [k, v] of rawMonsterMap.entries()) {
      if (k.startsWith(`${nameLow}|`)) return v;
    }
    return null;
  }

  // Resolve _copy recursively
  function resolveRawCopy(monster, depth = 0) {
    if (!monster._copy || depth > 5) return monster;
    const copyTarget = findRawMonster(monster._copy.name, monster._copy.source);
    if (!copyTarget) return monster;

    // Resolve parent if it also has _copy
    const resolvedParent = resolveRawCopy(copyTarget, depth + 1);

    // Merge base properties
    const result = JSON.parse(JSON.stringify(resolvedParent));

    // Apply template if specified
    if (monster._copy._templates && Array.isArray(monster._copy._templates)) {
      monster._copy._templates.forEach(tRef => {
        const tpl = templates.find(t => t.name.toLowerCase() === tRef.name?.toLowerCase());
        if (tpl && tpl.apply) {
          if (tpl.apply._root) {
            Object.assign(result, JSON.parse(JSON.stringify(tpl.apply._root)));
          }
          if (tpl.apply._mod) {
            applyMod(result, tpl.apply._mod);
          }
        }
      });
    }

    // Apply child's own properties
    Object.keys(monster).forEach(k => {
      if (k !== '_copy') {
        result[k] = JSON.parse(JSON.stringify(monster[k]));
      }
    });

    // Apply child's _mod
    if (monster._copy._mod) {
      applyMod(result, monster._copy._mod);
    }

    return result;
  }

  function applyMod(target, modObj) {
    Object.entries(modObj).forEach(([prop, modVal]) => {
      const mods = Array.isArray(modVal) ? modVal : [modVal];
      mods.forEach(mod => {
        if (!mod || typeof mod !== 'object') return;
        const mode = mod.mode;
        const items = Array.isArray(mod.items) ? mod.items : (mod.items ? [mod.items] : []);

        if (mode === 'appendArr' || mode === 'appendIfNotExistsArr') {
          if (!target[prop]) target[prop] = [];
          if (Array.isArray(target[prop])) {
            target[prop] = target[prop].concat(JSON.parse(JSON.stringify(items)));
          }
        } else if (mode === 'prependArr') {
          if (!target[prop]) target[prop] = [];
          if (Array.isArray(target[prop])) {
            target[prop] = JSON.parse(JSON.stringify(items)).concat(target[prop]);
          }
        } else if (mode === 'removeArr') {
          if (Array.isArray(target[prop])) {
            const namesToRemove = Array.isArray(mod.names) ? mod.names : (mod.names ? [mod.names] : []);
            target[prop] = target[prop].filter(it => {
              const name = typeof it === 'string' ? it : it.name;
              return !namesToRemove.includes(name);
            });
          }
        } else if (mode === 'replaceTxt' && mod.replace && mod.with) {
          const re = new RegExp(mod.replace, 'gi');
          if (Array.isArray(target[prop])) {
            target[prop].forEach(item => {
              if (item.entries && Array.isArray(item.entries)) {
                item.entries = item.entries.map(e => typeof e === 'string' ? e.replace(re, mod.with) : e);
              }
            });
          }
        }
      });
    });
  }

  // Pre-resolve all copy monsters in a map
  console.log('Resolving copy monsters...');
  const resolvedCopyMap = new Map();
  copyMonsters.forEach(m => {
    try {
      const resolved = resolveRawCopy(m);
      resolvedCopyMap.set(`${m.name.toLowerCase()}|${(m.source || '').toLowerCase()}`, resolved);
    } catch (err) {
      // Ignore copy error
    }
  });
  console.log(`Resolved ${resolvedCopyMap.size} copy monsters.`);

  // Now enrich the existing bestiary!
  console.log('Enriching and cleaning bestiary creatures...');
  let resolvedCopiesCount = 0;
  let bonusAddedCount = 0;
  let reactionsRefreshedCount = 0;

  const enrichedBestiary = bestiary.map(creature => {
    const key = `${creature.name.toLowerCase()}|${(creature.source || '').toLowerCase()}`;
    const copyData = resolvedCopyMap.get(key);
    const rawData = rawMonsterMap.get(key) || copyData;

    let c = { ...creature };

    // If creature had missing actions or traits and we have resolved copy data
    if (copyData) {
      resolvedCopiesCount++;
      if ((!c.action || c.action.length === 0) && copyData.action) {
        c.action = (copyData.action || []).map(a => ({
          name: clean5eTags(a.name || ''),
          entries: cleanEntries(a.entries)
        }));
      }
      if ((!c.trait || c.trait.length === 0) && copyData.trait) {
        c.trait = (copyData.trait || []).map(t => ({
          name: clean5eTags(t.name || ''),
          entries: cleanEntries(t.entries)
        }));
      }
      if ((!c.bonus || c.bonus.length === 0) && copyData.bonus) {
        c.bonus = (copyData.bonus || []).map(b => ({
          name: clean5eTags(b.name || ''),
          entries: cleanEntries(b.entries)
        }));
      }
      if ((!c.reaction || c.reaction.length === 0) && copyData.reaction) {
        c.reaction = (copyData.reaction || []).map(r => ({
          name: clean5eTags(r.name || ''),
          entries: cleanEntries(r.entries)
        }));
      }
      if ((!c.legendary || c.legendary.length === 0) && copyData.legendary) {
        c.legendary = (copyData.legendary || []).map(l => ({
          name: clean5eTags(l.name || ''),
          entries: cleanEntries(l.entries)
        }));
      }
      if ((!c.mythic || c.mythic.length === 0) && copyData.mythic) {
        c.mythic = (copyData.mythic || []).map(m => ({
          name: clean5eTags(m.name || ''),
          entries: cleanEntries(m.entries)
        }));
      }
      if ((!c.spellcasting || c.spellcasting.length === 0) && copyData.spellcasting) {
        c.spellcasting = cleanObjectDeep(copyData.spellcasting);
      }
    } else if (rawData) {
      // Even if not a copy monster, refresh bonus and reactions from raw to be 100% complete
      if (rawData.bonus && (!c.bonus || c.bonus.length === 0)) {
        c.bonus = (rawData.bonus || []).map(b => ({
          name: clean5eTags(b.name || ''),
          entries: cleanEntries(b.entries)
        }));
        bonusAddedCount++;
      }
      if (rawData.reaction) {
        c.reaction = (rawData.reaction || []).map(r => ({
          name: clean5eTags(r.name || ''),
          entries: cleanEntries(r.entries)
        }));
        reactionsRefreshedCount++;
      }
    }

    // Comprehensive clean on all fields
    c.name = clean5eTags(c.name || '');
    if (c.trait) {
      c.trait = c.trait.map(t => ({
        name: clean5eTags(t.name || ''),
        entries: cleanEntries(t.entries)
      }));
    }
    if (c.action) {
      c.action = c.action.map(a => ({
        name: clean5eTags(a.name || ''),
        entries: cleanEntries(a.entries)
      }));
    }
    if (c.bonus) {
      c.bonus = c.bonus.map(b => ({
        name: clean5eTags(b.name || ''),
        entries: cleanEntries(b.entries)
      }));
    }
    if (c.reaction) {
      c.reaction = c.reaction.map(r => ({
        name: clean5eTags(r.name || ''),
        entries: cleanEntries(r.entries)
      }));
    }
    if (c.legendary) {
      c.legendary = c.legendary.map(l => ({
        name: clean5eTags(l.name || ''),
        entries: cleanEntries(l.entries)
      }));
    }
    if (c.legendaryHeader) {
      c.legendaryHeader = cleanEntries(c.legendaryHeader);
    }
    if (c.mythic) {
      c.mythic = c.mythic.map(m => ({
        name: clean5eTags(m.name || ''),
        entries: cleanEntries(m.entries)
      }));
    }
    if (c.mythicHeader) {
      c.mythicHeader = cleanEntries(c.mythicHeader);
    }
    if (c.spellcasting) {
      c.spellcasting = cleanObjectDeep(c.spellcasting);
    }

    return c;
  });

  // Write enriched bestiary back to disk
  console.log(`Writing enriched bestiary to ${BESTIARY_PATH}...`);
  fs.writeFileSync(BESTIARY_PATH, JSON.stringify(enrichedBestiary, null, 2), 'utf8');
  console.log('Successfully saved bestiary.json!');

  // Verification statistics
  console.log('\n--- VERIFICATION AUDIT ---');
  let countActions = 0, countBonus = 0, countReactions = 0, countSpellcasting = 0, countLegendary = 0;
  enrichedBestiary.forEach(c => {
    if (c.action && c.action.length > 0) countActions++;
    if (c.bonus && c.bonus.length > 0) countBonus++;
    if (c.reaction && c.reaction.length > 0) countReactions++;
    if (c.spellcasting && c.spellcasting.length > 0) countSpellcasting++;
    if (c.legendary && c.legendary.length > 0) countLegendary++;
  });

  console.log(`Creatures with Actions: ${countActions} / ${enrichedBestiary.length}`);
  console.log(`Creatures with Bonus Actions: ${countBonus} / ${enrichedBestiary.length}`);
  console.log(`Creatures with Reactions: ${countReactions} / ${enrichedBestiary.length}`);
  console.log(`Creatures with Spellcasting: ${countSpellcasting} / ${enrichedBestiary.length}`);
  console.log(`Creatures with Legendary Actions: ${countLegendary} / ${enrichedBestiary.length}`);

  const rawOut = fs.readFileSync(BESTIARY_PATH, 'utf8');
  const dSal = (rawOut.match(/dSalvaci[oó]n/g) || []).length;
  const strayTags = (rawOut.match(/\{@[a-zA-Z]+/g) || []).length;
  console.log(`Remaining dSalvación occurrences: ${dSal}`);
  console.log(`Remaining uncleaned 5e tags: ${strayTags}`);
}

run().catch(err => {
  console.error('Fatal error during enrichment:', err);
  process.exit(1);
});

