/**
 * statblockParser.js
 * Utilidad táctica para analizar y estructurar texto libre de criaturas D&D 5e / 5.5e
 * Transforma strings en bruto (5etools) en datos estructurados para Tarjetas Modulares.
 */

export function clean5eTags(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\{@recharge\s*(\d+)?\}/gi, (_, n) => `(Recarga ${n ? `${n}–6` : '6'})`)
    .replace(/\{@hit\s*([+-]?\d+)\}/gi, '$1')
    .replace(/\{@dc\s*(\d+)\}/gi, 'CD $1')
    .replace(/\{@damage\s*([^}]+)\}/gi, '$1')
    .replace(/\{@dice\s*([^}]+)\}/gi, '$1')
    .replace(/\{@condition\s*([^|}]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@creature\s*([^|}]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@spell\s*([^|}]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@skill\s*([^|}]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@item\s*([^|}]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@sense\s*([^|}]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@quickref\s*([^|}]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@b\s*([^}]+)\}/gi, '$1')
    .replace(/\{@i\s*([^}]+)\}/gi, '$1')
    .replace(/\{@[a-z]+\s*([^|}]+)(?:\|[^}]+)?\}/gi, '$1')
    .trim();
}

/**
 * Convierte un bloque de entrada (string o array) en texto limpio concatenado
 */
export function extractEntryText(entries) {
  if (!entries) return '';
  if (typeof entries === 'string') return clean5eTags(entries);
  if (Array.isArray(entries)) {
    return entries.map(item => {
      if (typeof item === 'string') return clean5eTags(item);
      if (item && item.entries) return extractEntryText(item.entries);
      if (item && item.items) return extractEntryText(item.items);
      return '';
    }).filter(Boolean).join(' ');
  }
  return '';
}

/**
 * Parsea una acción de criatura en campos tácticos para Tarjetas Modulares
 */
export function parseModularAction(action) {
  if (!action) return null;
  const name = clean5eTags(action.name || '');
  const rawText = extractEntryText(action.entries);

  // Es Multiattack
  const isMultiattack = /^multiattack/i.test(name) || /multiataque/i.test(name);
  if (isMultiattack) {
    return {
      name,
      isMultiattack: true,
      text: rawText
    };
  }

  // 1. Detección de tirada de ataque (+X to hit)
  // Ejemplos: "mw 8 to hit", "+8 to hit", "Melee Weapon Attack: +8 to hit", "Attack Roll: +8"
  const atkMatch = rawText.match(/(?:(?:mw|rw|ms|rs)\s*([+-]?\d+)\s*to\s*hit)|(?:([+-]?\d+)\s*to\s*hit)|(?:Attack\s*Roll:\s*([+-]?\d+))/i);
  let atkBonus = atkMatch ? (atkMatch[1] || atkMatch[2] || atkMatch[3]) : null;
  if (atkBonus && !atkBonus.startsWith('+') && !atkBonus.startsWith('-')) {
    atkBonus = `+${atkBonus}`;
  }

  // 2. Tipo de Ataque y Alcance
  let atkType = null;
  if (/^mw\b/i.test(rawText) || /melee\s+weapon/i.test(rawText) || /melee\s+attack/i.test(rawText)) {
    atkType = 'Cuerpo a cuerpo';
  } else if (/^rw\b/i.test(rawText) || /ranged\s+weapon/i.test(rawText) || /ranged\s+attack/i.test(rawText)) {
    atkType = 'A distancia';
  } else if (/^ms\b/i.test(rawText) || /melee\s+spell/i.test(rawText)) {
    atkType = 'Conjuro c.a.c.';
  } else if (/^rs\b/i.test(rawText) || /ranged\s+spell/i.test(rawText)) {
    atkType = 'Conjuro a distancia';
  }

  const reachMatch = rawText.match(/(?:reach\s*(\d+\s*ft\.?)|range\s*([\d\/]+\s*ft\.?))/i);
  let reach = reachMatch ? (reachMatch[1] ? `Alcance ${reachMatch[1]}` : `Rango ${reachMatch[2]}`) : null;

  // Detección de recarga en el nombre o texto
  if (/recarga\s*[\d–-]+/i.test(name)) {
    atkType = atkType ? `${atkType} • Recarga` : 'Recarga';
  }

  // 3. Detección de Daño
  // Ejemplo: "Hit: 21 (3d10 + 5) piercing damage" o "Hit: 4 (1d4 + 2) bludgeoning"
  const hitMatch = rawText.match(/Hit:\s*(\d+)\s*(?:\(([^)]+)\))?\s*([a-zA-Z]+)?\s*damage/i);
  const avgDamage = hitMatch ? hitMatch[1] : null;
  const damageDice = hitMatch && hitMatch[2] ? hitMatch[2].trim() : null;
  const damageType = hitMatch && hitMatch[3] ? hitMatch[3].trim() : null;

  // 4. Detección de Salvación / CD
  // Ejemplo: "DC 16 Strength saving throw", "escape DC 16", "saving throw of DC 15"
  const saveMatch = rawText.match(/(?:(?:DC|CD)\s*(\d+)\s*(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma|Fuerza|Destreza|Constitución|Inteligencia|Sabiduría|Carisma)?\s*saving\s*throw)|(?:escape\s*(?:DC|CD)\s*(\d+))/i);
  let saveDC = saveMatch ? (saveMatch[1] || saveMatch[3]) : null;
  let saveStat = null;
  if (saveMatch && saveMatch[2]) {
    const rawStat = saveMatch[2].toLowerCase();
    if (rawStat.startsWith('str') || rawStat.startsWith('fue')) saveStat = 'FUE';
    else if (rawStat.startsWith('dex') || rawStat.startsWith('des')) saveStat = 'DES';
    else if (rawStat.startsWith('con')) saveStat = 'CON';
    else if (rawStat.startsWith('int')) saveStat = 'INT';
    else if (rawStat.startsWith('wis') || rawStat.startsWith('sab')) saveStat = 'SAB';
    else if (rawStat.startsWith('cha') || rawStat.startsWith('car')) saveStat = 'CAR';
  } else if (saveMatch && saveMatch[3]) {
    saveStat = 'Escapar';
  }

  // 5. Detección de Condiciones Tácticas
  const conditions = [];
  if (/grappled/i.test(rawText) || /agarrad/i.test(rawText)) conditions.push('Agarrado (Grappled)');
  if (/restrained/i.test(rawText) || /apresad/i.test(rawText)) conditions.push('Apresado (Restrained)');
  if (/prone/i.test(rawText) || /derribad/i.test(rawText)) conditions.push('Derribado (Prone)');
  if (/frightened/i.test(rawText) || /asustad/i.test(rawText)) conditions.push('Asustado (Frightened)');
  if (/paralyzed/i.test(rawText) || /paralizad/i.test(rawText)) conditions.push('Paralizado (Paralyzed)');
  if (/poisoned/i.test(rawText) || /envenenad/i.test(rawText)) conditions.push('Envenenado (Poisoned)');
  if (/stunned/i.test(rawText) || /aturdid/i.test(rawText)) conditions.push('Aturdido (Stunned)');
  if (/blinded/i.test(rawText) || /cegad/i.test(rawText)) conditions.push('Cegado (Blinded)');

  // 6. Extracción de Efecto Táctico Secundario
  let tacticalEffect = null;
  const afterHitParts = rawText.split(/Hit:\s*\d+\s*(?:\([^)]+\))?\s*[a-zA-Z]*\s*damage[.,]?/i);
  if (afterHitParts.length > 1 && afterHitParts[1].trim()) {
    let eff = afterHitParts[1].trim();
    if (eff.startsWith('and ')) eff = eff.substring(4);
    tacticalEffect = eff.charAt(0).toUpperCase() + eff.slice(1);
  } else if (!atkBonus && (saveDC || conditions.length > 0)) {
    tacticalEffect = rawText;
  }

  return {
    name,
    isMultiattack: false,
    atkBonus,
    atkType: atkType || reach || 'Acción',
    reach,
    avgDamage,
    damageDice,
    damageType,
    saveDC,
    saveStat,
    conditions,
    tacticalEffect,
    rawText
  };
}

/**
 * Calcula bono de competencia según CR (compatible con 2014 y 2024)
 */
export function calculatePB(cr) {
  let numCr = 0;
  if (typeof cr === 'number') {
    numCr = cr;
  } else if (typeof cr === 'string') {
    const trimmed = cr.trim();
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      const num = parseFloat(parts[0]);
      const den = parseFloat(parts[1]);
      numCr = den ? num / den : 0;
    } else {
      numCr = parseFloat(trimmed) || 0;
    }
  }
  if (numCr < 5) return 2;
  if (numCr < 9) return 3;
  if (numCr < 13) return 4;
  if (numCr < 17) return 5;
  if (numCr < 21) return 6;
  if (numCr < 25) return 7;
  if (numCr < 29) return 8;
  return 9;
}
