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

// Canonical English 5e tag cleaner & attack notation formatter
function clean5eTags(text) {
  if (!text || typeof text !== 'string') return '';
  let str = text;

  // Unify any previous Spanish artifacts
  str = str
    .replace(/dSalvaci[oó]n\s*\(([^)]+)\):/gi, 'Save ($1):')
    .replace(/Salvaci[oó]n\s+de\s+Fuerza(?:\s*\(Strength\))?:/gi, 'Strength saving throw:')
    .replace(/Salvaci[oó]n\s+de\s+Destreza(?:\s*\(Dexterity\))?:/gi, 'Dexterity saving throw:')
    .replace(/Salvaci[oó]n\s+de\s+Constituci[oó]n(?:\s*\(Constitution\))?:/gi, 'Constitution saving throw:')
    .replace(/Salvaci[oó]n\s+de\s+Inteligencia(?:\s*\(Intelligence\))?:/gi, 'Intelligence saving throw:')
    .replace(/Salvaci[oó]n\s+de\s+Sabidur[íi]a(?:\s*\(Wisdom\))?:/gi, 'Wisdom saving throw:')
    .replace(/Salvaci[oó]n\s+de\s+Carisma(?:\s*\(Charisma\))?:/gi, 'Charisma saving throw:')
    .replace(/Salvaci[oó]n\s*\(([^)]+)\):/gi, '$1 saving throw:')
    .replace(/Ataque\s+con\s+arma\s+cuerpo\s+a\s+cuerpo:/gi, 'Melee Weapon Attack:')
    .replace(/Ataque\s+con\s+arma\s+a\s+distancia:/gi, 'Ranged Weapon Attack:')
    .replace(/Ataque\s+de\s+conjuro\s+cuerpo\s+a\s+cuerpo:/gi, 'Melee Spell Attack:')
    .replace(/Ataque\s+de\s+conjuro\s+a\s+distancia:/gi, 'Ranged Spell Attack:')
    .replace(/Ataque\s+cuerpo\s+a\s+cuerpo:/gi, 'Melee Attack Roll:')
    .replace(/Ataque\s+a\s+distancia:/gi, 'Ranged Attack Roll:')
    .replace(/\bImpacto:\s*/gi, 'Hit: ')
    .replace(/\bFallo:\s*/gi, 'Miss: ')
    .replace(/\bImpacto\s+o\s+Fallo:\s*/gi, 'Hit or Miss: ')
    .replace(/\bDisparador:\s*/gi, 'Trigger: ')
    .replace(/\bRespuesta:\s*/gi, 'Response: ')
    .replace(/\bPrimer\s+Fallo:\s*/gi, 'First Failure: ')
    .replace(/\bSegundo\s+Fallo:\s*/gi, 'Second Failure: ')
    .replace(/\bCD\s*(\d+)/gi, 'DC $1')
    .replace(/\(Recarga\s*([2-6](?:-[2-6])?)\)/gi, '(Recharge $1)');

  let prev = '';
  let iterations = 0;
  while (str !== prev && iterations < 6) {
    prev = str;
    iterations++;

    str = str
      .replace(/\{@actTrigger\}/gi, 'Trigger: ')
      .replace(/\{@actResponse(?:\s+[^}]+)?\}/gi, 'Response: ')
      
      .replace(/\{@actSave\s+(str|fue)[^}]*\}/gi, 'Strength saving throw: ')
      .replace(/\{@actSave\s+(dex|des)[^}]*\}/gi, 'Dexterity saving throw: ')
      .replace(/\{@actSave\s+(con)[^}]*\}/gi, 'Constitution saving throw: ')
      .replace(/\{@actSave\s+(int)[^}]*\}/gi, 'Intelligence saving throw: ')
      .replace(/\{@actSave\s+(wis|sab)[^}]*\}/gi, 'Wisdom saving throw: ')
      .replace(/\{@actSave\s+(cha|car)[^}]*\}/gi, 'Charisma saving throw: ')
      .replace(/\{@actSave\s+([^}]+)\}/gi, '$1 saving throw: ')
      
      .replace(/\{@actSaveFail\s*1\}/gi, 'First Failure: ')
      .replace(/\{@actSaveFail\s*2\}/gi, 'Second Failure: ')
      .replace(/\{@actSaveFail(?:\s+[^}]+)?\}/gi, 'Failure: ')
      .replace(/\{@actSaveFailBy\s+([^}]+)\}/gi, 'Failure by $1 or more: ')
      .replace(/\{@actSaveSuccess\}/gi, 'Success: ')
      .replace(/\{@actSaveSuccessOrFail\}/gi, 'Failure or Success: ')

      .replace(/\{@atk\s+mw,rw\}|\{@atk\s+rw,mw\}/gi, 'Melee or Ranged Weapon Attack:')
      .replace(/\{@atk\s+ms,rs\}|\{@atk\s+rs,ms\}/gi, 'Melee or Ranged Spell Attack:')
      .replace(/\{@atk\s+mw,rs\}|\{@atk\s+rs,mw\}/gi, 'Melee Weapon or Ranged Spell Attack:')
      .replace(/\{@atk\s+mw\}/gi, 'Melee Weapon Attack:')
      .replace(/\{@atk\s+rw\}/gi, 'Ranged Weapon Attack:')
      .replace(/\{@atk\s+ms\}/gi, 'Melee Spell Attack:')
      .replace(/\{@atk\s+rs\}/gi, 'Ranged Spell Attack:')
      .replace(/\{@atk\s+mp,rp\}|\{@atk\s+rp,mp\}/gi, 'Melee or Ranged Power Attack:')
      .replace(/\{@atk\s+mp\}/gi, 'Melee Power Attack:')
      .replace(/\{@atk\s+rp\}/gi, 'Ranged Power Attack:')
      .replace(/\{@atkr\s+m,r\}|\{@atkr\s+r,m\}|\{@atk\s+m,r\}/gi, 'Melee or Ranged Attack Roll:')
      .replace(/\{@atkr\s+m\}|\{@atk\s+m\}/gi, 'Melee Attack Roll:')
      .replace(/\{@atkr\s+r\}|\{@atk\s+r\}/gi, 'Ranged Attack Roll:')
      .replace(/\{@atk\s+([^}]+)\}/gi, 'Attack ($1):')

      .replace(/\{@hit\s+([+-]?\d+)\}/gi, (_, n) => (n.startsWith('+') || n.startsWith('-')) ? n : `+${n}`)
      .replace(/\{@hitYourSpellAttack(?:\s+[^}]+)?\}/gi, 'your spell attack modifier')
      .replace(/\{@dcYourSpellSave\}/gi, 'your spell save DC')
      .replace(/\{@h\}/gi, 'Hit: ')
      .replace(/\{@m\}/gi, 'Miss: ')
      .replace(/\{@hom\}/gi, 'Hit or Miss: ')

      .replace(/\{@recharge\s*([^}]+)?\}/gi, (_, n) => {
        if (!n) return '(Recharge 6)';
        const val = n.trim();
        if (val === '6') return '(Recharge 6)';
        if (val === '5') return '(Recharge 5-6)';
        if (val === '4') return '(Recharge 4-6)';
        if (val === '3') return '(Recharge 3-6)';
        if (val === '2') return '(Recharge 2-6)';
        if (/^\d$/.test(val)) return `(Recharge ${val}-6)`;
        return `(Recharge ${val})`;
      })
      .replace(/\{@dice\s+([^}]+)\}/gi, '$1')
      .replace(/\{@damage\s+([^}]+)\}/gi, '$1')
      .replace(/\{@d20\s*([+-]?\d+)?\}/gi, (_, mod) => mod ? `d20${mod}` : 'd20')
      .replace(/\{@dc\s+([^}]+)\}/gi, 'DC $1')

      .replace(/\{@spell\s+([^}|]+)(?:\|[^}|]+)?(?:\|([^}]+))?\}/gi, (_, name, disp) => disp || name)
      .replace(/\{@item\s+([^}|]+)(?:\|[^}|]+)?(?:\|([^}]+))?\}/gi, (_, name, disp) => disp || name)
      .replace(/\{@creature\s+([^}|]+)(?:\|[^}|]+)?(?:\|([^}]+))?\}/gi, (_, name, disp) => disp || name)
      .replace(/\{@condition\s+([^}|]+)(?:\|[^}|]+)?(?:\|([^}]+))?\}/gi, (_, name, disp) => disp || name)
      .replace(/\{@status\s+([^}|]+)(?:\|[^}|]+)?(?:\|([^}]+))?\}/gi, (_, name, disp) => disp || name)
      .replace(/\{@skill\s+([^}|]+)(?:\|[^}|]+)?(?:\|([^}]+))?\}/gi, (_, name, disp) => disp || name)
      .replace(/\{@sense\s+([^}|]+)(?:\|[^}|]+)?(?:\|([^}]+))?\}/gi, (_, name, disp) => disp || name)
      .replace(/\{@action\s+([^}|]+)(?:\|[^}|]+)?(?:\|([^}]+))?\}/gi, (_, name, disp) => disp || name)
      .replace(/\{@classFeature\s+([^}|]+)(?:\|[^}|]+)?(?:\|([^}]+))?\}/gi, (_, name, disp) => disp || name)
      .replace(/\{@table\s+([^}|]+)(?:\|[^}|]+)?(?:\|([^}]+))?\}/gi, (_, name, disp) => disp || name)
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

  // Recharge normalization
  str = str.replace(/\bRecharges\s*([2-5])(?!\s*[-–\d])\b/gi, 'Recharge $1-6');
  str = str.replace(/\bRecharge\s*([2-5])(?!\s*[-–\d])\b/gi, 'Recharge $1-6');

  // Format raw attack codes at beginning of lines or after punctuation
  // 1. Classic 5e weapons: mw, rw, ms, rs, etc.
  str = str.replace(/(^|[.\n]\s*)mw,rw\s+([+-]?\d+)\s*to\s*hit\b/gi, '$1Melee or Ranged Weapon Attack: +$2 to hit');
  str = str.replace(/(^|[.\n]\s*)ms,rs\s+([+-]?\d+)\s*to\s*hit\b/gi, '$1Melee or Ranged Spell Attack: +$2 to hit');
  str = str.replace(/(^|[.\n]\s*)mw,rs\s+([+-]?\d+)\s*to\s*hit\b/gi, '$1Melee Weapon or Ranged Spell Attack: +$2 to hit');
  str = str.replace(/(^|[.\n]\s*)mw\s+([+-]?\d+)\s*to\s*hit\b/gi, '$1Melee Weapon Attack: +$2 to hit');
  str = str.replace(/(^|[.\n]\s*)rw\s+([+-]?\d+)\s*to\s*hit\b/gi, '$1Ranged Weapon Attack: +$2 to hit');
  str = str.replace(/(^|[.\n]\s*)ms\s+([+-]?\d+)\s*to\s*hit\b/gi, '$1Melee Spell Attack: +$2 to hit');
  str = str.replace(/(^|[.\n]\s*)rs\s+([+-]?\d+)\s*to\s*hit\b/gi, '$1Ranged Spell Attack: +$2 to hit');
  str = str.replace(/(^|[.\n]\s*)mp,rp\s+([+-]?\d+)\s*to\s*hit\b/gi, '$1Melee or Ranged Power Attack: +$2 to hit');
  str = str.replace(/(^|[.\n]\s*)mp\s+([+-]?\d+)\s*to\s*hit\b/gi, '$1Melee Power Attack: +$2 to hit');
  str = str.replace(/(^|[.\n]\s*)rp\s+([+-]?\d+)\s*to\s*hit\b/gi, '$1Ranged Power Attack: +$2 to hit');

  // 2. Modern 2024 / 5.5e attack rolls: m 14, reach / r 8, range / m,r 5, reach
  str = str.replace(/(^|[.\n]\s*)m,r\s+([+-]?\d+),\s*(reach|range)/gi, '$1Melee or Ranged Attack Roll: +$2, $3');
  str = str.replace(/(^|[.\n]\s*)m\s+([+-]?\d+),\s*(reach)/gi, '$1Melee Attack Roll: +$2, $3');
  str = str.replace(/(^|[.\n]\s*)r\s+([+-]?\d+),\s*(range)/gi, '$1Ranged Attack Roll: +$2, $3');

  // Clean double spaces
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
      // 1. Tables
      if (item.type === 'table' || (item.rows && item.colLabels)) {
        result.push({
          type: 'table',
          caption: item.caption ? clean5eTags(item.caption) : null,
          colLabels: (item.colLabels || []).map(l => clean5eTags(String(l))),
          rows: (item.rows || []).map(row => 
            Array.isArray(row) 
              ? row.map(cell => clean5eTags(typeof cell === 'object' && cell !== null ? (cell.roll ? `${cell.roll.min}-${cell.roll.max}` : JSON.stringify(cell)) : String(cell)))
              : [clean5eTags(String(row))]
          )
        });
      }
      // 2. Lists
      else if (item.type === 'list' || item.items) {
        result.push({
          type: 'list',
          items: cleanEntries(item.items || [])
        });
      }
      // 3. Insets
      else if (item.type === 'inset') {
        result.push({
          type: 'inset',
          name: clean5eTags(item.name || ''),
          entries: cleanEntries(item.entries || [])
        });
      }
      // 4. Nested named entries (e.g. sub-actions like Breath Weapons, Eye Rays)
      else if (item.entries) {
        result.push({
          name: clean5eTags(item.name || ''),
          entries: cleanEntries(item.entries)
        });
      }
      // 5. Single entry
      else if (item.entry) {
        result.push({
          name: clean5eTags(item.name || ''),
          entries: [clean5eTags(item.entry)]
        });
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

module.exports = {
  fetchJson,
  clean5eTags,
  cleanEntries,
  cleanObjectDeep
};

