const fs = require('fs');
const path = require('path');
const https = require('https');

const CACHE_DIR = path.join(__dirname, '.cache_fluff');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

const BESTIARY_PATH = path.join(__dirname, '../public/data/bestiary.json');
const OUTPUT_FLUFF_PATH = path.join(__dirname, '../public/data/monster_fluff.json');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchJson(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode} for ${url}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(25000, () => {
      req.abort();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

function cleanTag(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\{@spell\s+([^}|]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@item\s+([^}|]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@creature\s+([^}|]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@condition\s+([^}|]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@status\s+([^}|]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@skill\s+([^}|]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@sense\s+([^}|]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@action\s+([^}|]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@hazard\s+([^}|]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@dc\s+([^}]+)\}/gi, 'DC $1')
    .replace(/\{@b\s+([^}]+)\}/gi, '$1')
    .replace(/\{@i\s+([^}]+)\}/gi, '$1')
    .replace(/\{@italic\s+([^}]+)\}/gi, '$1')
    .replace(/\{@bold\s+([^}]+)\}/gi, '$1')
    .replace(/\{@note\s+([^}]+)\}/gi, '$1')
    .replace(/\{@table\s+([^}|]+)(?:\|[^}]+)?\}/gi, 'Tabla: $1')
    .replace(/\{@dice\s+([^}|]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@damage\s+([^}|]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@[a-zA-Z]+\s*([^}|]+)?(?:\|[^}]+)?\}/gi, (_, arg) => arg || '')
    .trim();
}

function cleanEntries(entries) {
  if (!entries) return [];
  if (typeof entries === 'string') {
    const cleaned = cleanTag(entries);
    return cleaned ? [cleaned] : [];
  }
  if (!Array.isArray(entries)) return [];

  const result = [];
  for (const item of entries) {
    if (!item) continue;
    if (typeof item === 'string') {
      const cleaned = cleanTag(item);
      if (cleaned) result.push(cleaned);
    } else if (typeof item === 'object') {
      if (item.type === 'image') {
        // Handled in images
        continue;
      }
      if (item.type === 'list' && Array.isArray(item.items)) {
        const listItems = item.items.map(cleanTag).filter(Boolean);
        if (listItems.length > 0) {
          result.push({
            type: 'list',
            items: listItems
          });
        }
      } else if (item.entries || item.entry) {
        const subEntries = cleanEntries(item.entries || [item.entry]);
        if (subEntries.length > 0) {
          if (item.name) {
            result.push({
              name: cleanTag(item.name),
              entries: subEntries
            });
          } else {
            result.push(...subEntries);
          }
        }
      }
    }
  }
  return result;
}

function resolveImageHref(href) {
  if (!href) return null;
  if (typeof href === 'string') {
    if (href.startsWith('http')) return href;
    return `https://raw.githubusercontent.com/5etools-mirror-3/5etools-img/main/${href.replace(/^\//, '')}`;
  }
  if (href.url && typeof href.url === 'string') return href.url;
  if (href.path && typeof href.path === 'string') {
    if (href.path.startsWith('http')) return href.path;
    return `https://raw.githubusercontent.com/5etools-mirror-3/5etools-img/main/${href.path.replace(/^\//, '')}`;
  }
  if (href.href) return resolveImageHref(href.href);
  return null;
}

function extractImagesFromFluff(fluffObj) {
  const images = [];
  if (!fluffObj) return images;

  if (Array.isArray(fluffObj.images)) {
    for (const img of fluffObj.images) {
      const url = resolveImageHref(img.href || img);
      if (url && !images.includes(url)) images.push(url);
    }
  }

  // Also scan inside entries for type: 'image'
  function scanEntries(entries) {
    if (!Array.isArray(entries)) return;
    for (const e of entries) {
      if (!e) continue;
      if (e.type === 'image') {
        const url = resolveImageHref(e.href || e);
        if (url && !images.includes(url)) images.push(url);
      }
      if (e.entries) scanEntries(e.entries);
      if (e.items) scanEntries(e.items);
    }
  }
  scanEntries(fluffObj.entries);

  return images;
}

// 3PP Sources configuration
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

module.exports = {
  CACHE_DIR,
  BESTIARY_PATH,
  OUTPUT_FLUFF_PATH,
  fetchJson,
  cleanTag,
  cleanEntries,
  resolveImageHref,
  extractImagesFromFluff,
  THIRD_PARTY_SOURCES
};
