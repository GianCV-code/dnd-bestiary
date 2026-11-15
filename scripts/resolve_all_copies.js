import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BESTIARY_PATH = path.resolve(__dirname, '../public/data/bestiary.json');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

const atkPrefixMap = {
  'mw,rw': 'Melee or Ranged Weapon Attack',
  'ms,rs': 'Melee or Ranged Spell Attack',
  'm,r': 'Melee or Ranged Attack',
  'mp,rp': 'Melee or Ranged Power Attack',
  'mw,rs': 'Melee Weapon or Ranged Spell Attack',
  'mw': 'Melee Weapon Attack',
  'rw': 'Ranged Weapon Attack',
  'ms': 'Melee Spell Attack',
  'rs': 'Ranged Spell Attack',
  'mp': 'Melee Power Attack',
  'rp': 'Ranged Power Attack',
  'm': 'Melee Attack',
  'r': 'Ranged Attack'
};

function cleanTextString(text) {
  if (!text || typeof text !== 'string') return text;
  let str = text;

  // Limpiar restos en español
  str = str
    .replace(/Ataque\s*con\s*arma\s*cuerpo\s*a\s*cuerpo\s*o\s*a\s*distancia\s*:\s*/gi, 'Melee or Ranged Weapon Attack: ')
    .replace(/Ataque\s*de\s*conjuro\s*cuerpo\s*a\s*cuerpo\s*o\s*a\s*distancia\s*:\s*/gi, 'Melee or Ranged Spell Attack: ')
    .replace(/Ataque\s*cuerpo\s*a\s*cuerpo\s*o\s*a\s*distancia\s*:\s*/gi, 'Melee or Ranged Attack: ')
    .replace(/Ataque\s*de\s*poder\s*cuerpo\s*a\s*cuerpo\s*o\s*a\s*distancia\s*:\s*/gi, 'Melee or Ranged Power Attack: ')
    .replace(/Ataque\s*con\s*arma\s*cuerpo\s*a\s*cuerpo\s*:\s*/gi, 'Melee Weapon Attack: ')
    .replace(/Ataque\s*con\s*arma\s*a\s*distancia\s*:\s*/gi, 'Ranged Weapon Attack: ')
    .replace(/Ataque\s*de\s*conjuro\s*cuerpo\s*a\s*cuerpo\s*:\s*/gi, 'Melee Spell Attack: ')
    .replace(/Ataque\s*de\s*conjuro\s*a\s*distancia\s*:\s*/gi, 'Ranged Spell Attack: ')
    .replace(/Ataque\s*cuerpo\s*a\s*cuerpo\s*:\s*/gi, 'Melee Attack: ')
    .replace(/Ataque\s*a\s*distancia\s*:\s*/gi, 'Ranged Attack: ')
    .replace(/Ataque\s*\(\s*([^)]+)\s*\)\s*:\s*/gi, 'Attack ($1): ')
    .replace(/Salvaci[oó]n\s*de\s*Fuerza\s*(?:\(Strength\))?\s*:\s*/gi, 'Strength Saving Throw: ')
    .replace(/Salvaci[oó]n\s*de\s*Destreza\s*(?:\(Dexterity\))?\s*:\s*/gi, 'Dexterity Saving Throw: ')
    .replace(/Salvaci[oó]n\s*de\s*Constituci[oó]n\s*(?:\(Constitution\))?\s*:\s*/gi, 'Constitution Saving Throw: ')
    .replace(/Salvaci[oó]n\s*de\s*Inteligencia\s*(?:\(Intelligence\))?\s*:\s*/gi, 'Intelligence Saving Throw: ')
    .replace(/Salvaci[oó]n\s*de\s*Sabidur[ií]a\s*(?:\(Wisdom\))?\s*:\s*/gi, 'Wisdom Saving Throw: ')
    .replace(/Salvaci[oó]n\s*de\s*Carisma\s*(?:\(Charisma\))?\s*:\s*/gi, 'Charisma Saving Throw: ')
    .replace(/Salvaci[oó]n\s*de\s*([a-zA-Záéíóú]+)\s*\(([^)]+)\)\s*:\s*/gi, '$2 Saving Throw: ')
    .replace(/Salvaci[oó]n\s*de\s*([a-zA-Záéíóú]+)\s*:\s*/gi, '$1 Saving Throw: ')
    .replace(/Salvaci[oó]n\s*\(([^)]+)\)\s*:\s*/gi, 'Saving Throw ($1): ')
    .replace(/Salvaci[oó]n\s*:\s*/gi, 'Saving Throw: ')
    .replace(/\bCD\s*(\d+)/gi, 'DC $1')
    .replace(/\bCD\s*equals\b/gi, 'DC equals')
    .replace(/\b(?:tu\s*modificador\s*de\s*ataque\s*de\s*conjuro|tu\s*ataque\s*de\s*conjuro)\b/gi, 'your spell attack modifier')
    .replace(/\b(?:tu\s*CD\s*de\s*salvaci[oó]n(?:\s*de\s*conjuros)?)\b/gi, 'your spell save DC');

  // Prefijos duplicados
  str = str.replace(
    /(?:^|(?<=[:.\n•\-]\s*))\b(mw,rw|ms,rs|m,r|mp,rp|mw,rs|mw|rw|ms|rs|mp|rp|m|r)\s+(?:Melee\s+or\s+Ranged\s+(?:Weapon\s+|Spell\s+)?Attack|Melee\s+(?:Weapon\s+|Spell\s+)?Attack|Ranged\s+(?:Weapon\s+|Spell\s+)?Attack|Attack)\s*:\s*([+-]?\s*\d+)?\s*(?:to\s*hit|para\s*impactar)?\s*,?\s*/gi,
    (match, tag, bonus) => {
      const label = atkPrefixMap[tag.toLowerCase()];
      if (bonus) {
        const cleanBonus = bonus.replace(/\s+/g, '');
        const b = (cleanBonus.startsWith('+') || cleanBonus.startsWith('-')) ? cleanBonus : `+${cleanBonus}`;
        return `${label}: ${b} to hit, `;
      }
      return `${label}: `;
    }
  );

  // Automatic hit
  str = str.replace(
    /(?:^|(?<=[:.\n•\-]\s*))\b(mw,rw|ms,rs|m,r|mp,rp|mw,rs|mw|rw|ms|rs|mp|rp|m|r)\s+(?:automatic|automático)\s+hit\s*,?\s*/gi,
    (match, tag) => `${atkPrefixMap[tag.toLowerCase()]}: Automatic hit, `
  );

  // PB o dynamic modifier
  str = str.replace(
    /(?:^|(?<=[:.\n•\-]\s*))\b(mw,rw|ms,rs|m,r|mp,rp|mw,rs|mw|rw|ms|rs|mp|rp|m|r)\s+(your\s+spell\s+attack\s+modifier|PB(?:\s*[+-]\s*\d+)?)\s*(?:to\s*hit|para\s*impactar)?\s*,?\s*/gi,
    (match, tag, mod) => `${atkPrefixMap[tag.toLowerCase()]}: ${mod} to hit, `
  );

  // Prefijos compuestos o de 2 letras con número
  str = str.replace(
    /(?:^|(?<=[:.\n•\-]\s*))\b(mw,rw|ms,rs|m,r|mp,rp|mw,rs|mw|rw|ms|rs|mp|rp)\s*([+-]?\s*\d+)\s*(?:to\s*hit|para\s*impactar)?\s*,?\s*/gi,
    (match, tag, bonus) => {
      const label = atkPrefixMap[tag.toLowerCase()];
      if (!label) return match;
      const cleanBonus = bonus.replace(/\s+/g, '');
      const b = (cleanBonus.startsWith('+') || cleanBonus.startsWith('-')) ? cleanBonus : `+${cleanBonus}`;
      return `${label}: ${b} to hit, `;
    }
  );

  // Prefijos simples m o r con número
  str = str.replace(
    /(?:^|(?<=[:.\n•\-]\s*))\b(m|r)\s*([+-]?\s*\d+)\s*(?:to\s*hit|para\s*impactar)?\s*,?\s*/gi,
    (match, tag, bonus) => {
      const label = atkPrefixMap[tag.toLowerCase()];
      if (!label) return match;
      const cleanBonus = bonus.replace(/\s+/g, '');
      const b = (cleanBonus.startsWith('+') || cleanBonus.startsWith('-')) ? cleanBonus : `+${cleanBonus}`;
      return `${label}: ${b} to hit, `;
    }
  );

  // Shorthand simple seguido de coma o reach/range/target
  str = str.replace(
    /(?:^|(?<=[:.\n•\-]\s*))\b(mw,rw|ms,rs|m,r|mp,rp|mw,rs|mw|rw|ms|rs|mp|rp|m|r)\s*,\s*/gi,
    (match, tag) => `${atkPrefixMap[tag.toLowerCase()]}: `
  );
  str = str.replace(
    /^(mw,rw|ms,rs|m,r|mp,rp|mw,rs|mw|rw|ms|rs|mp|rp|m|r)\s+(?=(?:reach|range|one\b|each\b|all\b|the\b))/gi,
    (match, tag) => `${atkPrefixMap[tag.toLowerCase()]}: `
  );

  // Normalizar "+X para impactar" a "+X to hit"
  str = str.replace(/([+-]?\d+)\s+para\s+impactar\b/gi, '$1 to hit');

  // Alcances y objetivos
  str = str
    .replace(/\balcance\s*(\d+\s*(?:ft\.?|pies|m\.?))\s*(?:or|o)\s*rango\s*([\d\/]+\s*(?:ft\.?|pies|m\.?))/gi, 'reach $1 or range $2')
    .replace(/\balcance\s*(\d+\s*(?:ft\.?|pies|m\.?))/gi, 'reach $1')
    .replace(/\brango\s*([\d\/]+\s*(?:ft\.?|pies|m\.?))/gi, 'range $1')
    .replace(/\bun\s+objetivo\b/gi, 'one target')
    .replace(/\buna\s+criatura\b/gi, 'one creature')
    .replace(/\bdos\s+objetivos\b/gi, 'two targets')
    .replace(/\bcada\s+criatura\b/gi, 'each creature');

  // Impacto, Fallo y Salvaciones
  const isSavingThrow = /saving throw|salvaci[oó]n/i.test(str);
  str = str
    .replace(/\bImpacto:\s*/gi, 'Hit: ')
    .replace(/\bFallo:\s*/gi, isSavingThrow ? 'Failure: ' : 'Miss: ')
    .replace(/(?:^|\s|[.,;])(?:Éxito|Exito):\s*/gi, ' Success: ')
    .replace(/\bPrimer\s+Fallo:\s*/gi, 'First Failure: ')
    .replace(/\bSegundo\s+Fallo:\s*/gi, 'Second Failure: ')
    .replace(/\bFallo\s+o\s+[EÉ]xito:\s*/gi, 'Failure or Success: ')
    .replace(/\bFallo\s+por\s+(\d+)\s+o\s+m[aá]s:\s*/gi, 'Failure by $1 or more: ')
    .replace(/\bHalf damage\b/gi, 'half damage')
    .replace(/\bmitad\s+de\s+daño\b/gi, 'half damage')
    .replace(/\bsi\s+falla\s+la\s+salvaci[oó]n\b/gi, 'on a failed save')
    .replace(/\bsi\s+tiene\s+[eé]xito\s+en\s+la\s+salvaci[oó]n\b/gi, 'on a successful save')
    .replace(/\b\(Recarga\s*([0-9–-]+)\)/gi, '(Recharge $1)')
    .replace(/\bRecarga\s*([0-9–-]+)/gi, 'Recharge $1')
    .replace(/\b\(Recarga\)/gi, '(Recharge)')
    .replace(/\bRecarga\b/gi, 'Recharge')
    .replace(/,\s*,/g, ',')
    .replace(/:\s*:/g, ':');

  return str.replace(/\s{2,}/g, ' ').trim();
}

function cleanEntries(entries) {
  if (!entries) return entries;
  if (typeof entries === 'string') return cleanTextString(entries);
  if (Array.isArray(entries)) {
    const merged = [];
    for (let i = 0; i < entries.length; i++) {
      const item = entries[i];
      // Si el elemento es un prefijo abreviado suelto (ej. 'mw' en Werewolf Ravager)
      if (typeof item === 'string' && /^(mw,rw|ms,rs|m,r|mp,rp|mw,rs|mw|rw|ms|rs|mp|rp|m|r)$/i.test(item.trim()) && i + 1 < entries.length && typeof entries[i + 1] === 'string') {
        const next = entries[i + 1];
        merged.push(cleanTextString(`${item} ${next}`));
        i++;
      } else {
        merged.push(cleanEntries(item));
      }
    }
    return merged;
  }
  if (typeof entries === 'object') {
    const res = { ...entries };
    if (res.name) res.name = cleanTextString(res.name);
    if (res.entry) res.entry = cleanTextString(res.entry);
    if (res.entries) res.entries = cleanEntries(res.entries);
    if (res.items) res.items = cleanEntries(res.items);
    return res;
  }
  return entries;
}

async function masterResolve() {
  console.log('--- Step 1: Loading Bestiary ---');
  const raw = JSON.parse(fs.readFileSync(BESTIARY_PATH, 'utf8'));
  console.log(`Loaded ${raw.length} creatures from bestiary.`);

  // Mapa de criaturas base completamente definidas
  const baseMap = new Map();
  raw.forEach(c => {
    const key = `${c.name.toLowerCase()}__${(c.source || '').toLowerCase()}`;
    if (!baseMap.has(key)) baseMap.set(key, c);
    if (!baseMap.has(c.name.toLowerCase())) baseMap.set(c.name.toLowerCase(), c);
  });

  // Step 2: Fetch 5eTools Index and extract all _copy definitions
  console.log('\n--- Step 2: Fetching 5eTools Official Index ---');
  const index = await fetchJson('https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data/bestiary/index.json');
  const files = Object.entries(index);
  console.log(`Fetched index with ${files.length} books.`);

  const copyMap = new Map(); // key -> _copy

  const batchSize = 15;
  for (let i = 0; i < files.length; i += batchSize) {
    const chunk = files.slice(i, i + batchSize);
    await Promise.all(chunk.map(async ([code, filename]) => {
      try {
        const url = `https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data/bestiary/${filename}`;
        const data = await fetchJson(url);
        (data.monster || []).forEach(m => {
          if (m._copy) {
            const key = `${m.name.toLowerCase()}__${(m.source || code).toLowerCase()}`;
            copyMap.set(key, m._copy);
            if (!copyMap.has(m.name.toLowerCase())) {
              copyMap.set(m.name.toLowerCase(), m._copy);
            }
          }
        });
      } catch (e) {
        // ignore
      }
    }));
  }

  // 3PP sources that use _copy
  console.log('\n--- Step 3: Fetching 3PP _copy collections (Where Evil Lives, Dungeons of Drakkenheim) ---');
  const thirdPartyWithCopies = [
    'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/MCDM%20Productions%3B%20Where%20Evil%20Lives.json',
    'https://raw.githubusercontent.com/TheGiddyLimit/homebrew/master/collection/Ghostfire%20Gaming%3B%20Dungeons%20of%20Drakkenheim.json'
  ];

  for (const url of thirdPartyWithCopies) {
    try {
      const data = await fetchJson(url);
      (data.monster || []).forEach(m => {
        if (m._copy) {
          const key = `${m.name.toLowerCase()}__${(m.source || '').toLowerCase()}`;
          copyMap.set(key, m._copy);
          if (!copyMap.has(m.name.toLowerCase())) {
            copyMap.set(m.name.toLowerCase(), m._copy);
          }
        }
      });
    } catch (e) {
      console.warn('Could not fetch 3PP copy collection:', url);
    }
  }

  console.log(`Total _copy definitions mapped: ${copyMap.size}`);

  // Step 4: Resolve and repair creatures
  console.log('\n--- Step 4: Resolving and Repairing Bestiary Creatures ---');
  let repairedCount = 0;
  let prunedCount = 0;
  const filteredCreatures = [];

  for (const c of raw) {
    // 1. Check if it's completely hollow (0 actions, 0 traits, 0 bonus, 0 reactions, 0 spells, HP 10, AC 10)
    const hasActions = c.action && c.action.length > 0;
    const hasTraits = c.trait && c.trait.length > 0;
    const hasBonus = c.bonus && c.bonus.length > 0;
    const hasReactions = c.reaction && c.reaction.length > 0;
    const hasSpells = c.spellcasting && c.spellcasting.length > 0;
    const isTotallyEmpty = !hasActions && !hasTraits && !hasBonus && !hasReactions && !hasSpells;

    // Check if it's a _copy creature that needs stat resolution
    const key = `${c.name.toLowerCase()}__${(c.source || '').toLowerCase()}`;
    let copyDef = copyMap.get(key) || copyMap.get(c.name.toLowerCase());

    if (copyDef) {
      // Chained copy resolution (ej. Arrigal -> Vistana Assassin -> Assassin)
      const visited = new Set();
      let currentCopy = copyDef;
      let finalBase = null;

      while (currentCopy && !visited.has(currentCopy.name.toLowerCase())) {
        visited.add(currentCopy.name.toLowerCase());
        const baseKey = `${currentCopy.name.toLowerCase()}__${(currentCopy.source || '').toLowerCase()}`;
        const candidate = baseMap.get(baseKey) || baseMap.get(currentCopy.name.toLowerCase());

        if (candidate && (candidate.hp !== 10 || candidate.ac !== 10 || (candidate.action && candidate.action.length > 0))) {
          finalBase = candidate;
          break;
        }

        // If the candidate is also a copy, follow the chain
        const nextKey = `${currentCopy.name.toLowerCase()}__${(currentCopy.source || '').toLowerCase()}`;
        currentCopy = copyMap.get(nextKey) || copyMap.get(currentCopy.name.toLowerCase());
      }

      const base = finalBase;

      if (base) {
        // Inherit missing / default stats from base
        if (c.hp === 10 && base.hp !== 10) {
          c.hp = base.hp;
          c.hpFormula = base.hpFormula;
        }
        if (c.ac === 10 && base.ac !== 10) {
          c.ac = base.ac;
          c.acText = base.acText;
        }
        if (c.speed && c.speed.walk === 0 && !c.speed.fly && !c.speed.swim && !c.speed.climb && !c.speed.burrow) {
          if (base.speed && (base.speed.walk > 0 || base.speed.fly > 0 || base.speed.swim > 0)) {
            c.speed = { ...base.speed };
          }
        }
        // Inherit ability scores if all are 10
        if (c.str === 10 && c.dex === 10 && c.con === 10 && c.int === 10 && c.wis === 10 && c.cha === 10) {
          c.str = base.str;
          c.dex = base.dex;
          c.con = base.con;
          c.int = base.int;
          c.wis = base.wis;
          c.cha = base.cha;
        }
        // Inherit actions if empty
        if (!hasActions && base.action && base.action.length > 0) {
          c.action = base.action.map(a => ({ name: a.name, entries: cleanEntries(a.entries) }));
        }
        // Inherit traits if empty
        if (!hasTraits && base.trait && base.trait.length > 0) {
          c.trait = base.trait.map(t => ({ name: t.name, entries: cleanEntries(t.entries) }));
        }
        // Inherit bonus if empty
        if (!hasBonus && base.bonus && base.bonus.length > 0) {
          c.bonus = base.bonus.map(b => ({ name: b.name, entries: cleanEntries(b.entries) }));
        }
        // Inherit reactions if empty
        if (!hasReactions && base.reaction && base.reaction.length > 0) {
          c.reaction = base.reaction.map(r => ({ name: r.name, entries: cleanEntries(r.entries) }));
        }
        // Inherit spellcasting if empty
        if (!hasSpells && base.spellcasting && base.spellcasting.length > 0) {
          c.spellcasting = base.spellcasting;
        }
        // Inherit senses, saves, skills, resistances
        if (c.senses === '—' && base.senses !== '—') c.senses = base.senses;
        if (c.languages === '—' && base.languages !== '—') c.languages = base.languages;
        if ((!c.immune || c.immune.length === 0) && base.immune && base.immune.length > 0) c.immune = [...base.immune];
        if ((!c.resist || c.resist.length === 0) && base.resist && base.resist.length > 0) c.resist = [...base.resist];
        if ((!c.conditionImmune || c.conditionImmune.length === 0) && base.conditionImmune && base.conditionImmune.length > 0) c.conditionImmune = [...base.conditionImmune];
        if ((!c.save || Object.keys(c.save).length === 0) && base.save && Object.keys(base.save).length > 0) c.save = { ...base.save };
        if ((!c.skill || Object.keys(c.skill).length === 0) && base.skill && Object.keys(base.skill).length > 0) c.skill = { ...base.skill };

        repairedCount++;
      }
    } else {
      // If no explicit _copy record, but creature is broken with default stats and has an exact base twin
      const isBroken = c.speed && c.speed.walk === 0 && !c.speed.fly && !c.speed.swim && !c.speed.climb && !c.speed.burrow && (c.hp === 10 || c.ac === 10);
      if (isBroken) {
        const base = baseMap.get(c.name.toLowerCase());
        if (base && base.id !== c.id) {
          if (c.hp === 10 && base.hp !== 10) { c.hp = base.hp; c.hpFormula = base.hpFormula; }
          if (c.ac === 10 && base.ac !== 10) { c.ac = base.ac; c.acText = base.acText; }
          if (base.speed && (base.speed.walk > 0 || base.speed.fly > 0 || base.speed.swim > 0)) {
            c.speed = { ...base.speed };
          }
          if (c.str === 10 && c.dex === 10 && c.con === 10 && c.int === 10 && c.wis === 10 && c.cha === 10) {
            c.str = base.str; c.dex = base.dex; c.con = base.con; c.int = base.int; c.wis = base.wis; c.cha = base.cha;
          }
          if (!hasActions && base.action && base.action.length > 0) {
            c.action = base.action.map(a => ({ name: a.name, entries: cleanEntries(a.entries) }));
          }
          if (!hasTraits && base.trait && base.trait.length > 0) {
            c.trait = base.trait.map(t => ({ name: t.name, entries: cleanEntries(t.entries) }));
          }
          repairedCount++;
        }
      }
    }

    // Sanitize entries
    ['action', 'bonus', 'reaction', 'legendary', 'mythic', 'trait'].forEach(prop => {
      if (Array.isArray(c[prop])) {
        c[prop] = c[prop].map(item => ({
          ...item,
          name: cleanTextString(item.name),
          entries: cleanEntries(item.entries)
        }));
      }
    });

    // Check if creature is still completely hollow and unusable
    const updatedHasActions = c.action && c.action.length > 0;
    const updatedHasTraits = c.trait && c.trait.length > 0;
    const updatedHasBonus = c.bonus && c.bonus.length > 0;
    const updatedHasReactions = c.reaction && c.reaction.length > 0;
    const updatedHasSpells = c.spellcasting && c.spellcasting.length > 0;
    if (!updatedHasActions && !updatedHasTraits && !updatedHasBonus && !updatedHasReactions && !updatedHasSpells && c.hp === 10 && c.ac === 10) {
      prunedCount++;
      continue; // Prune completely dead stub
    }

    filteredCreatures.push(c);
  }

  console.log(`\nRepaired ${repairedCount} _copy creatures.`);
  console.log(`Pruned ${prunedCount} completely empty/dead stubs.`);
  console.log(`Writing ${filteredCreatures.length} high-quality creatures to bestiary.json...`);
  fs.writeFileSync(BESTIARY_PATH, JSON.stringify(filteredCreatures, null, 2), 'utf8');
  console.log('Master resolution finished successfully!');
}

masterResolve();
