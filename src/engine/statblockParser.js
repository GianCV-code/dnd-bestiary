/**
 * statblockParser.js
 * Utilidad táctica para analizar y estructurar texto libre de criaturas D&D 5e / 5.5e (5eTools)
 * Transforma strings en bruto en datos enriquecidos para el modelo de Tarjetas Modulares.
 */

export function clean5eTags(text) {
  if (!text || typeof text !== 'string') return '';
  let str = text;

  // Corregir artefactos previos conocidos
  str = str.replace(/dSalvaci[oó]n\s*\(([^)]+)\):/gi, 'Saving Throw ($1):');

  let prev = '';
  let iterations = 0;
  // Bucle para desenvolver etiquetas anidadas como {@b {@spell shield}}
  while (str !== prev && iterations < 6) {
    prev = str;
    iterations++;

    str = str
      .replace(/\{@actTrigger\}/gi, 'Trigger: ')
      .replace(/\{@actResponse(?:\s+[^}]+)?\}/gi, 'Response: ')
      
      .replace(/\{@actSave\s+(str|fue)[^}]*\}/gi, 'Strength Saving Throw: ')
      .replace(/\{@actSave\s+(dex|des)[^}]*\}/gi, 'Dexterity Saving Throw: ')
      .replace(/\{@actSave\s+(con)[^}]*\}/gi, 'Constitution Saving Throw: ')
      .replace(/\{@actSave\s+(int)[^}]*\}/gi, 'Intelligence Saving Throw: ')
      .replace(/\{@actSave\s+(wis|sab)[^}]*\}/gi, 'Wisdom Saving Throw: ')
      .replace(/\{@actSave\s+(cha|car)[^}]*\}/gi, 'Charisma Saving Throw: ')
      .replace(/\{@actSave\s+([^}]+)\}/gi, 'Saving Throw ($1): ')
      
      .replace(/\{@actSaveFail\s*1\}/gi, 'First Failure: ')
      .replace(/\{@actSaveFail\s*2\}/gi, 'Second Failure: ')
      .replace(/\{@actSaveFail(?:\s+[^}]+)?\}/gi, 'Failure: ')
      .replace(/\{@actSaveFailBy\s+([^}]+)\}/gi, 'Failure by $1 or more: ')
      .replace(/\{@actSaveSuccess\}/gi, 'Success: ')
      .replace(/\{@actSaveSuccessOrFail\}/gi, 'Failure or Success: ')

      .replace(/\{@atk\s+mw,rw\}/gi, 'Melee or Ranged Weapon Attack:')
      .replace(/\{@atk\s+ms,rs\}/gi, 'Melee or Ranged Spell Attack:')
      .replace(/\{@atk\s+m,r\}/gi, 'Melee or Ranged Attack:')
      .replace(/\{@atk\s+mp,rp\}/gi, 'Melee or Ranged Power Attack:')
      .replace(/\{@atk\s+mw,rs\}/gi, 'Melee Weapon or Ranged Spell Attack:')
      .replace(/\{@atk\s+mw\}/gi, 'Melee Weapon Attack:')
      .replace(/\{@atk\s+rw\}/gi, 'Ranged Weapon Attack:')
      .replace(/\{@atk\s+ms\}/gi, 'Melee Spell Attack:')
      .replace(/\{@atk\s+rs\}/gi, 'Ranged Spell Attack:')
      .replace(/\{@atkr\s+m\}|\{@atk\s+m\}/gi, 'Melee Attack:')
      .replace(/\{@atkr\s+r\}|\{@atk\s+r\}/gi, 'Ranged Attack:')
      .replace(/\{@atk\s+mp\}/gi, 'Melee Power Attack:')
      .replace(/\{@atk\s+rp\}/gi, 'Ranged Power Attack:')
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
        if (val === '5') return '(Recharge 5–6)';
        if (val === '4') return '(Recharge 4–6)';
        if (val === '3') return '(Recharge 3–6)';
        if (val === '2') return '(Recharge 2–6)';
        if (/^\d$/.test(val)) return `(Recharge ${val}–6)`;
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

  str = str
    .replace(/\b(Recarga|Recharge|Recharges)\s*([2-5])(?!\s*[-–\d])\b/gi, (m, word, num) => `Recharge ${num}–6`)
    .replace(/\bRecarga\s*([0-9–-]+)/gi, 'Recharge $1')
    .replace(/\bRecarga\b/gi, 'Recharge');

  return str.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Convierte un bloque de entrada (string, array u objeto complejo) en texto limpio estructurado
 */
export function extractEntryText(entries) {
  if (!entries) return '';
  if (typeof entries === 'string') return clean5eTags(entries);
  if (Array.isArray(entries)) {
    return entries.map(item => extractEntryText(item)).filter(Boolean).join('\n\n');
  }
  if (typeof entries === 'object') {
    const parts = [];
    if (entries.name) parts.push(`${clean5eTags(entries.name)}:`);
    if (entries.entry) parts.push(clean5eTags(entries.entry));
    if (entries.entries) parts.push(extractEntryText(entries.entries));
    if (entries.items) {
      const itemsText = entries.items.map(it => {
        if (typeof it === 'string') return `• ${clean5eTags(it)}`;
        if (it && it.name) return `• ${clean5eTags(it.name)}: ${extractEntryText(it.entry || it.entries)}`;
        return `• ${extractEntryText(it)}`;
      }).join('\n');
      parts.push(itemsText);
    }
    if (entries.rows && entries.colLabels) {
      const headers = entries.colLabels.map(clean5eTags).join(' | ');
      const rows = entries.rows.map(r => r.map(c => clean5eTags(String(c))).join(' | ')).join('\n');
      parts.push(`[${headers}]\n${rows}`);
    }
    return parts.filter(Boolean).join(' ');
  }
  return String(entries);
}

/**
 * Parsea una acción, acción adicional o reacción en campos tácticos para Tarjetas Modulares
 */
export function parseModularAction(action, defaultType = 'Action') {
  if (!action) return null;
  const name = clean5eTags(action.name || '');
  const rawText = extractEntryText(action.entries);

  // Es Multiattack
  const isMultiattack = /^multiattack/i.test(name) || /multiataque/i.test(name);
  if (isMultiattack) {
    return {
      name,
      isMultiattack: true,
      rawText
    };
  }

  // 1. Detección exhaustiva de tirada de ataque (+X to hit, 'm,r +5', 'mw 8', etc.)
  const atkMatch = rawText.match(
    /(?:(?:mw,rw|ms,rs|m,r|mp,rp|mw,rs|mw|rw|ms|rs|mp|rp|m|r)\s*([+-]?\d+))|(?:([+-]?\d+)\s*(?:to\s*hit|para\s*impactar))|(?:(?:Attack\s*Roll|Tirada\s*de\s*ataque|Ataque[a-záéíóú\s]*):\s*([+-]?\d+))|(?:(?:Ataque|Attack)[^:.]*:\s*([+-]\d+))/i
  );
  let atkBonus = null;
  if (atkMatch) {
    atkBonus = atkMatch[1] || atkMatch[2] || atkMatch[3] || atkMatch[4];
    if (atkBonus && !atkBonus.startsWith('+') && !atkBonus.startsWith('-')) {
      atkBonus = `+${atkBonus}`;
    }
  }

  // 2. Tipo de Ataque (reconocimiento preciso de ataques duales y tipos de daño)
  let atkType = defaultType;
  const isDual = /\b(?:mw,rw|m,r|ms,rs|mp,rp)\b/i.test(rawText) || 
                 /(?:cuerpo\s*a\s*cuerpo|melee).*?(?:distancia|ranged)/i.test(rawText) ||
                 /(?:reach|alcance).*?(?:or|o).*?(?:range|rango)/i.test(rawText);

  if (isDual) {
    if (/conjuro/i.test(rawText) || /spell/i.test(rawText) || /\bms,rs\b/i.test(rawText)) {
      atkType = 'Melee / Ranged Spell';
    } else if (/\bmw,rw\b/i.test(rawText) || /weapon/i.test(rawText) || /arma/i.test(rawText)) {
      atkType = 'Melee / Ranged Weapon';
    } else {
      atkType = 'Melee or Ranged';
    }
  } else if (/cuerpo\s*a\s*cuerpo/i.test(rawText) || /melee/i.test(rawText) || /^\s*mw\b/i.test(rawText) || /(?:^|\.\s*)\s*m\s*[+-]?\d+/i.test(rawText)) {
    if (/conjuro/i.test(rawText) || /spell/i.test(rawText) || /^\s*ms\b/i.test(rawText)) {
      atkType = 'Melee Spell';
    } else if (/weapon/i.test(rawText) || /arma/i.test(rawText) || /^\s*mw\b/i.test(rawText)) {
      atkType = 'Melee Weapon';
    } else {
      atkType = 'Melee Attack';
    }
  } else if (/a\s*distancia/i.test(rawText) || /ranged/i.test(rawText) || /^\s*rw\b/i.test(rawText) || /(?:^|\.\s*)\s*r\s*[+-]?\d+/i.test(rawText)) {
    if (/conjuro/i.test(rawText) || /spell/i.test(rawText) || /^\s*rs\b/i.test(rawText)) {
      atkType = 'Ranged Spell';
    } else if (/weapon/i.test(rawText) || /arma/i.test(rawText) || /^\s*rw\b/i.test(rawText)) {
      atkType = 'Ranged Weapon';
    } else {
      atkType = 'Ranged Attack';
    }
  }

  // Alcance / Rango (detección dual o simple)
  const dualReachMatch = rawText.match(/(?:reach|alcance)\s*(\d+\s*(?:ft\.?|pies|m\.?))\s*(?:or|o)\s*(?:range|rango)\s*([\d\/]+\s*(?:ft\.?|pies|m\.?))/i);
  let reach = null;
  if (dualReachMatch) {
    reach = `Reach ${dualReachMatch[1]} or Range ${dualReachMatch[2]}`;
  } else {
    const reachMatch = rawText.match(/(?:(?:reach|alcance)\s*(\d+\s*(?:ft\.?|pies|m\.?))|(?:range|rango)\s*([\d\/]+\s*(?:ft\.?|pies|m\.?)))/i);
    reach = reachMatch ? (reachMatch[1] ? `Reach ${reachMatch[1]}` : `Range ${reachMatch[2]}`) : null;
  }

  // Detección de recarga en el nombre o texto
  if (/recarga\s*[\d–-]+/i.test(name) || /recharge\s*[\d–-]+/i.test(name)) {
    atkType = atkType ? `${atkType} • Recharge` : 'Recharge';
  }

  // 3. Daño
  // Ejemplo: "Hit: 21 (3d10 + 5) piercing damage" o "Impacto: 7 (1d6 + 4) Slashing damage plus 14 (4d6) Psychic damage"
  const hitMatch = rawText.match(/(?:Hit:|Impacto:|Fallo:|Failure:)\s*(\d+)\s*(?:\(([^)]+)\))?(?:\s+([^.]+?)\s+damage)?/i);
  const avgDamage = hitMatch ? hitMatch[1] : null;
  const damageDice = hitMatch && hitMatch[2] ? hitMatch[2].trim() : null;
  let damageType = hitMatch && hitMatch[3] ? hitMatch[3].trim() : null;
  if (damageType && damageType.length > 20 && damageType.includes(',')) {
    damageType = 'Multiple';
  }

  // Daño adicional / secundario (ej. "plus 14 (4d6) fire damage")
  const plusMatch = rawText.match(/plus\s*(\d+)\s*(?:\(([^)]+)\))?\s*([a-zA-Záéíóú]+)?\s*damage/i);
  const plusDamage = plusMatch ? `${plusMatch[1]} (${plusMatch[2] || ''}) ${plusMatch[3] || ''}`.trim() : null;

  // 4. Salvación / CD
  let saveDC = null;
  let saveStat = null;
  const saveMatch = rawText.match(
    /(?:Salvaci[oó]n(?:\s+de)?\s+([a-zA-Záéíóú]+)[^:]*:\s*(?:CD|DC)\s*(\d+))|(?:(?:DC|CD)\s*(\d+)\s*(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma|Fuerza|Destreza|Constitución|Inteligencia|Sabiduría|Carisma|str|dex|con|int|wis|cha)?)|(?:(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma|Fuerza|Destreza|Constitución|Inteligencia|Sabiduría|Carisma)[^.]*?(?:CD|DC)\s*(\d+))|(?:escape\s*(?:DC|CD)\s*(\d+))/i
  );
  if (saveMatch) {
    if (saveMatch[1] && saveMatch[2]) {
      saveStat = saveMatch[1];
      saveDC = saveMatch[2];
    } else if (saveMatch[3]) {
      saveDC = saveMatch[3];
      saveStat = saveMatch[4];
    } else if (saveMatch[5] && saveMatch[6]) {
      saveStat = saveMatch[5];
      saveDC = saveMatch[6];
    } else if (saveMatch[7]) {
      saveDC = saveMatch[7];
      saveStat = 'Escape';
    }

    if (saveStat) {
      const s = saveStat.toLowerCase();
      if (s.startsWith('str') || s.startsWith('fue')) saveStat = 'STR';
      else if (s.startsWith('dex') || s.startsWith('des')) saveStat = 'DEX';
      else if (s.startsWith('con')) saveStat = 'CON';
      else if (s.startsWith('int')) saveStat = 'INT';
      else if (s.startsWith('wis') || s.startsWith('sab')) saveStat = 'WIS';
      else if (s.startsWith('cha') || s.startsWith('car')) saveStat = 'CHA';
    }
  }

  // 5. Condiciones Tácticas
  const conditions = [];
  if (/grappled/i.test(rawText) || /agarrad/i.test(rawText)) conditions.push('Grappled');
  if (/restrained/i.test(rawText) || /apresad/i.test(rawText)) conditions.push('Restrained');
  if (/prone/i.test(rawText) || /derribad/i.test(rawText)) conditions.push('Prone');
  if (/frightened/i.test(rawText) || /asustad/i.test(rawText)) conditions.push('Frightened');
  if (/paralyzed/i.test(rawText) || /paralizad/i.test(rawText)) conditions.push('Paralyzed');
  if (/poisoned/i.test(rawText) || /envenenad/i.test(rawText)) conditions.push('Poisoned');
  if (/stunned/i.test(rawText) || /aturdid/i.test(rawText)) conditions.push('Stunned');
  if (/blinded/i.test(rawText) || /cegad/i.test(rawText)) conditions.push('Blinded');
  if (/deafened/i.test(rawText) || /ensordecid/i.test(rawText)) conditions.push('Deafened');
  if (/incapacitated/i.test(rawText) || /incapacitad/i.test(rawText)) conditions.push('Incapacitated');

  // 6. Detección de Disparador / Trigger (Reacciones)
  let trigger = null;
  let response = null;
  const triggerMatch = rawText.match(/(?:Disparador:|Trigger:)\s*(.*?)(?=\s*(?:Respuesta:|Response:|\bSalvaci[oó]n\b|\bSaving Throw\b|\bFallo:|\bFailure:|\bImpacto:|\bHit:|$))/is);
  if (triggerMatch && triggerMatch[1].trim()) {
    trigger = triggerMatch[1].trim();
    const remaining = rawText
      .replace(/(?:Disparador:|Trigger:)\s*.*?(?=\s*(?:Respuesta:|Response:|\bSalvaci[oó]n\b|\bSaving Throw\b|\bFallo:|\bFailure:|\bImpacto:|\bHit:|$))/is, '')
      .replace(/^\s*(?:Respuesta:|Response:)\s*/i, '')
      .trim();
    response = remaining;
  }

  // Formato narrativo limpio para evitar 'm 8' o 'm,r +5' en bruto
  const narrativeText = formatActionNarrative(response || rawText);

  return {
    name,
    isMultiattack: false,
    atkBonus,
    atkType: atkType || reach || defaultType,
    reach,
    avgDamage,
    damageDice,
    damageType,
    plusDamage,
    saveDC,
    saveStat,
    conditions,
    trigger,
    response,
    narrativeText,
    rawText
  };
}

/**
 * Formatea y embellece la narrativa de combate para que el DM no lea abreviaturas crípticas como 'm,r +5' o 'mw 8'
 */
export function formatActionNarrative(text) {
  if (!text || typeof text !== 'string') return '';
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
    .replace(/Salvaci[oó]n\s*de\s*([a-zA-Záéíóú]+)\s*\(([^)]+)\)\s*:\s*CD\s*(\d+)/gi, '$2 Saving Throw: DC $3')
    .replace(/Salvaci[oó]n\s*de\s*([a-zA-Záéíóú]+)\s*:\s*CD\s*(\d+)/gi, '$1 Saving Throw: DC $2');

  // 2. Mapeo de prefijos abreviados de 5eTools como 'm,r +5, reach...' o 'mw 8 to hit...'
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
    'm': 'Melee Attack',
    'r': 'Ranged Attack',
    'mp': 'Melee Power Attack',
    'rp': 'Ranged Power Attack'
  };

  // Reemplazo para prefijos de 2 letras o compuestos (mw, rw, m,r, etc.)
  str = str.replace(
    /\b(mw,rw|ms,rs|m,r|mp,rp|mw,rs|mw|rw|ms|rs|mp|rp)\s*([+-]?\d+)\s*(?:to\s*hit|para\s*impactar)?\s*,?\s*/gi,
    (match, tag, bonus) => {
      const label = atkPrefixMap[tag.toLowerCase()];
      if (!label) return match;
      const b = (bonus.startsWith('+') || bonus.startsWith('-')) ? bonus : `+${bonus}`;
      return `${label}: ${b} to hit, `;
    }
  );

  // Reemplazo para m o r simples (requiere delimitador o inicio para evitar falsos positivos con unidades)
  str = str.replace(
    /(?:^|(?<=[:.\n•\-]\s*))\b(m|r)\s*([+-]?\d+)\s*(?:to\s*hit|para\s*impactar)?\s*,?\s*/gi,
    (match, tag, bonus) => {
      const label = atkPrefixMap[tag.toLowerCase()];
      if (!label) return match;
      const b = (bonus.startsWith('+') || bonus.startsWith('-')) ? bonus : `+${bonus}`;
      return `${label}: ${b} to hit, `;
    }
  );

  // Normalizar "+X para impactar" a "+X to hit"
  str = str.replace(/([+-]?\d+)\s+para\s+impactar\b/gi, '$1 to hit');

  // 3. Normalizar alcance dual o simple
  str = str
    .replace(/\balcance\s*(\d+\s*(?:ft\.?|pies|m\.?))\s*(?:or|o)\s*rango\s*([\d\/]+\s*(?:ft\.?|pies|m\.?))/gi, 'reach $1 or range $2')
    .replace(/\balcance\s*(\d+\s*(?:ft\.?|pies|m\.?))/gi, 'reach $1')
    .replace(/\brango\s*([\d\/]+\s*(?:ft\.?|pies|m\.?))/gi, 'range $1');

  // 4. Objetivos frecuentes
  str = str
    .replace(/\bun\s+objetivo\b/gi, 'one target')
    .replace(/\buna\s+criatura\b/gi, 'one creature')
    .replace(/\bdos\s+objetivos\b/gi, 'two targets')
    .replace(/\bcada\s+criatura\b/gi, 'each creature');

  // 5. Impacto, Fallo y Salvaciones
  const isSavingThrow = /saving throw|salvaci[oó]n/i.test(str);
  str = str
    .replace(/\bImpacto:\s*/gi, 'Hit: ')
    .replace(/\bFallo:\s*/gi, isSavingThrow ? 'Failure: ' : 'Miss: ')
    .replace(/(?:^|\s|[.,;])(?:Éxito|Exito):\s*/gi, ' Success: ')
    .replace(/\bHalf damage\b/gi, 'half damage')
    .replace(/\bmitad\s+de\s+daño\b/gi, 'half damage')
    .replace(/\bsi\s+falla\s+la\s+salvaci[oó]n\b/gi, 'on a failed save')
    .replace(/\bsi\s+tiene\s+[eé]xito\s+en\s+la\s+salvaci[oó]n\b/gi, 'on a successful save')
    .replace(/\bRecarga\s*([0-9–-]+)/gi, 'Recharge $1');

  return str.replace(/\s{2,}/g, ' ').trim();
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
