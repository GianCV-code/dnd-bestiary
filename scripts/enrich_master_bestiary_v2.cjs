const fs = require('fs');
const path = require('path');
const https = require('https');
const { fetchJson, clean5eTags, cleanEntries, cleanObjectDeep } = require('./cleaners.cjs');

const DATA_DIR = path.join(__dirname, '../public/data');
const BESTIARY_PATH = path.join(DATA_DIR, 'bestiary.json');

const OFFICIAL_BOOK_NAMES = {
  'MM': 'Monster Manual (2014)',
  'MPMM': 'Monsters of the Multiverse',
  'VGM': "Volo's Guide to Monsters",
  'MTF': "Mordenkainen's Tome of Foes",
  'FTD': "Fizban's Treasury of Dragons",
  'BGG': 'Bigby Presents: Glory of the Giants',
  'BMT': 'The Book of Many Things',
  'PHB': "Player's Handbook",
  'DMG': "Dungeon Master's Guide",
  'TCE': "Tasha's Cauldron of Everything",
  'XGE': "Xanathar's Guide to Everything",
  'CoS': 'Curse of Strahd',
  'ToA': 'Tomb of Annihilation',
  'BGDIA': 'Baldur\'s Gate: Descent Into Avernus',
  'IDRotF': 'Icewind Dale: Rime of the Frostmaiden',
  'WDH': 'Waterdeep: Dragon Heist',
  'WDMM': 'Waterdeep: Dungeon of the Mad Mage',
  'SKT': "Storm King's Thunder",
  'OotA': 'Out of the Abyss',
  'PotA': 'Princes of the Apocalypse',
  'HotDQ': 'Hoard of the Dragon Queen',
  'RoT': 'The Rise of Tiamat',
  'GoS': 'Ghosts of Saltmarsh',
  'TftYP': 'Tales from the Yawning Portal',
  'WBtW': 'The Wild Beyond the Witchlight',
  'CM': 'Candlekeep Mysteries',
  'JttRC': 'Journeys through the Radiant Citadel',
  'KftGV': 'Keys from the Golden Vault',
  'ToFW': 'Turn of Fortune\'s Wheel',
  'VEoR': 'Vecna: Eve of Ruin',
  'PaBTSO': 'Phandelver and Below: The Shattered Obelisk',
  'QftIS': 'Quests from the Infinite Staircase',
  'DoSI': 'Dragons of Stormwreck Isle',
  'LMoP': 'Lost Mine of Phandelver',
  'DIP': 'Dragon of Icespire Peak',
  'EGW': "Explorer's Guide to Wildemount",
  'ERLW': 'Eberron: Rising from the Last War',
  'GGR': "Guildmasters' Guide to Ravnica",
  'MOT': 'Mythic Odysseys of Theros',
  'VRGR': "Van Richten's Guide to Ravenloft",
  'SCC': 'Strixhaven: A Curriculum of Chaos',
  'BAM': 'Boo\'s Astral Menagerie (Spelljammer)',
  'DSotDQ': 'Dragonlance: Shadow of the Dragon Queen',
  'AI': 'Acquisitions Incorporated',
  'MCV1SC': 'Monstrous Compendium 1: Spelljammer',
  'MCV2DC': 'Monstrous Compendium 2: Dragonlance',
  'MCV3MC': 'Monstrous Compendium 3: Minecraft',
  'MCV4EC': 'Monstrous Compendium 4: Eldraine',
  'PSA': 'Plane Shift: Amonkhet',
  'PSD': 'Plane Shift: Dominaria',
  'PSI': 'Plane Shift: Innistrad',
  'PSK': 'Plane Shift: Kaladesh',
  'PSX': 'Plane Shift: Ixalan',
  'PSZ': 'Plane Shift: Zendikar'
};

const THIRD_PARTY_SOURCES = [
  { publisher: 'Kobold Press', sourceGroup: 'Tome of Beasts 1 (2023 Edition)', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Kobold%20Press%3B%20Tome%20of%20Beasts%201%20(2023%20Edition).json' },
  { publisher: 'Kobold Press', sourceGroup: 'Tome of Beasts 2', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Kobold%20Press%3B%20Tome%20of%20Beasts%202.json' },
  { publisher: 'Kobold Press', sourceGroup: 'Tome of Beasts 3', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Kobold%20Press%3B%20Tome%20of%20Beasts%203.json' },
  { publisher: 'Kobold Press', sourceGroup: 'Creature Codex', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Kobold%20Press%3B%20Creature%20Codex.json' },
  { publisher: 'MCDM Productions', sourceGroup: 'Flee, Mortals!', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/MCDM%20Productions%3B%20Flee%2C%20Mortals%21.json' },
  { publisher: 'MCDM Productions', sourceGroup: 'Where Evil Lives', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/MCDM%20Productions%3B%20Where%20Evil%20Lives.json' },
  { publisher: 'Loot Tavern', sourceGroup: "Heliana's Guide To Monster Hunting", url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Loot%20Tavern%3B%20Heliana%27s%20Guide%20To%20Monster%20Hunting.json' },
  { publisher: 'Loot Tavern', sourceGroup: "Ryoko's Guide to the Yokai Realms", url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Loot%20Tavern%3B%20Ryoko%27s%20Guide%20to%20the%20Yokai%20Realms.json' },
  { publisher: 'Loot Tavern', sourceGroup: 'Wrath of the Kaiju', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Loot%20Tavern%3B%20Wrath%20of%20the%20Kaiju.json' },
  { publisher: 'Loot Tavern', sourceGroup: "L'Arsene's Ledger of Treasures and Trinkets", url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Loot%20Tavern%3B%20L%27Arsene%27s%20Ledger%20of%20Treasures%20and%20Trinkets.json' },
  { publisher: 'Ghostfire Gaming', sourceGroup: 'Grim Hollow - The Monster Grimoire', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Ghostfire%20Gaming%3B%20Grim%20Hollow%20-%20The%20Monster%20Grimoire.json' },
  { publisher: 'Ghostfire Gaming', sourceGroup: 'Monsters of Drakkenheim', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Ghostfire%20Gaming%3B%20Monsters%20of%20Drakkenheim.json' },
  { publisher: 'Ghostfire Gaming', sourceGroup: 'Dungeons of Drakkenheim', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Ghostfire%20Gaming%3B%20Dungeons%20of%20Drakkenheim.json' },
  { publisher: 'Ghostfire Gaming', sourceGroup: 'Grim Hollow - Lairs of Etharis', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Ghostfire%20Gaming%3B%20Grim%20Hollow%20-%20Lairs%20of%20Etharis.json' },
  { publisher: 'Dragonix', sourceGroup: 'Monster Manual Expanded (2024)', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Dragonix%3B%20Monster%20Manual%20Expanded%20-%202024.json' },
  { publisher: 'Dragonix', sourceGroup: 'Monster Manual Expanded I', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Dragonix%3B%20Monster%20Manual%20Expanded%20(v1).json' },
  { publisher: 'Dragonix', sourceGroup: 'Monster Manual Expanded II', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Dragonix%3B%20Monster%20Manual%20Expanded%20II%20(v2).json' },
  { publisher: 'Dragonix', sourceGroup: 'Monster Manual Expanded III', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Dragonix%3B%20Monster%20Manual%20Expanded%20III.json' },
  { publisher: 'Nord Games', sourceGroup: 'Ultimate Bestiary: Revenge of the Horde', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Nord%20Games%3B%20Game%20Master%27s%20Toolbox%20Ultimate%20Bestiary%20Revenge%20of%20the%20Horde.json' },
  { publisher: 'Nord Games', sourceGroup: 'Ultimate Bestiary: The Dreaded Accursed', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Nord%20Games%3B%20Ultimate%20Bestiary%20The%20Dreaded%20Accursed.json' },
  { publisher: 'Paizo', sourceGroup: 'Pathfinder Kingmaker Bestiary (5e)', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Paizo%3B%20Pathfinder%20-%20Kingmaker%20Bestiary%20(5e).json' },
  { publisher: 'Frog God Games', sourceGroup: 'Fifth Edition Foes', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Frog%20God%20Games%3B%20Fifth%20Edition%20Foes.json' }
];

const CROSSOVER_SOURCES = [
  { publisher: 'Amellwind', sourceGroup: "Amellwind's Guide to Monster Hunting", url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Amellwind%3B%20Amellwind%27s%20Guide%20to%20Monster%20Hunting.json' },
  { publisher: 'Amellwind', sourceGroup: "Monster Hunter Monster Manual", url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Amellwind%3B%20Monster%20Hunter%20Monster%20Manual.json' },
  { publisher: 'Dark Souls 5e', sourceGroup: 'Dark Souls 5e Bestiary', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Dark%20Souls%205e%3B%20Dark%20Souls%205e%20Bestiary.json' },
  { publisher: 'Warcraft 5e', sourceGroup: 'Warcraft 5e Bestiary', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Warcraft%205e%3B%20Warcraft%205e%20Bestiary.json' },
  { publisher: 'The Witcher 5e', sourceGroup: 'A Dragon\'s Guide to the Witcher', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/The%20Witcher%205e%3B%20A%20Dragon%27s%20Guide%20to%20the%20Witcher.json' },
  { publisher: 'Elder Scrolls', sourceGroup: 'The Elder Scrolls: Call to Arms', url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/The%20Elder%20Scrolls%3B%20The%20Elder%20Scrolls%205e.json' }
];

async function run() {
  console.log('--- ETAPA 1: Remediación Integral de Datos y Preservación Estructural ---');
  console.log('Cargando bestiary.json actual...');
  const bestiary = JSON.parse(fs.readFileSync(BESTIARY_PATH, 'utf8'));
  console.log(`Cargadas ${bestiary.length} criaturas.`);

  // 1. Cargar índice oficial de 5eTools
  console.log('\nDescargando índice oficial 5eTools...');
  const indexUrl = 'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/master/data/bestiary/index.json';
  const index = await fetchJson(indexUrl);
  const officialFiles = Object.values(index).map(f => `https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/master/data/bestiary/${f}`);
  console.log(`Encontrados ${officialFiles.length} archivos oficiales en el índice.`);

  // 2. Cargar templates oficiales
  console.log('Descargando templates de monstruos...');
  let templates = [];
  try {
    const templateData = await fetchJson('https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/master/data/bestiary/template.json');
    templates = templateData.monsterTemplate || [];
    console.log(`Cargados ${templates.length} templates.`);
  } catch (e) {
    console.log('Templates skip:', e.message);
  }

  // 3. Descargar todas las fuentes oficiales y 3PP para indexar raw monsters
  console.log('\nDescargando fuentes y construyendo mapa maestro de raw monsters...');
  const rawMonsterMap = new Map(); // key: "name|source"
  const copyMonsters = [];

  const BATCH_SIZE = 15;
  for (let i = 0; i < officialFiles.length; i += BATCH_SIZE) {
    const batch = officialFiles.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (url) => {
      try {
        const data = await fetchJson(url);
        const monsters = data.monster || [];
        monsters.forEach(m => {
          if (!m.name) return;
          const key = `${m.name.toLowerCase()}|${(m.source || '').toLowerCase()}`;
          rawMonsterMap.set(key, m);
          if (m._copy) copyMonsters.push(m);
        });
      } catch (err) {}
    }));
  }

  // Descargar 3PP
  console.log('Descargando fuentes 3PP y Crossovers...');
  const all3pp = [...THIRD_PARTY_SOURCES, ...CROSSOVER_SOURCES];
  for (const src of all3pp) {
    try {
      const data = await fetchJson(src.url);
      const monsters = data.monster || [];
      monsters.forEach(m => {
        if (!m.name) return;
        const key = `${m.name.toLowerCase()}|${(m.source || '').toLowerCase()}`;
        rawMonsterMap.set(key, m);
        if (m._copy) copyMonsters.push(m);
      });
    } catch (err) {}
  }

  console.log(`Indexados ${rawMonsterMap.size} monstruos crudos. Encontrados ${copyMonsters.length} con _copy.`);

  // Helper para buscar raw monster
  function findRawMonster(name, source) {
    if (!name) return null;
    const nameLow = name.toLowerCase();
    if (source) {
      const exact = rawMonsterMap.get(`${nameLow}|${source.toLowerCase()}`);
      if (exact) return exact;
    }
    for (const [k, v] of rawMonsterMap.entries()) {
      if (k.startsWith(`${nameLow}|`)) return v;
    }
    return null;
  }

  // Modificador _mod
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
          const re = new RegExp(mod.replace, mod.flags || 'gi');
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

  // Resolver _copy recursivo
  function resolveRawCopy(monster, depth = 0) {
    if (!monster._copy || depth > 5) return monster;
    const copyTarget = findRawMonster(monster._copy.name, monster._copy.source);
    if (!copyTarget) return monster;

    const resolvedParent = resolveRawCopy(copyTarget, depth + 1);
    const result = JSON.parse(JSON.stringify(resolvedParent));

    // Templates
    if (monster._copy._templates && Array.isArray(monster._copy._templates)) {
      monster._copy._templates.forEach(tRef => {
        const tpl = templates.find(t => t.name.toLowerCase() === tRef.name?.toLowerCase());
        if (tpl && tpl.apply) {
          if (tpl.apply._root) Object.assign(result, JSON.parse(JSON.stringify(tpl.apply._root)));
          if (tpl.apply._mod) applyMod(result, tpl.apply._mod);
        }
      });
    }

    // Sobreescrituras propias
    Object.keys(monster).forEach(k => {
      if (k !== '_copy') {
        result[k] = JSON.parse(JSON.stringify(monster[k]));
      }
    });

    if (monster._copy._mod) {
      applyMod(result, monster._copy._mod);
    }

    return result;
  }

  console.log('Resolviendo todas las criaturas _copy...');
  const resolvedCopyMap = new Map();
  copyMonsters.forEach(m => {
    try {
      const resolved = resolveRawCopy(m);
      resolvedCopyMap.set(`${m.name.toLowerCase()}|${(m.source || '').toLowerCase()}`, resolved);
      if (!resolvedCopyMap.has(m.name.toLowerCase())) {
        resolvedCopyMap.set(m.name.toLowerCase(), resolved);
      }
    } catch (e) {}
  });

  // Mapeo especial para los 24 huérfanos específicos
  const orphanDonorMap = {
    'blind artist': { donor: 'Zombie', source: 'MM' },
    'chimeric hare': { donor: 'Hare', source: 'IDRotF', overrides: { speed: { walk: 20, burrow: 5, fly: 30, canHover: false } } },
    'deseyna majarra': { donor: 'Noble', source: 'MM' },
    'elzerina cassalanter': { donor: 'Commoner', source: 'MM' },
    'fish': { donor: 'Quipper', source: 'MM' },
    'flying shield': { donor: 'Flying Sword', source: 'MM', overrides: { ac: 17, acText: '17' } },
    'forzaantilirys': { donor: 'Forzaantirilys', source: 'FleeMortals' },
    'garmyr': { donor: 'Gnoll', source: 'MM' },
    'gertrude ironhelm': { donor: 'Gladiator', source: 'MM' },
    'ghostly mount': { donor: 'Warhorse Skeleton', source: 'MM' },
    'gliding frog': { donor: 'Giant Frog', source: 'MM' },
    'grotesque gargant': { donor: 'Stone Giant', source: 'MM' },
    'halaster puppet': { donor: 'Homunculus', source: 'MM', overrides: { hp: 8, hpFormula: '8', ac: 10, speed: { walk: 20, fly: 0 } } },
    'innkeeper': { donor: 'Commoner', source: 'MM' },
    'jenks': { donor: 'Commoner', source: 'MM' },
    'master of the forge': { donor: 'Priest', source: 'MM' },
    'nat': { donor: 'Commoner', source: 'MM' },
    'overgrown viper vine': { donor: 'Viper Vine', source: 'PKB' },
    'rabbithead': { donor: 'Commoner', source: 'MM' },
    'ryan greymere': { donor: 'Archmage', source: 'MM' },
    'silver order guard': { donor: 'Guard', source: 'MM' },
    'silver order knight': { donor: 'Knight', source: 'MM' },
    'squiddly': { donor: 'Commoner', source: 'MM' },
    'terenzio cassalanter': { donor: 'Commoner', source: 'MM' }
  };

  console.log('\nEnriqueciendo criaturas, aplicando inglés canónico y preservando tablas...');
  let hydratedHollowCount = 0;
  let tablesPreservedCount = 0;
  let formattedCreaturesCount = 0;

  const enrichedBestiary = bestiary.map(creature => {
    const key = `${creature.name.toLowerCase()}|${(creature.source || '').toLowerCase()}`;
    const copyData = resolvedCopyMap.get(key) || resolvedCopyMap.get(creature.name.toLowerCase());
    const rawData = copyData || rawMonsterMap.get(key);

    let c = { ...creature };

    // Si es criatura hueca o copyData está completamente poblado, hidratar
    const isHollow = c.hp === 10 && c.ac === 10 && (!c.action || c.action.length === 0);
    if (isHollow || (copyData && (!c.action || c.action.length === 0))) {
      let donorData = copyData;

      // Revisar orphanDonorMap
      const orphanDef = orphanDonorMap[c.name.toLowerCase()];
      if (orphanDef) {
        donorData = findRawMonster(orphanDef.donor, orphanDef.source) || copyData;
      }

      // Si aún no hay donorData, buscar criatura con mismo nombre en bestiary
      if (!donorData) {
        donorData = bestiary.find(b => b.name.toLowerCase() === c.name.toLowerCase() && (b.hp !== 10 || b.ac !== 10 || (b.action && b.action.length > 0)));
      }

      if (donorData) {
        hydratedHollowCount++;
        if (donorData.ac) {
          c.ac = typeof donorData.ac === 'number' ? donorData.ac : (donorData.ac[0]?.ac || donorData.ac || c.ac);
          c.acText = donorData.acText || `${c.ac}`;
        }
        if (donorData.hp) {
          c.hp = typeof donorData.hp === 'number' ? donorData.hp : (donorData.hp.average || (typeof donorData.hp.special === 'string' ? parseInt(donorData.hp.special, 10) : null) || donorData.hp || c.hp);
          c.hpFormula = donorData.hpFormula || donorData.hp?.formula || donorData.hp?.special || `${c.hp}`;
        }
        if (donorData.speed) {
          c.speed = donorData.speed;
        }
        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
          if (donorData[attr]) c[attr] = donorData[attr];
        });
        if (donorData.save) c.save = donorData.save;
        if (donorData.skill) c.skill = donorData.skill;
        if (donorData.senses) c.senses = donorData.senses;
        if (donorData.languages) c.languages = donorData.languages;
        if (donorData.passivePerception || donorData.passive) c.passivePerception = donorData.passivePerception || donorData.passive;
        if (donorData.immune) c.immune = donorData.immune;
        if (donorData.resist) c.resist = donorData.resist;
        if (donorData.vulnerable) c.vulnerable = donorData.vulnerable;
        if (donorData.conditionImmune) c.conditionImmune = donorData.conditionImmune;
        if (donorData.trait) c.trait = JSON.parse(JSON.stringify(donorData.trait));
        if (donorData.action) c.action = JSON.parse(JSON.stringify(donorData.action));
        if (donorData.bonus) c.bonus = JSON.parse(JSON.stringify(donorData.bonus));
        if (donorData.reaction) c.reaction = JSON.parse(JSON.stringify(donorData.reaction));
        if (donorData.legendary) c.legendary = JSON.parse(JSON.stringify(donorData.legendary));
        if (donorData.mythic) c.mythic = JSON.parse(JSON.stringify(donorData.mythic));
        if (donorData.spellcasting) c.spellcasting = JSON.parse(JSON.stringify(donorData.spellcasting));

        // Aplicar overrides específicos si existen
        if (orphanDef && orphanDef.overrides) {
          Object.assign(c, orphanDef.overrides);
        }
      }
    }

    // Si rawData tiene traits, actions o bonus crudos con tablas, refrescarlos con cleanEntries
    if (rawData) {
      if (rawData.trait && Array.isArray(rawData.trait) && rawData.trait.length > 0) {
        c.trait = rawData.trait.map(t => ({
          name: clean5eTags(t.name || ''),
          entries: cleanEntries(t.entries)
        }));
      }
      if (rawData.action && Array.isArray(rawData.action) && rawData.action.length > 0) {
        c.action = rawData.action.map(a => ({
          name: clean5eTags(a.name || ''),
          entries: cleanEntries(a.entries)
        }));
      }
      if (rawData.bonus && Array.isArray(rawData.bonus) && rawData.bonus.length > 0) {
        c.bonus = rawData.bonus.map(b => ({
          name: clean5eTags(b.name || ''),
          entries: cleanEntries(b.entries)
        }));
      }
      if (rawData.reaction && Array.isArray(rawData.reaction) && rawData.reaction.length > 0) {
        c.reaction = rawData.reaction.map(r => ({
          name: clean5eTags(r.name || ''),
          entries: cleanEntries(r.entries)
        }));
      }
      if (rawData.legendary && Array.isArray(rawData.legendary) && rawData.legendary.length > 0) {
        c.legendary = rawData.legendary.map(l => ({
          name: clean5eTags(l.name || ''),
          entries: cleanEntries(l.entries)
        }));
      }
      if (rawData.mythic && Array.isArray(rawData.mythic) && rawData.mythic.length > 0) {
        c.mythic = rawData.mythic.map(m => ({
          name: clean5eTags(m.name || ''),
          entries: cleanEntries(m.entries)
        }));
      }
    } else {
      // Re-limpiar entradas existentes con las nuevas reglas
      if (c.trait) c.trait = c.trait.map(t => ({ name: clean5eTags(t.name || ''), entries: cleanEntries(t.entries) }));
      if (c.action) c.action = c.action.map(a => ({ name: clean5eTags(a.name || ''), entries: cleanEntries(a.entries) }));
      if (c.bonus) c.bonus = c.bonus.map(b => ({ name: clean5eTags(b.name || ''), entries: cleanEntries(b.entries) }));
      if (c.reaction) c.reaction = c.reaction.map(r => ({ name: clean5eTags(r.name || ''), entries: cleanEntries(r.entries) }));
      if (c.legendary) c.legendary = c.legendary.map(l => ({ name: clean5eTags(l.name || ''), entries: cleanEntries(l.entries) }));
      if (c.mythic) c.mythic = c.mythic.map(m => ({ name: clean5eTags(m.name || ''), entries: cleanEntries(m.entries) }));
    }

    // Contar tablas
    const checkTables = (entries) => {
      if (!entries) return;
      for (const e of entries) {
        if (typeof e === 'object' && e !== null && (e.type === 'table' || (e.colLabels && e.rows))) {
          tablesPreservedCount++;
        }
      }
    };
    (c.trait || []).forEach(t => checkTables(t.entries));
    (c.action || []).forEach(a => checkTables(a.entries));

    // Limpieza general de campos de texto
    c.name = clean5eTags(c.name || '');
    if (Array.isArray(c.immune)) c.immune = c.immune.map(clean5eTags).filter(Boolean);
    if (Array.isArray(c.resist)) c.resist = c.resist.map(clean5eTags).filter(Boolean);
    if (Array.isArray(c.vulnerable)) c.vulnerable = c.vulnerable.map(clean5eTags).filter(Boolean);
    if (Array.isArray(c.conditionImmune)) c.conditionImmune = c.conditionImmune.map(clean5eTags).filter(Boolean);
    if (typeof c.senses === 'string') c.senses = clean5eTags(c.senses);
    if (typeof c.languages === 'string') c.languages = clean5eTags(c.languages);
    if (c.legendaryHeader) c.legendaryHeader = clean5eTags(typeof c.legendaryHeader === 'string' ? c.legendaryHeader : cleanEntries(c.legendaryHeader).join(' '));
    if (c.mythicHeader) c.mythicHeader = clean5eTags(typeof c.mythicHeader === 'string' ? c.mythicHeader : cleanEntries(c.mythicHeader).join(' '));

    formattedCreaturesCount++;
    return c;
  });

  const remainingHollow = enrichedBestiary.filter(c => c.hp === 10 && c.ac === 10 && (!c.action || c.action.length === 0));
  console.log(`\n======================================================`);
  console.log(`🎉 RESULTADOS DE LA REMEDIACIÓN:`);
  console.log(`   Criaturas totales procesadas: ${enrichedBestiary.length}`);
  console.log(`   Criaturas huecas hidratadas: ${hydratedHollowCount}`);
  console.log(`   Criaturas huecas restantes: ${remainingHollow.length}`);
  console.log(`   Tablas estructurales preservadas: ${tablesPreservedCount}`);
  console.log(`======================================================\n`);

  if (remainingHollow.length > 0) {
    console.log('Restantes huecas:');
    remainingHollow.forEach(r => console.log(' -', r.name, '|', r.source, '|', r.sourceGroup));
  }

  // Guardar archivo
  fs.writeFileSync(BESTIARY_PATH, JSON.stringify(enrichedBestiary, null, 2), 'utf8');
  console.log(`💾 Guardado exitosamente en ${BESTIARY_PATH} (${(fs.statSync(BESTIARY_PATH).size / 1024 / 1024).toFixed(2)} MB)`);
}

run();
