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
 * Calcula el daño promedio de una expresión de dados (ej. '1d10 + 2' -> 7, '2d6' -> 7, '4d6 + 4' -> 18)
 */
export function calcDiceAverage(diceStr) {
  if (!diceStr || typeof diceStr !== 'string') return null;
  const match = diceStr.match(/^(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?/i);
  if (!match) return null;
  const count = parseInt(match[1], 10);
  const die = parseInt(match[2], 10);
  const sign = match[3] === '-' ? -1 : 1;
  const mod = match[4] ? parseInt(match[4], 10) * sign : 0;
  return Math.floor(count * (die + 1) / 2 + mod);
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
    const formatted = formatActionNarrative(rawText);
    return {
      name,
      isMultiattack: true,
      rawText: formatted,
      narrativeText: formatted
    };
  }

  // Detección de impacto automático
  const isAutoHit = /\bautomatic\s+hit\b/i.test(rawText) || /\bautomático\s+hit\b/i.test(rawText);

  // 1. Detección exhaustiva de tirada de ataque (+X to hit, 'm,r +5', 'mw 8', 'ms + 9', etc.)
  const atkMatch = rawText.match(
    /(?:(?:mw,rw|ms,rs|m,r|mp,rp|mw,rs|mw|rw|ms|rs|mp|rp|m|r)\s*([+-]?\s*\d+))|(?:([+-]?\s*\d+)\s*(?:to\s*hit|para\s*impactar))|(?:(?:Attack\s*Roll|Tirada\s*de\s*ataque|Ataque[a-záéíóú\s]*):\s*([+-]?\s*\d+))|(?:(?:Ataque|Attack)[^:.]*:\s*([+-]?\s*\d+))/i
  );
  let atkBonus = null;
  if (atkMatch) {
    const rawBonus = atkMatch[1] || atkMatch[2] || atkMatch[3] || atkMatch[4];
    if (rawBonus) {
      atkBonus = rawBonus.replace(/\s+/g, '');
      if (!atkBonus.startsWith('+') && !atkBonus.startsWith('-')) {
        atkBonus = `+${atkBonus}`;
      }
    }
  }

  // 2. Tipo de Ataque (reconocimiento preciso de ataques duales y tipos de daño)
  // Inspeccionamos la cabecera antes de "Hit:" para no confundir efectos narrativos posteriores
  const preHitText = rawText.split(/(?:Hit:|Impacto:|Fallo:|Failure:)/i)[0] || rawText;
  let atkType = defaultType;
  const isDual = /\b(?:mw,rw|m,r|ms,rs|mp,rp)\b/i.test(preHitText) || 
                 /(?:cuerpo\s*a\s*cuerpo|melee).*?(?:distancia|ranged)/i.test(preHitText) ||
                 /(?:distancia|ranged).*?(?:cuerpo\s*a\s*cuerpo|melee)/i.test(preHitText) ||
                 /(?:reach|alcance).*?(?:or|o).*?(?:range|rango)/i.test(preHitText);

  if (isDual) {
    if (/conjuro/i.test(preHitText) || /spell/i.test(preHitText) || /\bms,rs\b/i.test(preHitText)) {
      atkType = 'Melee / Ranged Spell';
    } else if (/\bmw,rw\b/i.test(preHitText) || /weapon/i.test(preHitText) || /arma/i.test(preHitText)) {
      atkType = 'Melee / Ranged Weapon';
    } else {
      atkType = 'Melee or Ranged';
    }
  } else {
    const isExplicitRanged = /(?:^|[:.\n•\-]\s*)\s*(?:ranged|a\s*distancia|rw\b|rs\b)/i.test(preHitText);
    const isExplicitMelee = /(?:^|[:.\n•\-]\s*)\s*(?:melee|cuerpo\s*a\s*cuerpo|mw\b|ms\b)/i.test(preHitText);

    if (isExplicitRanged && !isExplicitMelee) {
      if (/conjuro/i.test(preHitText) || /spell/i.test(preHitText) || /\brs\b/i.test(preHitText)) {
        atkType = 'Ranged Spell';
      } else if (/weapon/i.test(preHitText) || /arma/i.test(preHitText) || /\brw\b/i.test(preHitText)) {
        atkType = 'Ranged Weapon';
      } else {
        atkType = 'Ranged Attack';
      }
    } else if (isExplicitMelee && !isExplicitRanged) {
      if (/conjuro/i.test(preHitText) || /spell/i.test(preHitText) || /\bms\b/i.test(preHitText)) {
        atkType = 'Melee Spell';
      } else if (/weapon/i.test(preHitText) || /arma/i.test(preHitText) || /\bmw\b/i.test(preHitText)) {
        atkType = 'Melee Weapon';
      } else {
        atkType = 'Melee Attack';
      }
    } else if (/\breach\b|\balcance\b/i.test(preHitText) && !/\brange\b|\brango\b/i.test(preHitText)) {
      atkType = /spell|conjuro/i.test(preHitText) ? 'Melee Spell' : (/weapon|arma/i.test(preHitText) ? 'Melee Weapon' : 'Melee Attack');
    } else if (/\brange\b|\brango\b/i.test(preHitText) && !/\breach\b|\balcance\b/i.test(preHitText)) {
      atkType = /spell|conjuro/i.test(preHitText) ? 'Ranged Spell' : (/weapon|arma/i.test(preHitText) ? 'Ranged Weapon' : 'Ranged Attack');
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
  // Soporta:
  // a) "Hit: 21 (3d10 + 5) piercing damage"
  // b) "taking 63 (18d6) fire damage on a failed save" (salvaciones de área, alientos, etc.)
  // c) "Hit: 1d10 + 2 Bludgeoning damage" o "taking 8d6 fire damage" (sin promedio explícito)
  // d) "Hit: 4 piercing damage" (daño plano sin dados)
  let avgDamage = null;
  let damageDice = null;
  let damageType = null;

  const dmgPrefix = /(?:Hit:|Impacto:|Fallo:|Failure:|taking|takes|take|deals|deal|suffers|suffer|recibiendo|recibe|sufriendo|inflige)\s*/;

  const withDiceAvg = rawText.match(new RegExp(dmgPrefix.source + '(\\d+)\\s*\\(([^)]+)\\)(?:\\s+([^.]+?)\\s+damage)?', 'i'));
  if (withDiceAvg) {
    avgDamage = withDiceAvg[1];
    damageDice = withDiceAvg[2].trim();
    damageType = withDiceAvg[3] ? withDiceAvg[3].trim() : null;
  } else {
    const justDice = rawText.match(new RegExp(dmgPrefix.source + '(\\d+d\\d+(?:\\s*[+-]\\s*\\d+)?)(?:\\s+([^.]+?)\\s+damage)?', 'i'));
    if (justDice) {
      damageDice = justDice[1].trim();
      const calculated = calcDiceAverage(damageDice);
      avgDamage = calculated != null ? String(calculated) : null;
      damageType = justDice[2] ? justDice[2].trim() : null;
    } else {
      const flatDmg = rawText.match(new RegExp(dmgPrefix.source + '(\\d+)(?:\\s+([^.]+?)\\s+damage)?', 'i'));
      if (flatDmg) {
        avgDamage = flatDmg[1];
        damageDice = null;
        damageType = flatDmg[2] ? flatDmg[2].trim() : null;
      }
    }
  }

  if (damageType) {
    damageType = damageType
      .replace(/^de\s+daño\s+/i, '')
      .replace(/\s+damage$/i, '')
      .replace(/\s+on\s+a\s+failed\s+save.*/i, '')
      .replace(/\s+si\s+falla\s+la\s+salvaci[oó]n.*/i, '')
      .trim();
    if (damageType.length > 20 && (damageType.includes(',') || damageType.includes(' '))) {
      const firstWord = damageType.split(/[\s,]+/)[0];
      const validTypes = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'];
      damageType = validTypes.includes(firstWord.toLowerCase()) ? firstWord : 'Multiple';
    }
  }

  // Daño adicional / secundario (ej. "plus 14 (4d6) fire damage" o "plus 2d6 fire damage")
  let plusDamage = null;
  const plusWithDiceAvg = rawText.match(/plus\s*(\d+)\s*\(([^)]+)\)\s*([a-zA-Záéíóú]+)?\s*damage/i);
  if (plusWithDiceAvg) {
    plusDamage = `${plusWithDiceAvg[1]} (${plusWithDiceAvg[2].trim()}) ${plusWithDiceAvg[3] || ''}`.trim();
  } else {
    const plusJustDice = rawText.match(/plus\s*(\d+d\d+(?:\s*[+-]\s*\d+)?)\s*([a-zA-Záéíóú]+)?\s*damage/i);
    if (plusJustDice) {
      const pDice = plusJustDice[1].trim();
      const pAvg = calcDiceAverage(pDice);
      plusDamage = `${pAvg != null ? pAvg : ''} (${pDice}) ${plusJustDice[2] || ''}`.trim();
    } else {
      const plusFlat = rawText.match(/plus\s*(\d+)\s*([a-zA-Záéíóú]+)?\s*damage/i);
      if (plusFlat) {
        plusDamage = `${plusFlat[1]} ${plusFlat[2] || ''}`.trim();
      }
    }
  }

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
    isAutoHit,
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

  // Reemplazo para prefijos de 2 letras o compuestos con número / bono
  str = str.replace(
    /\b(mw,rw|ms,rs|m,r|mp,rp|mw,rs|mw|rw|ms|rs|mp|rp)\s*([+-]?\s*\d+)\s*(?:to\s*hit|para\s*impactar)?\s*,?\s*/gi,
    (match, tag, bonus) => {
      const label = atkPrefixMap[tag.toLowerCase()];
      if (!label) return match;
      const cleanBonus = bonus.replace(/\s+/g, '');
      const b = (cleanBonus.startsWith('+') || cleanBonus.startsWith('-')) ? cleanBonus : `+${cleanBonus}`;
      return `${label}: ${b} to hit, `;
    }
  );

  // Reemplazo para m o r simples con número / bono
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
    .replace(/\bPrimer\s+Fallo:\s*/gi, 'First Failure: ')
    .replace(/\bSegundo\s+Fallo:\s*/gi, 'Second Failure: ')
    .replace(/\bFallo\s+o\s+[EÉ]xito:\s*/gi, 'Failure or Success: ')
    .replace(/\bFallo\s+por\s+(\d+)\s+o\s+m[aá]s:\s*/gi, 'Failure by $1 or more: ')
    .replace(/\bHalf damage\b/gi, 'half damage')
    .replace(/\bmitad\s+de\s+daño\b/gi, 'half damage')
    .replace(/\bsi\s+falla\s+la\s+salvaci[oó]n\b/gi, 'on a failed save')
    .replace(/\bsi\s+tiene\s+[eé]xito\s+en\s+la\s+salvaci[oó]n\b/gi, 'on a successful save')
    .replace(/\bRecarga\s*([0-9–-]+)/gi, 'Recharge $1')
    .replace(/\bRecarga\b/gi, 'Recharge')
    .replace(/,\s*,/g, ',')
    .replace(/:\s*:/g, ':');

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
