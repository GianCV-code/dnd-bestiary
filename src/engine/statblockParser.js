/**
 * statblockParser.js
 * Tactical parsing utility for D&D 5e / 5.5e (2014 & 2024) monster statblocks.
 * Transforms raw text and 5eTools notation into rich modular card models,
 * decomposing composite actions, formatting attack rolls, and extracting combat HUD values.
 */

/**
 * Strips 5eTools tags, decodes recharge brackets, and canonicalizes attack/save notation into clean English.
 */
export function clean5eTags(text) {
  if (!text || typeof text !== 'string') return '';
  let str = text;

  // Unify any legacy or foreign language artifacts
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
  // Loop to unwrap nested tags like {@b {@spell shield}}
  while (str !== prev && iterations < 6) {
    prev = str;
    iterations++;

    str = str
      .replace(/\{@actTrigger\}/gi, 'Trigger: ')
      .replace(/\{@actResponse(?:\s+[^}]+)?\}/gi, 'Response: ')
      
      .replace(/\{@actSave\s+(str|fue)[^}]*\}/gi, 'Strength saving throw')
      .replace(/\{@actSave\s+(dex|des)[^}]*\}/gi, 'Dexterity saving throw')
      .replace(/\{@actSave\s+(con)[^}]*\}/gi, 'Constitution saving throw')
      .replace(/\{@actSave\s+(int)[^}]*\}/gi, 'Intelligence saving throw')
      .replace(/\{@actSave\s+(wis|sab)[^}]*\}/gi, 'Wisdom saving throw')
      .replace(/\{@actSave\s+(cha|car)[^}]*\}/gi, 'Charisma saving throw')
      .replace(/\{@actSave\s+([^}]+)\}/gi, '$1 saving throw')
      
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

  // Normalize recharge format
  str = str.replace(/\bRecharges\s*([2-5])(?!\s*[-–\d])\b/gi, 'Recharge $1-6');
  str = str.replace(/\bRecharge\s*([2-5])(?!\s*[-–\d])\b/gi, 'Recharge $1-6');

  // Format raw attack shorthand into canonical English notation
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

  // Modern 2024 / 5.5e attack rolls: m 14, reach / r 8, range / m,r 5, reach
  str = str.replace(/(^|[.\n]\s*)m,r\s+([+-]?\d+),\s*(reach|range)/gi, '$1Melee or Ranged Attack Roll: +$2, $3');
  str = str.replace(/(^|[.\n]\s*)m\s+([+-]?\d+),\s*(reach)/gi, '$1Melee Attack Roll: +$2, $3');
  str = str.replace(/(^|[.\n]\s*)r\s+([+-]?\d+),\s*(range)/gi, '$1Ranged Attack Roll: +$2, $3');

  return str.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Converts entry blocks (string, array, table, list, inset) into structured readable text.
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
      const rows = entries.rows.map(r => (Array.isArray(r) ? r : [r]).map(c => clean5eTags(String(c))).join(' | ')).join('\n');
      const caption = entries.caption ? `[${clean5eTags(entries.caption)}]\n` : '';
      parts.push(`${caption}[${headers}]\n${rows}`);
    }
    return parts.filter(Boolean).join(' ');
  }
  return String(entries);
}

/**
 * Parses an action, bonus action, reaction, or legendary action into tactical fields.
 * If the action contains nested sub-actions (e.g. Breath Weapons with Fire/Sleep, Eye Rays),
 * decomposes them into subActions for discrete modular cards.
 */
export function parseModularAction(action, defaultType = 'Action') {
  if (!action) return null;
  const name = clean5eTags(action.name || '');

  // Check for Multiattack
  const isMultiattack = /^multiattack/i.test(name) || /multiataque/i.test(name);
  if (isMultiattack) {
    return {
      name,
      isMultiattack: true,
      rawText: extractEntryText(action.entries)
    };
  }

  // Decompose composite actions (e.g. Breath Weapons, Eye Rays)
  let subActions = null;
  let isComposite = false;
  let introText = '';

  if (Array.isArray(action.entries)) {
    const rawSubs = [];
    action.entries.forEach((item, idx) => {
      if (typeof item === 'string') {
        if (idx === 0) introText = clean5eTags(item);
      } else if (item && typeof item === 'object') {
        if (item.name && (item.entries || item.entry)) {
          rawSubs.push(item);
        } else if (item.items && Array.isArray(item.items)) {
          item.items.forEach(it => {
            if (it && typeof it === 'object' && it.name) {
              rawSubs.push(it);
            }
          });
        }
      }
    });

    if (rawSubs.length > 1) {
      isComposite = true;
      subActions = rawSubs.map(s => parseModularAction(s, 'Option'));
    }
  }

  const rawText = extractEntryText(action.entries);

  // 1. Attack Roll (+X to hit, Melee Attack Roll: +X, etc.)
  const atkMatch = rawText.match(
    /(?:(?:Attack\s*Roll|Tirada\s*de\s*ataque|Ataque[a-záéíóú\s]*):\s*([+-]?\d+))|(?:(?:mw|rw|ms|rs)\s*([+-]?\d+)\s*(?:to\s*hit|para\s*impactar))|(?:([+-]?\d+)\s*(?:to\s*hit|para\s*impactar))|(?:(?:^|[.\n]\s*)(?:m|r)\s*([+-]?\d+)\s*,\s*(?:reach|range|alcance|rango))|(?:(?:Ataque|Attack)[^:.]*:\s*([+-]\d+))/i
  );
  let atkBonus = null;
  if (atkMatch) {
    atkBonus = atkMatch[1] || atkMatch[2] || atkMatch[3] || atkMatch[4] || atkMatch[5];
    if (atkBonus && !atkBonus.startsWith('+') && !atkBonus.startsWith('-')) {
      atkBonus = `+${atkBonus}`;
    }
  }

  // 2. Attack Type & Range/Reach
  let atkType = defaultType;
  if (/melee\s*(?:weapon|spell)?\s*attack/i.test(rawText) || /cuerpo\s*a\s*cuerpo/i.test(rawText) || /melee\s*attack\s*roll/i.test(rawText) || /(?:^|[.\n]\s*)m\s*[+-]?\d+/i.test(rawText)) {
    if (/spell/i.test(rawText) || /conjuro/i.test(rawText)) {
      atkType = 'Melee Spell';
    } else {
      atkType = 'Melee Attack';
    }
  } else if (/ranged\s*(?:weapon|spell)?\s*attack/i.test(rawText) || /a\s*distancia/i.test(rawText) || /ranged\s*attack\s*roll/i.test(rawText) || /(?:^|[.\n]\s*)r\s*[+-]?\d+/i.test(rawText)) {
    if (/spell/i.test(rawText) || /conjuro/i.test(rawText)) {
      atkType = 'Ranged Spell';
    } else {
      atkType = 'Ranged Attack';
    }
  }

  // Reach & Range
  const reachMatch = rawText.match(/(?:(?:reach|alcance)\s*(\d+\s*(?:ft\.?|pies|m\.?))|(?:range|rango)\s*([\d\/]+\s*(?:ft\.?|pies|m\.?)))/i);
  let reach = reachMatch ? (reachMatch[1] ? `Reach ${reachMatch[1]}` : `Range ${reachMatch[2]}`) : null;

  // Recharge indicator
  if (/recharge\s*[\d–-]+/i.test(name) || /recarga\s*[\d–-]+/i.test(name)) {
    atkType = atkType ? `${atkType} • Recharge` : 'Recharge';
  }

  // 3. Average Damage, Dice, and Damage Type
  const hitMatch = rawText.match(/(?:Hit:|Impacto:|Miss:|Fallo:)\s*(\d+)\s*(?:\(([^)]+)\))?\s*([a-zA-Z]+)?\s*damage/i);
  const avgDamage = hitMatch ? hitMatch[1] : null;
  const damageDice = hitMatch && hitMatch[2] ? hitMatch[2].trim() : null;
  const damageType = hitMatch && hitMatch[3] ? hitMatch[3].trim() : null;

  // Secondary damage (e.g. "plus 14 (4d6) psychic damage")
  const plusMatch = rawText.match(/plus\s*(\d+)\s*(?:\(([^)]+)\))?\s*([a-zA-Z]+)?\s*damage/i);
  const plusDamage = plusMatch ? `${plusMatch[1]} (${plusMatch[2] || ''}) ${plusMatch[3] || ''}`.trim() : null;

  // 4. Saving Throw DC & Stat
  let saveDC = null;
  let saveStat = null;
  const saveMatch = rawText.match(
    /(?:(?:DC|CD)\s*(\d+)\s*(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma|Fuerza|Destreza|Constitución|Inteligencia|Sabiduría|Carisma|str|dex|con|int|wis|cha)?)|(?:(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma|Fuerza|Destreza|Constitución|Inteligencia|Sabiduría|Carisma)[^.]*?(?:CD|DC)\s*(\d+))|(?:escape\s*(?:DC|CD)\s*(\d+))/i
  );
  if (saveMatch) {
    if (saveMatch[1]) {
      saveDC = saveMatch[1];
      saveStat = saveMatch[2];
    } else if (saveMatch[3] && saveMatch[4]) {
      saveStat = saveMatch[3];
      saveDC = saveMatch[4];
    } else if (saveMatch[5]) {
      saveDC = saveMatch[5];
      saveStat = 'Escape';
    }

    if (saveStat && saveStat !== 'Escape') {
      const s = saveStat.toLowerCase();
      if (s.startsWith('str') || s.startsWith('fue')) saveStat = 'STR';
      else if (s.startsWith('dex') || s.startsWith('des')) saveStat = 'DEX';
      else if (s.startsWith('con')) saveStat = 'CON';
      else if (s.startsWith('int')) saveStat = 'INT';
      else if (s.startsWith('wis') || s.startsWith('sab')) saveStat = 'WIS';
      else if (s.startsWith('cha') || s.startsWith('car')) saveStat = 'CHA';
    }
  }

  // 5. Tactical Conditions
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
  if (/unconscious/i.test(rawText) || /inconsciente/i.test(rawText)) conditions.push('Unconscious');
  if (/charmed/i.test(rawText) || /hechizad/i.test(rawText)) conditions.push('Charmed');
  if (/petrified/i.test(rawText) || /petrificad/i.test(rawText)) conditions.push('Petrified');
  if (/exhaustion/i.test(rawText) || /agotamiento/i.test(rawText)) conditions.push('Exhaustion');

  // 6. Reaction Trigger & Response
  let trigger = null;
  let response = null;
  const triggerMatch = rawText.match(/(?:Trigger:|Disparador:)\s*(.*?)\s*(?:Response:|Respuesta:)\s*(.*)/is);
  if (triggerMatch) {
    trigger = triggerMatch[1].trim();
    response = triggerMatch[2].trim();
  }

  // Narrative text formatting
  const narrativeText = formatActionNarrative(response || rawText);

  return {
    name,
    isMultiattack: false,
    isComposite,
    introText,
    subActions,
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
 * Formats combat narrative text to ensure no developer shorthand is displayed.
 */
export function formatActionNarrative(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/(?:^|[.\n]\s*)mw,rw\s+([+-]?\d+)\s*to\s*hit\s*,\s*(reach|range)\s*([\d\/\s\w.]+)/gi, 'Melee or Ranged Weapon Attack: +$1 to hit, $2 $3')
    .replace(/(?:^|[.\n]\s*)ms,rs\s+([+-]?\d+)\s*to\s*hit\s*,\s*(reach|range)\s*([\d\/\s\w.]+)/gi, 'Melee or Ranged Spell Attack: +$1 to hit, $2 $3')
    .replace(/(?:^|[.\n]\s*)mw\s+([+-]?\d+)\s*to\s*hit\s*,\s*reach\s*(\d+\s*ft\.?)/gi, 'Melee Weapon Attack: +$1 to hit, reach $2')
    .replace(/(?:^|[.\n]\s*)rw\s+([+-]?\d+)\s*to\s*hit\s*,\s*range\s*([\d\/]+\s*ft\.?)/gi, 'Ranged Weapon Attack: +$1 to hit, range $2')
    .replace(/(?:^|[.\n]\s*)ms\s+([+-]?\d+)\s*to\s*hit\s*,\s*reach\s*(\d+\s*ft\.?)/gi, 'Melee Spell Attack: +$1 to hit, reach $2')
    .replace(/(?:^|[.\n]\s*)rs\s+([+-]?\d+)\s*to\s*hit\s*,\s*range\s*([\d\/]+\s*ft\.?)/gi, 'Ranged Spell Attack: +$1 to hit, range $2')
    .replace(/(?:^|[.\n]\s*)m,r\s+([+-]?\d+),\s*(reach|range)\s*([\d\/\s\w.]+)/gi, 'Melee or Ranged Attack Roll: +$1, $2 $3')
    .replace(/(?:^|[.\n]\s*)m\s*([+-]?\d+)\s*,\s*reach\s*(\d+\s*ft\.?)/gi, 'Melee Attack Roll: +$1, reach $2')
    .replace(/(?:^|[.\n]\s*)r\s*([+-]?\d+)\s*,\s*range\s*([\d\/]+\s*ft\.?)/gi, 'Ranged Attack Roll: +$1, range $2')
    .replace(/\bImpacto:\s*/gi, 'Hit: ')
    .replace(/\bFallo:\s*/gi, 'Miss: ')
    .trim();
}

/**
 * Calculates proficiency bonus according to CR (2014 & 2024 compatible).
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
