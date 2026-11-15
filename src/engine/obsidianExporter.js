import { clean5eTags, extractEntryText, formatActionNarrative, calculatePB } from './statblockParser.js';

const SIZE_MAP = {
  T: 'Tiny',
  S: 'Small',
  M: 'Medium',
  L: 'Large',
  H: 'Huge',
  G: 'Gargantuan'
};

const ALIGNMENT_MAP = {
  U: 'Unaligned',
  A: 'Any alignment',
  'L / G': 'Lawful Good',
  'N / G': 'Neutral Good',
  'C / G': 'Chaotic Good',
  'L / N': 'Lawful Neutral',
  N: 'Neutral',
  'N / E': 'Neutral Evil',
  'C / N': 'Chaotic Neutral',
  'L / E': 'Lawful Evil',
  'C / E': 'Chaotic Evil'
};

export function formatObsidianSize(s) {
  return SIZE_MAP[s] || s || 'Medium';
}

export function formatObsidianAlignment(a) {
  if (!a) return 'Unaligned';
  if (Array.isArray(a)) a = a.join(' / ');
  return ALIGNMENT_MAP[a] || a;
}

export function formatObsidianSpeed(speed) {
  if (speed == null) return '30 ft.';
  if (typeof speed === 'string') return speed;
  if (typeof speed === 'number') return `${speed} ft.`;
  const parts = [];
  const { walk, fly, swim, climb, burrow, canHover } = speed;
  const hasOther = Boolean(fly || swim || climb || burrow);

  if (typeof walk === 'number') {
    if (walk > 0 || !hasOther) {
      parts.push(`${walk} ft.`);
    } else if (walk === 0) {
      parts.push(`0 ft.`);
    }
  } else if (walk) {
    parts.push(`${walk} ft.`);
  }

  if (burrow) parts.push(`burrow ${burrow} ft.`);
  if (climb) parts.push(`climb ${climb} ft.`);
  if (fly) parts.push(`fly ${fly} ft.${canHover ? ' (hover)' : ''}`);
  if (swim) parts.push(`swim ${swim} ft.`);
  return parts.length > 0 ? parts.join(', ') : '0 ft.';
}

/**
 * Normaliza y genera el objeto JSON estricto compatible con Fantasy Statblocks y el Action Dashboard de 03. Views
 */
export function generateFantasyStatblockJson(creature) {
  if (!creature) return {};

  const name = creature.name || 'Unknown Creature';
  const size = formatObsidianSize(creature.size);
  const type = creature.type ? creature.type.charAt(0).toUpperCase() + creature.type.slice(1) : 'Monstrosity';
  const alignment = formatObsidianAlignment(creature.alignment);
  
  const ac = creature.acText ? String(creature.acText) : (creature.ac ? String(creature.ac) : '10');
  const hp = typeof creature.hp === 'number' ? creature.hp : (parseInt(creature.hp, 10) || 10);
  const hitDice = creature.hpFormula || '';
  const speed = formatObsidianSpeed(creature.speed);

  const stats = [
    creature.str || 10,
    creature.dex || 10,
    creature.con || 10,
    creature.int || 10,
    creature.wis || 10,
    creature.cha || 10
  ];

  const sb = {
    name,
    size,
    type,
    alignment,
    ac,
    hp,
    hit_dice: hitDice,
    speed,
    stats
  };

  // Salvaciones (formato compatible con Fantasy Statblocks y 03. Views)
  if (creature.save && Object.keys(creature.save).length > 0) {
    sb.saves = Object.entries(creature.save).map(([k, v]) => ({ [k.toLowerCase()]: v }));
  }

  // Habilidades (Skills)
  if (creature.skill && Object.keys(creature.skill).length > 0) {
    sb.skills = {};
    for (const [k, v] of Object.entries(creature.skill)) {
      const cap = k.charAt(0).toUpperCase() + k.slice(1);
      if (typeof v === 'string') {
        sb.skills[cap] = v;
      } else if (Array.isArray(v)) {
        sb.skills[cap] = v.map(it => it.oneOf ? `plus one of (${Object.keys(it.oneOf).join(', ')})` : String(it)).join(', ');
      }
    }
  }

  // Vulnerabilidades, Resistencias e Inmunidades
  if (creature.vulnerable && creature.vulnerable.length > 0) {
    sb.damage_vulnerabilities = creature.vulnerable.join(', ');
  }
  if (creature.resist && creature.resist.length > 0) {
    sb.damage_resistances = creature.resist.join(', ');
  }
  if (creature.immune && creature.immune.length > 0) {
    sb.damage_immunities = creature.immune.join(', ');
  }
  if (creature.conditionImmune && creature.conditionImmune.length > 0) {
    sb.condition_immunities = creature.conditionImmune.join(', ');
  }

  // Sentidos e Idiomas
  const sensesList = [];
  if (creature.senses && creature.senses !== '—') sensesList.push(creature.senses);
  if (creature.passivePerception) sensesList.push(`passive Perception ${creature.passivePerception}`);
  sb.senses = sensesList.join(', ') || 'passive Perception 10';
  sb.languages = creature.languages || '—';

  // CR y PB
  sb.cr = String(creature.cr || '0');
  sb.proficiency_bonus = `+${calculatePB(creature.cr)}`;

  // 1. Rasgos Especiales (Traits) incluyendo Spellcasting formateado
  const traits = [];
  if (creature.trait && creature.trait.length > 0) {
    creature.trait.forEach(t => {
      traits.push({
        name: clean5eTags(t.name),
        desc: formatActionNarrative(extractEntryText(t.entries))
      });
    });
  }

  // Añadir Spellcasting como trait canónico para Fantasy Statblocks
  if (creature.spellcasting && creature.spellcasting.length > 0) {
    creature.spellcasting.forEach(sp => {
      let desc = '';
      if (sp.headerEntries && sp.headerEntries.length > 0) {
        desc += sp.headerEntries.map(clean5eTags).join(' ') + '\n\n';
      }
      if (sp.will && sp.will.length > 0) {
        desc += `At will: ${sp.will.map(clean5eTags).join(', ')}\n`;
      }
      if (sp.daily) {
        for (const [k, v] of Object.entries(sp.daily)) {
          const times = k.replace(/e$/, '/day each').replace(/^(\d+)$/, '$1/day');
          const list = Array.isArray(v) ? v.map(clean5eTags).join(', ') : clean5eTags(String(v));
          desc += `${times}: ${list}\n`;
        }
      }
      if (sp.spells && Object.keys(sp.spells).length > 0) {
        for (const [lvl, data] of Object.entries(sp.spells)) {
          const lLabel = lvl === '0'
            ? 'Cantrips (at will)'
            : lvl === '1'
              ? `1st level${data.slots ? ` (${data.slots} slots)` : ''}`
              : lvl === '2'
                ? `2nd level${data.slots ? ` (${data.slots} slots)` : ''}`
                : lvl === '3'
                  ? `3rd level${data.slots ? ` (${data.slots} slots)` : ''}`
                  : `${lvl}th level${data.slots ? ` (${data.slots} slots)` : ''}`;
          const list = Array.isArray(data.spells) ? data.spells.map(clean5eTags).join(', ') : clean5eTags(String(data));
          desc += `${lLabel}: ${list}\n`;
        }
      }
      traits.push({
        name: clean5eTags(sp.name || 'Spellcasting'),
        desc: desc.trim()
      });
    });
  }
  if (traits.length > 0) sb.traits = traits;

  // 2. Acciones de Combate (Actions)
  if (creature.action && creature.action.length > 0) {
    sb.actions = creature.action.map(a => ({
      name: clean5eTags(a.name),
      desc: formatActionNarrative(extractEntryText(a.entries))
    }));
  }

  // 3. Acciones Adicionales (Bonus Actions)
  if (creature.bonus && creature.bonus.length > 0) {
    sb.bonus_actions = creature.bonus.map(b => ({
      name: clean5eTags(b.name),
      desc: formatActionNarrative(extractEntryText(b.entries))
    }));
  }

  // 4. Reacciones (Reactions)
  if (creature.reaction && creature.reaction.length > 0) {
    sb.reactions = creature.reaction.map(r => ({
      name: clean5eTags(r.name),
      desc: formatActionNarrative(extractEntryText(r.entries))
    }));
  }

  // 5. Acciones Legendarias (Legendary Actions)
  if (creature.legendary && creature.legendary.length > 0) {
    sb.legendary_description = Array.isArray(creature.legendaryHeader) && creature.legendaryHeader.length > 0
      ? creature.legendaryHeader.map(clean5eTags).join(' ')
      : (typeof creature.legendaryHeader === 'string'
        ? clean5eTags(creature.legendaryHeader)
        : `The ${name.toLowerCase()} can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The ${name.toLowerCase()} regains spent legendary actions at the start of its turn.`);
    
    sb.legendary_actions = creature.legendary.map(l => ({
      name: clean5eTags(l.name),
      desc: formatActionNarrative(extractEntryText(l.entries))
    }));
  }

  // 6. Acciones Míticas (Mythic Actions)
  if (creature.mythic && creature.mythic.length > 0) {
    sb.mythic_description = Array.isArray(creature.mythicHeader) && creature.mythicHeader.length > 0
      ? creature.mythicHeader.map(clean5eTags).join(' ')
      : (typeof creature.mythicHeader === 'string'
        ? clean5eTags(creature.mythicHeader)
        : `If the ${name.toLowerCase()}'s mythic trait has activated, it can use the options below as legendary actions.`);
    
    sb.mythic_actions = creature.mythic.map(m => ({
      name: clean5eTags(m.name),
      desc: formatActionNarrative(extractEntryText(m.entries))
    }));
  }

  return sb;
}

/**
 * Genera la nota Markdown completa lista para guardar en la bóveda
 */
export function generateObsidianMarkdown(creature) {
  const sbJson = generateFantasyStatblockJson(creature);
  const jsonStr = JSON.stringify(sbJson, null, 4);
  const creatureName = creature.name || 'Creature';
  
  return `\`\`\`statblock\n${jsonStr}\n\`\`\`\n\n![[${creatureName}.png|center|350]]\n`;
}

/**
 * Genera el enlace directo con el protocolo nativo obsidian://new
 */
export function generateObsidianUri(creature, vaultName = 'DnD - DM (Remote)', folderPath = '04. Custom Bestiary/00. Criaturas Varias') {
  const markdown = generateObsidianMarkdown(creature);
  const cleanFolder = folderPath.replace(/^\/+|\/+$/g, '');
  const filePath = cleanFolder ? `${cleanFolder}/${creature.name}` : creature.name;

  return `obsidian://new?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(filePath)}&content=${encodeURIComponent(markdown)}&overwrite=true`;
}

/**
 * Dispara la descarga directa de un archivo .md en el navegador
 */
export function downloadObsidianMarkdown(creature) {
  const markdown = generateObsidianMarkdown(creature);
  const fileName = `${creature.name || 'creature'}.md`;
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
