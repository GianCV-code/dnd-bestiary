import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../public/data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const CR_TO_XP = {
  "0": 10, "1/8": 25, "1/4": 50, "1/2": 100,
  "1": 200, "2": 450, "3": 700, "4": 1100, "5": 1800,
  "6": 2300, "7": 2900, "8": 3900, "9": 5000, "10": 5900,
  "11": 7200, "12": 8400, "13": 10000, "14": 11500, "15": 13000,
  "16": 15000, "17": 18000, "18": 20000, "19": 22000, "20": 25000,
  "21": 33000, "22": 41000, "23": 50000, "24": 62000, "25": 75000,
  "26": 90000, "27": 105000, "28": 120000, "29": 135000, "30": 155000
};

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

function crToNumber(cr) {
  if (typeof cr === 'object' && cr !== null) {
    cr = cr.cr || cr.coven || cr.lair || '0';
  }
  if (typeof cr === 'number') return cr;
  if (!cr) return 0;
  if (cr === '1/8') return 0.125;
  if (cr === '1/4') return 0.25;
  if (cr === '1/2') return 0.5;
  const num = parseFloat(cr);
  return isNaN(num) ? 0 : num;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
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

function cleanEntries(entries) {
  if (!entries) return [];
  if (typeof entries === 'string') return [cleanText(entries)];
  if (!Array.isArray(entries)) return [];
  
  const result = [];
  for (const item of entries) {
    if (typeof item === 'string') {
      const cleaned = cleanText(item);
      if (cleaned) result.push(cleaned);
    } else if (item && typeof item === 'object') {
      if (item.entries) {
        result.push({
          name: cleanText(item.name || ''),
          entries: cleanEntries(item.entries)
        });
      } else if (item.entry) {
        result.push({
          name: cleanText(item.name || ''),
          entries: [cleanText(item.entry)]
        });
      } else if (item.items) {
        cleanEntries(item.items).forEach(sub => result.push(sub));
      }
    }
  }
  return result;
}

function cleanText(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\{@dice ([^}]+)\}/g, '$1')
    .replace(/\{@damage ([^}]+)\}/g, '$1')
    .replace(/\{@atk ([^}]+)\}/g, '$1')
    .replace(/\{@h\}/g, 'Hit: ')
    .replace(/\{@recharge ([^}]+)\}/g, '(Recharge $1)')
    .replace(/\{@recharge\}/g, '(Recharge 6)')
    .replace(/\{@spell ([^}|]+)(?:\|[^}]+)?\}/g, '$1')
    .replace(/\{@item ([^}|]+)(?:\|[^}]+)?\}/g, '$1')
    .replace(/\{@creature ([^}|]+)(?:\|[^}]+)?\}/g, '$1')
    .replace(/\{@condition ([^}|]+)(?:\|[^}]+)?\}/g, '$1')
    .replace(/\{@dc ([^}]+)\}/g, 'DC $1')
    .replace(/\{@b ([^}]+)\}/g, '$1')
    .replace(/\{@i ([^}]+)\}/g, '$1')
    .replace(/\{@note ([^}]+)\}/g, '$1')
    .replace(/\{@[a-z]+ ([^}|]+)(?:\|[^}]+)?\}/g, '$1');
}

function parseAc(ac) {
  if (typeof ac === 'number') return { numeric: ac, text: `${ac}` };
  if (Array.isArray(ac)) {
    const first = ac[0];
    if (typeof first === 'number') return { numeric: first, text: `${first}` };
    if (typeof first === 'object' && first !== null) {
      const num = first.ac || 10;
      const from = (first.from || []).map(cleanText).join(', ');
      return { numeric: num, text: from ? `${num} (${from})` : `${num}` };
    }
  }
  return { numeric: 10, text: '10' };
}

function parseHp(hp) {
  if (typeof hp === 'number') return { average: hp, formula: `${hp}` };
  if (typeof hp === 'object' && hp !== null) {
    return {
      average: hp.average || 10,
      formula: hp.formula || `${hp.average || 10}`
    };
  }
  return { average: 10, formula: '10' };
}

function parseSpeed(speed) {
  const parsed = { walk: 0, fly: 0, swim: 0, climb: 0, burrow: 0, canHover: false };
  if (typeof speed === 'number') {
    parsed.walk = speed;
    return parsed;
  }
  if (typeof speed === 'object' && speed !== null) {
    if (typeof speed.walk === 'number') parsed.walk = speed.walk;
    else if (typeof speed.walk === 'object') parsed.walk = speed.walk.number || 0;

    if (typeof speed.fly === 'number') parsed.fly = speed.fly;
    else if (typeof speed.fly === 'object') {
      parsed.fly = speed.fly.number || 0;
      if (speed.fly.condition && speed.fly.condition.includes('hover')) parsed.canHover = true;
    }
    if (speed.canHover) parsed.canHover = true;

    if (typeof speed.swim === 'number') parsed.swim = speed.swim;
    else if (typeof speed.swim === 'object') parsed.swim = speed.swim.number || 0;

    if (typeof speed.climb === 'number') parsed.climb = speed.climb;
    else if (typeof speed.climb === 'object') parsed.climb = speed.climb.number || 0;

    if (typeof speed.burrow === 'number') parsed.burrow = speed.burrow;
    else if (typeof speed.burrow === 'object') parsed.burrow = speed.burrow.number || 0;
  }
  return parsed;
}

function formatList(val, fallback = '') {
  if (!val) return fallback;
  if (Array.isArray(val)) {
    return cleanText(val.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        return item.name || item.tag || item.special || '';
      }
      return String(item);
    }).filter(Boolean).join(', '));
  }
  if (typeof val === 'string') return cleanText(val);
  return fallback;
}

function normalizeCreature(m, meta, fluffMap = null) {
  const crRaw = m.cr ? (typeof m.cr === 'object' ? (m.cr.cr || '0') : m.cr) : '0';
  const crNumeric = crToNumber(crRaw);
  const xp = m.xp || CR_TO_XP[crRaw] || 0;
  const acInfo = parseAc(m.ac);
  const hpInfo = parseHp(m.hp);
  const speedInfo = parseSpeed(m.speed);

  // Parse Type and Tags
  let creatureType = 'monstrosity';
  let typeTags = [];
  if (typeof m.type === 'string') {
    creatureType = m.type.toLowerCase();
  } else if (typeof m.type === 'object' && m.type !== null) {
    if (typeof m.type.type === 'string') {
      creatureType = m.type.type.toLowerCase();
    } else if (Array.isArray(m.type.type)) {
      creatureType = String(m.type.type[0] || 'monstrosity').toLowerCase();
    } else if (m.type.choose) {
      creatureType = 'humanoid';
    }
    if (Array.isArray(m.type.tags)) {
      typeTags = m.type.tags.map(t => typeof t === 'string' ? t.toLowerCase() : (t.tag || ''));
    }
  }

  // Parse Alignment
  let alignment = 'Unaligned';
  if (Array.isArray(m.alignment)) {
    alignment = m.alignment.map(a => typeof a === 'string' ? a : (a.alignment ? a.alignment.join('') : '')).filter(Boolean).join(' / ').toUpperCase();
  } else if (typeof m.alignment === 'string') {
    alignment = m.alignment;
  }

  // Token & Art Extraction Engine (WotC + 3PP + Crossovers)
  const tokenUrl = extractTokenUrl(m, meta);
  const artUrl = extractArtUrl(m, meta, fluffMap);

  return {
    id: `${m.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${(m.source || meta.sourceGroup).toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    name: m.name,
    source: m.source || meta.sourceGroup,
    sourceGroup: meta.sourceGroup,
    category: meta.category,
    publisher: meta.publisher || meta.category,
    size: Array.isArray(m.size) ? m.size[0] : (m.size || 'M'),
    type: creatureType,
    typeTags: typeTags,
    alignment: alignment,
    cr: String(crRaw),
    crNumeric: crNumeric,
    xp: xp,
    ac: acInfo.numeric,
    acText: acInfo.text,
    hp: hpInfo.average,
    hpFormula: hpInfo.formula,
    speed: speedInfo,
    str: m.str || 10,
    dex: m.dex || 10,
    con: m.con || 10,
    int: m.int || 10,
    wis: m.wis || 10,
    cha: m.cha || 10,
    save: m.save || {},
    skill: m.skill || {},
    senses: formatList(m.senses, '—'),
    passivePerception: m.passive || 10,
    languages: formatList(m.languages, '—'),
    immune: (m.immune || []).map(cleanText),
    resist: (m.resist || []).map(cleanText),
    vulnerable: (m.vulnerable || []).map(cleanText),
    conditionImmune: (m.conditionImmune || []).map(cleanText),
    trait: (m.trait || []).map(t => ({ name: t.name || '', entries: cleanEntries(t.entries) })),
    action: (m.action || []).map(a => ({ name: a.name || '', entries: cleanEntries(a.entries) })),
    reaction: (m.reaction || []).map(r => ({ name: r.name || '', entries: cleanEntries(r.entries) })),
    legendary: (m.legendary || []).map(l => ({ name: l.name || '', entries: cleanEntries(l.entries) })),
    mythic: (m.mythic || []).map(l => ({ name: l.name || '', entries: cleanEntries(l.entries) })),
    spellcasting: (m.spellcasting || []).map(s => ({
      name: s.name || 'Spellcasting',
      headerEntries: cleanEntries(s.headerEntries),
      spells: s.spells || {},
      will: s.will ? cleanEntries(s.will) : null,
      daily: s.daily || null
    })),
    environment: m.environment || [],
    hasToken: !!tokenUrl,
    tokenUrl: tokenUrl,
    hasArt: !!artUrl,
    artUrl: artUrl
  };
}

function resolveHref(href) {
  if (!href) return null;
  if (typeof href === 'string') return href;
  if (href.url) return href.url;
  if (href.href && typeof href.href === 'object') return resolveHref(href.href);
  if (href.path) {
    if (href.path.startsWith('http')) return href.path;
    return `https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/${href.path.replace(/^\//, '')}`;
  }
  return null;
}

function findImageInEntries(entries) {
  if (!Array.isArray(entries)) return null;
  for (const entry of entries) {
    if (!entry) continue;
    if (entry.type === 'image') {
      const url = resolveHref(entry.href || entry);
      if (url) return url;
    }
    if (Array.isArray(entry.entries)) {
      const nested = findImageInEntries(entry.entries);
      if (nested) return nested;
    }
    if (Array.isArray(entry.items)) {
      const nested = findImageInEntries(entry.items);
      if (nested) return nested;
    }
  }
  return null;
}

function extractTokenUrl(m, meta) {
  // 1. Explicit tokenUrl / tokenHref in monster data (used across 3PP and Homebrew)
  if (m.tokenUrl && typeof m.tokenUrl === 'string') return m.tokenUrl;
  if (m.tokenHref) {
    const url = resolveHref(m.tokenHref);
    if (url) return url;
  }
  // 2. Official WotC token format (all official creatures have a token in 5eTools)
  if (meta.category === 'Official WotC' || !meta.category) {
    const src = m.source || meta.sourceGroup;
    return `https://raw.githubusercontent.com/5etools-mirror-3/5etools-img/main/bestiary/tokens/${src}/${encodeURIComponent(m.name)}.webp`;
  }
  return null;
}

function extractArtUrl(m, meta, fluffMap) {
  // 1. In monster.fluff.images (common in homebrew like MCDM and Dragonix)
  if (m.fluff && Array.isArray(m.fluff.images)) {
    for (const img of m.fluff.images) {
      const url = resolveHref(img.href || img);
      if (url) return url;
    }
  }
  // 1b. In monster.fluff.entries
  if (m.fluff && Array.isArray(m.fluff.entries)) {
    const url = findImageInEntries(m.fluff.entries);
    if (url) return url;
  }
  // 2. In monster.images
  if (Array.isArray(m.images)) {
    for (const img of m.images) {
      const url = resolveHref(img.href || img);
      if (url) return url;
    }
  }
  // 3. In fluffMap (from data.monsterFluff, e.g. Kobold Press ToB 1, 2, 3, CC)
  if (fluffMap) {
    const key = (m.name || '').toLowerCase() + '__' + (m.source || '').toLowerCase();
    const fluff = fluffMap.get(key) || fluffMap.get((m.name || '').toLowerCase());
    if (fluff) {
      if (Array.isArray(fluff.images)) {
        for (const img of fluff.images) {
          const url = resolveHref(img.href || img);
          if (url) return url;
        }
      }
      if (Array.isArray(fluff.entries)) {
        const url = findImageInEntries(fluff.entries);
        if (url) return url;
      }
    }
  }
  // 4. Official WotC illustration (with smart dragon mapping)
  if (meta.category === 'Official WotC') {
    const source = m.source || 'MM';
    let artName = m.name || '';
    let isDragonMapped = false;
    if (source === 'MM' && artName.includes('Dragon')) {
      const match = artName.match(/^(Ancient|Young)\s+(.+Dragon)$/i);
      if (match) {
        artName = `Adult ${match[2]}`;
        isDragonMapped = true;
      }
    }
    // Only return artUrl if 5eTools marks hasFluffImages or it was a mapped dragon
    if (m.hasFluffImages || isDragonMapped) {
      return `https://raw.githubusercontent.com/5etools-mirror-3/5etools-img/main/bestiary/${source}/${encodeURIComponent(artName)}.webp`;
    }
    return null;
  }
  return null;
}

// THE COMPLETE CURATED LIST OF ALL MAJOR THIRD-PARTY PUBLISHERS (3PP PRO)
const THIRD_PARTY_SOURCES = [
  // --- KOBOLD PRESS ---
  {
    category: 'Third-Party (3PP Pro)',
    publisher: 'Kobold Press',
    sourceGroup: 'Tome of Beasts 1 (2023 Edition)',
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Kobold%20Press%3B%20Tome%20of%20Beasts%201%20(2023%20Edition).json'
  },
  {
    category: 'Third-Party (3PP Pro)',
    publisher: 'Kobold Press',
    sourceGroup: 'Tome of Beasts 2',
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Kobold%20Press%3B%20Tome%20of%20Beasts%202.json'
  },
  {
    category: 'Third-Party (3PP Pro)',
    publisher: 'Kobold Press',
    sourceGroup: 'Tome of Beasts 3',
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Kobold%20Press%3B%20Tome%20of%20Beasts%203.json'
  },
  {
    category: 'Third-Party (3PP Pro)',
    publisher: 'Kobold Press',
    sourceGroup: 'Creature Codex',
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Kobold%20Press%3B%20Creature%20Codex.json'
  },
  // --- MCDM PRODUCTIONS (Matt Colville) ---
  {
    category: 'Third-Party (3PP Pro)',
    publisher: 'MCDM Productions',
    sourceGroup: 'Flee, Mortals!',
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/MCDM%20Productions%3B%20Flee%2C%20Mortals%21.json'
  },
  {
    category: 'Third-Party (3PP Pro)',
    publisher: 'MCDM Productions',
    sourceGroup: 'Where Evil Lives',
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/MCDM%20Productions%3B%20Where%20Evil%20Lives.json'
  },
  // --- LOOT TAVERN ---
  {
    category: 'Third-Party (3PP Pro)',
    publisher: 'Loot Tavern',
    sourceGroup: "Heliana's Guide To Monster Hunting",
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Loot%20Tavern%3B%20Heliana%27s%20Guide%20To%20Monster%20Hunting.json'
  },
  {
    category: 'Third-Party (3PP Pro)',
    publisher: 'Loot Tavern',
    sourceGroup: "Ryoko's Guide to the Yokai Realms",
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Loot%20Tavern%3B%20Ryoko%27s%20Guide%20to%20the%20Yokai%20Realms.json'
  },
  {
    category: 'Third-Party (3PP Pro)',
    publisher: 'Loot Tavern',
    sourceGroup: 'Wrath of the Kaiju',
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Loot%20Tavern%3B%20Wrath%20of%20the%20Kaiju.json'
  },
  {
    category: 'Third-Party (3PP Pro)',
    publisher: 'Loot Tavern',
    sourceGroup: "L'Arsene's Ledger of Treasures and Trinkets",
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Loot%20Tavern%3B%20L%27Arsene%27s%20Ledger%20of%20Treasures%20and%20Trinkets.json'
  },
  // --- GHOSTFIRE GAMING ---
  {
    category: 'Third-Party (3PP Pro)',
    publisher: 'Ghostfire Gaming',
    sourceGroup: 'Grim Hollow - The Monster Grimoire',
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Ghostfire%20Gaming%3B%20Grim%20Hollow%20-%20The%20Monster%20Grimoire.json'
  },
  {
    category: 'Third-Party (3PP Pro)',
    publisher: 'Ghostfire Gaming',
    sourceGroup: 'Monsters of Drakkenheim',
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Ghostfire%20Gaming%3B%20Monsters%20of%20Drakkenheim.json'
  },
  {
    category: 'Third-Party (3PP Pro)',
    publisher: 'Ghostfire Gaming',
    sourceGroup: 'Dungeons of Drakkenheim',
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Ghostfire%20Gaming%3B%20Dungeons%20of%20Drakkenheim.json'
  },
  {
    category: 'Third-Party (3PP Pro)',
    publisher: 'Ghostfire Gaming',
    sourceGroup: 'Grim Hollow - Lairs of Etharis',
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Ghostfire%20Gaming%3B%20Grim%20Hollow%20-%20Lairs%20of%20Etharis.json'
  },
  // --- DRAGONIX ---
  {
    category: 'Third-Party (3PP Pro)',
    publisher: 'Dragonix',
    sourceGroup: 'Monster Manual Expanded I',
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Dragonix%3B%20Monster%20Manual%20Expanded%20(v1).json'
  },
  {
    category: 'Third-Party (3PP Pro)',
    publisher: 'Dragonix',
    sourceGroup: 'Monster Manual Expanded II',
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Dragonix%3B%20Monster%20Manual%20Expanded%20II%20(v2).json'
  },
  {
    category: 'Third-Party (3PP Pro)',
    publisher: 'Dragonix',
    sourceGroup: 'Monster Manual Expanded III',
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Dragonix%3B%20Monster%20Manual%20Expanded%20III.json'
  },
  // --- NORD GAMES ---
  {
    category: 'Third-Party (3PP Pro)',
    publisher: 'Nord Games',
    sourceGroup: 'Ultimate Bestiary: Revenge of the Horde',
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Nord%20Games%3B%20Game%20Master%27s%20Toolbox%20Ultimate%20Bestiary%20Revenge%20of%20the%20Horde.json'
  },
  {
    category: 'Third-Party (3PP Pro)',
    publisher: 'Nord Games',
    sourceGroup: 'Ultimate Bestiary: The Dreaded Accursed',
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Nord%20Games%3B%20Ultimate%20Bestiary%20The%20Dreaded%20Accursed.json'
  },
  // --- PAIZO ---
  {
    category: 'Third-Party (3PP Pro)',
    publisher: 'Paizo',
    sourceGroup: 'Pathfinder Kingmaker Bestiary (5e)',
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Paizo%3B%20Pathfinder%20-%20Kingmaker%20Bestiary%20(5e).json'
  },
  // --- FROG GOD GAMES ---
  {
    category: 'Third-Party (3PP Pro)',
    publisher: 'Frog God Games',
    sourceGroup: 'Fifth Edition Foes',
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Frog%20God%20Games%3B%20Fifth%20Edition%20Foes.json'
  }
];

// THE 6 CHOSEN CROSSOVER HOMEBREWS
const CROSSOVER_SOURCES = [
  {
    category: 'Crossover / Video Games',
    publisher: 'Capcom / Amellwind',
    sourceGroup: 'Monster Hunter Monster Manual',
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Amellwind;%20Monster%20Hunter%20Monster%20Manual.json'
  },
  {
    category: 'Crossover / Video Games',
    publisher: 'Red Hook / DM Tuz',
    sourceGroup: 'Darkest Dungeon: Horrors of the Dark',
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/DM%20Tuz;%20Darkest%20Dungeon%20-%20Horrors%20of%20the%20Dark.json'
  },
  {
    category: 'Crossover / Video Games',
    publisher: 'FromSoftware / Amratat',
    sourceGroup: "Dark Souls III: Lord Seeker's Compendium",
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Amratat;%20Dark%20Souls%20III%20-%20Lord%20Seeker%27s%20Compendium.json'
  },
  {
    category: 'Crossover / Video Games',
    publisher: 'Bethesda / Ben Luke',
    sourceGroup: 'Skyrim Homebrew',
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Ben%20Luke;%20Skyrim%20Homebrew.json'
  },
  {
    category: 'Crossover / Video Games',
    publisher: 'Acheron',
    sourceGroup: "Dante's Inferno",
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/Acheron;%20Dante%27s%20Inferno.json'
  },
  {
    category: 'Crossover / Video Games',
    publisher: 'Elder Scrolls / badooga',
    sourceGroup: 'Daedric Imports (Elder Scrolls)',
    url: 'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/creature/badooga;%20Daedric%20Imports.json'
  }
];

async function run() {
  console.log('🚀 Starting Universal Bestiary Master Import (WotC + 3PP + Crossovers)...');
  const allCreatures = [];
  const seenIds = new Set();

  // 1. FETCH ALL WOTC OFFICIAL SOURCES FROM INDEX.JSON
  console.log('\n--- PHASE 1: Official WotC Bestiaries ---');
  try {
    const officialIndex = await fetchJson('https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data/bestiary/index.json');
    const entries = Object.entries(officialIndex);
    console.log(`Found ${entries.length} official sourcebook files.`);

    for (const [code, filename] of entries) {
      const bookName = OFFICIAL_BOOK_NAMES[code] || `Official (${code})`;
      const url = `https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data/bestiary/${filename}`;
      try {
        const data = await fetchJson(url);
        const list = data.monster || [];
        let added = 0;
        for (const m of list) {
          if (!m.name) continue;
          const normalized = normalizeCreature(m, {
            category: 'Official WotC',
            publisher: 'Wizards of the Coast',
            sourceGroup: bookName
          });
          if (!seenIds.has(normalized.id)) {
            seenIds.add(normalized.id);
            allCreatures.push(normalized);
            added++;
          }
        }
        if (added > 0) {
          console.log(`  ✓ ${bookName}: ${added} creatures`);
        }
      } catch (err) {
        console.error(`  ❌ Error on ${code}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Failed to load official index.json:', err.message);
  }

  // 2. FETCH ALL MAJOR THIRD-PARTY PUBLISHERS (3PP PRO)
  console.log('\n--- PHASE 2: Major Third-Party Publishers (Kobold Press, MCDM, Loot Tavern, etc.) ---');
  for (const src of THIRD_PARTY_SOURCES) {
    try {
      const data = await fetchJson(src.url);
      const list = data.monster || [];
      const fluffList = data.monsterFluff || [];
      const fluffMap = new Map();
      for (const f of fluffList) {
        if (!f.name) continue;
        const key = f.name.toLowerCase() + '__' + (f.source || '').toLowerCase();
        fluffMap.set(key, f);
        if (!fluffMap.has(f.name.toLowerCase())) {
          fluffMap.set(f.name.toLowerCase(), f);
        }
      }

      let added = 0;
      let withToken = 0;
      let withArt = 0;
      for (const m of list) {
        if (!m.name) continue;

        // Filter out MCDM Companions, Retainers and hollow WhereEvilLives _copy aliases
        if (src.publisher === 'MCDM Productions') {
          const isRetainerOrCompanion = (
            (Array.isArray(m.typeTags) && (m.typeTags.includes('retainer') || m.typeTags.includes('companion'))) ||
            (m.type && Array.isArray(m.type.tags) && m.type.tags.some(t => typeof t === 'string' && (t.toLowerCase() === 'retainer' || t.toLowerCase() === 'companion'))) ||
            m.name.toLowerCase().includes('retainer') ||
            m.name.toLowerCase().includes('companion')
          );
          if (isRetainerOrCompanion) continue;

          // Also filter out hollow _copy references in WhereEvilLives that have no actual actions or traits
          if (m._copy && (!m.action || m.action.length === 0) && (!m.trait || m.trait.length === 0)) continue;
        }

        const normalized = normalizeCreature(m, src, fluffMap);
        if (!seenIds.has(normalized.id)) {
          seenIds.add(normalized.id);
          allCreatures.push(normalized);
          added++;
          if (normalized.hasToken) withToken++;
          if (normalized.hasArt) withArt++;
        }
      }
      console.log(`  ✓ [${src.publisher}] ${src.sourceGroup}: ${added} creatures (Tokens: ${withToken}, Art: ${withArt})`);
    } catch (err) {
      console.error(`  ❌ Error fetching ${src.sourceGroup}:`, err.message);
    }
  }

  // 3. FETCH THE 6 CROSSOVERS
  console.log('\n--- PHASE 3: Video Game Crossovers (Monster Hunter, Dark Souls, etc.) ---');
  for (const src of CROSSOVER_SOURCES) {
    try {
      const data = await fetchJson(src.url);
      const list = data.monster || [];
      const fluffList = data.monsterFluff || [];
      const fluffMap = new Map();
      for (const f of fluffList) {
        if (!f.name) continue;
        const key = f.name.toLowerCase() + '__' + (f.source || '').toLowerCase();
        fluffMap.set(key, f);
        if (!fluffMap.has(f.name.toLowerCase())) {
          fluffMap.set(f.name.toLowerCase(), f);
        }
      }

      let added = 0;
      let withToken = 0;
      let withArt = 0;
      for (const m of list) {
        if (!m.name) continue;
        const normalized = normalizeCreature(m, src, fluffMap);
        if (!seenIds.has(normalized.id)) {
          seenIds.add(normalized.id);
          allCreatures.push(normalized);
          added++;
          if (normalized.hasToken) withToken++;
          if (normalized.hasArt) withArt++;
        }
      }
      console.log(`  ✓ [${src.publisher}] ${src.sourceGroup}: ${added} creatures (Tokens: ${withToken}, Art: ${withArt})`);
    } catch (err) {
      console.error(`  ❌ Error fetching ${src.sourceGroup}:`, err.message);
    }
  }

  // Sort by Name
  allCreatures.sort((a, b) => a.name.localeCompare(b.name));

  const totalWithToken = allCreatures.filter(c => c.hasToken).length;
  const totalWithArt = allCreatures.filter(c => c.hasArt).length;
  const totalWithBoth = allCreatures.filter(c => c.hasToken && c.hasArt).length;
  const totalWithNeither = allCreatures.filter(c => !c.hasToken && !c.hasArt).length;

  console.log(`\n🎉 TOTAL UNIQUE CREATURES IMPORTED: ${allCreatures.length}`);
  console.log(`   Tokens VTT: ${totalWithToken} (${((totalWithToken/allCreatures.length)*100).toFixed(1)}%)`);
  console.log(`   Full Artwork: ${totalWithArt} (${((totalWithArt/allCreatures.length)*100).toFixed(1)}%)`);
  console.log(`   Both (Token + Art): ${totalWithBoth} (${((totalWithBoth/allCreatures.length)*100).toFixed(1)}%)`);
  console.log(`   Neither: ${totalWithNeither} (${((totalWithNeither/allCreatures.length)*100).toFixed(1)}%)`);

  const outputPath = path.join(DATA_DIR, 'bestiary.json');
  fs.writeFileSync(outputPath, JSON.stringify(allCreatures, null, 2), 'utf8');
  console.log(`💾 Saved to ${outputPath} (${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB)`);
}

run();
