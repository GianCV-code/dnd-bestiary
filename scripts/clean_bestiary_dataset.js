import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BESTIARY_PATH = path.resolve(__dirname, '../public/data/bestiary.json');

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

  // 1. Limpiar restos de prefijos en español o generados en imports previos
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
    .replace(/Ataque\s*\(\s*mw\s*,\s*rw\s*\)\s*:\s*/gi, 'Melee or Ranged Weapon Attack: ')
    .replace(/Ataque\s*\(\s*ms\s*,\s*rs\s*\)\s*:\s*/gi, 'Melee or Ranged Spell Attack: ')
    .replace(/Ataque\s*\(\s*m\s*,\s*r\s*\)\s*:\s*/gi, 'Melee or Ranged Attack: ')
    .replace(/Ataque\s*\(\s*mp\s*,\s*rp\s*\)\s*:\s*/gi, 'Melee or Ranged Power Attack: ')
    .replace(/Ataque\s*\(\s*mw\s*\)\s*:\s*/gi, 'Melee Weapon Attack: ')
    .replace(/Ataque\s*\(\s*rw\s*\)\s*:\s*/gi, 'Ranged Weapon Attack: ')
    .replace(/Ataque\s*\(\s*ms\s*\)\s*:\s*/gi, 'Melee Spell Attack: ')
    .replace(/Ataque\s*\(\s*rs\s*\)\s*:\s*/gi, 'Ranged Spell Attack: ')
    .replace(/Ataque\s*\(\s*m\s*\)\s*:\s*/gi, 'Melee Attack: ')
    .replace(/Ataque\s*\(\s*r\s*\)\s*:\s*/gi, 'Ranged Attack: ')
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

  // Prefijo duplicado: ej. 'rs Ranged Spell Attack: 3 to hit...' o 'rw Attack: 4 to hit...'
  str = str.replace(
    /(?:^|(?<=[:.\n•\-]\s*))\b(mw,rw|ms,rs|m,r|mp,rp|mw,rs|mw|rw|ms|rs|mp|rp|m|r)\s+(?:Melee\s+or\s+Ranged\s+(?:Weapon\s+|Spell\s+)?Attack|Melee\s+(?:Weapon\s+|Spell\s+)?Attack|Ranged\s+(?:Weapon\s+|Spell\s+)?Attack|Attack)\s*:\s*([+-]?\d+)?\s*(?:to\s*hit|para\s*impactar)?\s*,?\s*/gi,
    (match, tag, bonus) => {
      const label = atkPrefixMap[tag.toLowerCase()];
      if (bonus) {
        const b = (bonus.startsWith('+') || bonus.startsWith('-')) ? bonus : `+${bonus}`;
        return `${label}: ${b} to hit, `;
      }
      return `${label}: `;
    }
  );

  // Automatic hit: ej. 'm automatic hit, reach 5 ft.'
  str = str.replace(
    /(?:^|(?<=[:.\n•\-]\s*))\b(mw,rw|ms,rs|m,r|mp,rp|mw,rs|mw|rw|ms|rs|mp|rp|m|r)\s+(?:automatic|automático)\s+hit\s*,?\s*/gi,
    (match, tag) => `${atkPrefixMap[tag.toLowerCase()]}: Automatic hit, `
  );

  // PB o your spell attack modifier: ej. 'mw PB + 3 to hit' o 'rs your spell attack modifier to hit'
  str = str.replace(
    /(?:^|(?<=[:.\n•\-]\s*))\b(mw,rw|ms,rs|m,r|mp,rp|mw,rs|mw|rw|ms|rs|mp|rp|m|r)\s+(your\s+spell\s+attack\s+modifier|PB(?:\s*[+-]\s*\d+)?)\s*(?:to\s*hit|para\s*impactar)?\s*,?\s*/gi,
    (match, tag, mod) => `${atkPrefixMap[tag.toLowerCase()]}: ${mod} to hit, `
  );

  // Número / bono a impactar: ej. 'mw +5 to hit', 'ms + 9 to hit', 'mw 6 to hit' o 'm,r 5, reach...'
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
    return entries.map(item => cleanEntries(item));
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

function runClean() {
  console.log('Loading bestiary from:', BESTIARY_PATH);
  const raw = JSON.parse(fs.readFileSync(BESTIARY_PATH, 'utf8'));
  console.log('Total creatures:', raw.length);

  let cleanedCreatures = 0;

  for (const c of raw) {
    // Secciones de acciones y rasgos
    ['action', 'bonus', 'reaction', 'legendary', 'mythic', 'trait'].forEach(prop => {
      if (Array.isArray(c[prop])) {
        c[prop] = c[prop].map(item => {
          const cleanedName = cleanTextString(item.name);
          const cleanedEntries = cleanEntries(item.entries);
          return {
            ...item,
            name: cleanedName,
            entries: cleanedEntries
          };
        });
      }
    });

    // Headers especiales
    if (c.legendaryHeader) c.legendaryHeader = cleanEntries(c.legendaryHeader);
    if (c.mythicHeader) c.mythicHeader = cleanEntries(c.mythicHeader);

    // Spellcasting
    if (Array.isArray(c.spellcasting)) {
      c.spellcasting = c.spellcasting.map(sc => {
        const cleaned = { ...sc };
        if (cleaned.name) cleaned.name = cleanTextString(cleaned.name);
        if (cleaned.headerEntries) cleaned.headerEntries = cleanEntries(cleaned.headerEntries);
        return cleaned;
      });
    }

    cleanedCreatures++;
  }

  console.log(`Finished processing ${cleanedCreatures} creatures.`);
  fs.writeFileSync(BESTIARY_PATH, JSON.stringify(raw, null, 2), 'utf8');
  console.log('Successfully wrote sanitized bestiary.json!');
}

runClean();
