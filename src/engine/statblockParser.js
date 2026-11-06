/**
 * statblockParser.js
 * Utilidad táctica para analizar y estructurar texto libre de criaturas D&D 5e / 5.5e (5eTools)
 * Transforma strings en bruto en datos enriquecidos para el modelo de Tarjetas Modulares.
 */

export function clean5eTags(text) {
  if (!text || typeof text !== 'string') return '';
  let str = text;

  // Corregir artefactos previos conocidos
  str = str.replace(/dSalvaci[oó]n\s*\(([^)]+)\):/gi, 'Salvación ($1):');

  let prev = '';
  let iterations = 0;
  // Bucle para desenvolver etiquetas anidadas como {@b {@spell shield}}
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

      .replace(/\{@recharge\s*([^}]+)?\}/gi, (_, n) => `(Recarga ${n ? n.trim() : '6'})`)
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
export function parseModularAction(action, defaultType = 'Acción') {
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

  // 1. Detección de tirada de ataque (+X to hit, para impactar o formato 2024 'm 8' / 'r 4')
  const atkMatch = rawText.match(
    /(?:(?:mw|rw|ms|rs)\s*([+-]?\d+)\s*(?:to\s*hit|para\s*impactar))|(?:([+-]?\d+)\s*(?:to\s*hit|para\s*impactar))|(?:(?:Attack\s*Roll|Tirada\s*de\s*ataque|Ataque[a-záéíóú\s]*):\s*([+-]?\d+))|(?:(?:^|\.\s*|\b)([mr])\s*([+-]?\d+)\s*,\s*(?:reach|range|alcance|rango))|(?:(?:Ataque|Attack)[^:.]*:\s*([+-]\d+))/i
  );
  let atkBonus = null;
  if (atkMatch) {
    atkBonus = atkMatch[1] || atkMatch[2] || atkMatch[3] || atkMatch[5] || atkMatch[6];
    if (atkBonus && !atkBonus.startsWith('+') && !atkBonus.startsWith('-')) {
      atkBonus = `+${atkBonus}`;
    }
  }

  // 2. Tipo de Ataque
  let atkType = defaultType;
  if (/cuerpo\s*a\s*cuerpo/i.test(rawText) || /melee/i.test(rawText) || /^mw\b/i.test(rawText) || /(?:^|\.\s*)m\s*[+-]?\d+/i.test(rawText)) {
    if (/conjuro/i.test(rawText) || /spell/i.test(rawText) || /^ms\b/i.test(rawText)) {
      atkType = 'Conjuro c.a.c.';
    } else {
      atkType = 'Cuerpo a cuerpo';
    }
  } else if (/a\s*distancia/i.test(rawText) || /ranged/i.test(rawText) || /^rw\b/i.test(rawText) || /(?:^|\.\s*)r\s*[+-]?\d+/i.test(rawText)) {
    if (/conjuro/i.test(rawText) || /spell/i.test(rawText) || /^rs\b/i.test(rawText)) {
      atkType = 'Conjuro distancia';
    } else {
      atkType = 'A distancia';
    }
  }

  // Alcance
  const reachMatch = rawText.match(/(?:(?:reach|alcance)\s*(\d+\s*(?:ft\.?|pies|m\.?))|(?:range|rango)\s*([\d\/]+\s*(?:ft\.?|pies|m\.?)))/i);
  let reach = reachMatch ? (reachMatch[1] ? `Alcance ${reachMatch[1]}` : `Rango ${reachMatch[2]}`) : null;

  // Detección de recarga en el nombre o texto
  if (/recarga\s*[\d–-]+/i.test(name) || /recharge\s*[\d–-]+/i.test(name)) {
    atkType = atkType ? `${atkType} • Recarga` : 'Recarga';
  }

  // 3. Daño
  // Ejemplo: "Hit: 21 (3d10 + 5) piercing damage" o "Impacto: 7 (1d6 + 4) Slashing damage plus 14 (4d6) Psychic damage"
  const hitMatch = rawText.match(/(?:Hit:|Impacto:|Fallo:)\s*(\d+)\s*(?:\(([^)]+)\))?\s*([a-zA-Záéíóú]+)?\s*damage/i);
  const avgDamage = hitMatch ? hitMatch[1] : null;
  const damageDice = hitMatch && hitMatch[2] ? hitMatch[2].trim() : null;
  const damageType = hitMatch && hitMatch[3] ? hitMatch[3].trim() : null;

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
      saveStat = 'Escapar';
    }

    if (saveStat) {
      const s = saveStat.toLowerCase();
      if (s.startsWith('str') || s.startsWith('fue')) saveStat = 'FUE';
      else if (s.startsWith('dex') || s.startsWith('des')) saveStat = 'DES';
      else if (s.startsWith('con')) saveStat = 'CON';
      else if (s.startsWith('int')) saveStat = 'INT';
      else if (s.startsWith('wis') || s.startsWith('sab')) saveStat = 'SAB';
      else if (s.startsWith('cha') || s.startsWith('car')) saveStat = 'CAR';
    }
  }

  // 5. Condiciones Tácticas
  const conditions = [];
  if (/grappled/i.test(rawText) || /agarrad/i.test(rawText)) conditions.push('Agarrado (Grappled)');
  if (/restrained/i.test(rawText) || /apresad/i.test(rawText)) conditions.push('Apresado (Restrained)');
  if (/prone/i.test(rawText) || /derribad/i.test(rawText)) conditions.push('Derribado (Prone)');
  if (/frightened/i.test(rawText) || /asustad/i.test(rawText)) conditions.push('Asustado (Frightened)');
  if (/paralyzed/i.test(rawText) || /paralizad/i.test(rawText)) conditions.push('Paralizado (Paralyzed)');
  if (/poisoned/i.test(rawText) || /envenenad/i.test(rawText)) conditions.push('Envenenado (Poisoned)');
  if (/stunned/i.test(rawText) || /aturdid/i.test(rawText)) conditions.push('Aturdido (Stunned)');
  if (/blinded/i.test(rawText) || /cegad/i.test(rawText)) conditions.push('Cegado (Blinded)');
  if (/deafened/i.test(rawText) || /ensordecid/i.test(rawText)) conditions.push('Ensordecido (Deafened)');
  if (/incapacitated/i.test(rawText) || /incapacitad/i.test(rawText)) conditions.push('Incapacitado (Incapacitated)');

  // 6. Detección de Disparador / Trigger (Reacciones)
  let trigger = null;
  let response = null;
  const triggerMatch = rawText.match(/(?:Disparador:|Trigger:)\s*(.*?)\s*(?:Respuesta:|Response:)\s*(.*)/is);
  if (triggerMatch) {
    trigger = triggerMatch[1].trim();
    response = triggerMatch[2].trim();
  }

  // Formato narrativo limpio para evitar 'm 8' o 'r 5' en bruto
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
 * Formatea y embellece la narrativa de combate para que el DM no lea abreviaturas crípticas como 'm 8'
 */
export function formatActionNarrative(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/(?:^|\.\s*)m\s*([+-]?\d+)\s*,\s*reach\s*(\d+\s*ft\.?)/i, 'Ataque cuerpo a cuerpo: +$1 para impactar, alcance $2')
    .replace(/(?:^|\.\s*)r\s*([+-]?\d+)\s*,\s*range\s*([\d\/]+\s*ft\.?)/i, 'Ataque a distancia: +$1 para impactar, rango $2')
    .replace(/(?:^|\.\s*)mw\s*([+-]?\d+)\s*to\s*hit\s*,\s*reach\s*(\d+\s*ft\.?)/i, 'Ataque con arma cuerpo a cuerpo: +$1 para impactar, alcance $2')
    .replace(/(?:^|\.\s*)rw\s*([+-]?\d+)\s*to\s*hit\s*,\s*range\s*([\d\/]+\s*ft\.?)/i, 'Ataque con arma a distancia: +$1 para impactar, rango $2')
    .replace(/(?:^|\.\s*)ms\s*([+-]?\d+)\s*to\s*hit\s*,\s*reach\s*(\d+\s*ft\.?)/i, 'Ataque de conjuro cuerpo a cuerpo: +$1 para impactar, alcance $2')
    .replace(/(?:^|\.\s*)rs\s*([+-]?\d+)\s*to\s*hit\s*,\s*range\s*([\d\/]+\s*ft\.?)/i, 'Ataque de conjuro a distancia: +$1 para impactar, rango $2')
    .replace(/\bHit:\s*/gi, 'Impacto: ')
    .replace(/\bMiss:\s*/gi, 'Fallo: ')
    .trim();
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
