const fs = require('fs');
const path = require('path');

// 1. Cargar bestiary.json
const bestiaryPath = path.join(__dirname, '..', 'public', 'data', 'bestiary.json');
const allMonsters = JSON.parse(fs.readFileSync(bestiaryPath, 'utf8'));

// 2. Extraer las 3 criaturas requeridas
const targetIds = ['goblin-mm', 'mind-flayer-mm', 'ancient-red-dragon-mm'];
const rawCreatures = targetIds.map(id => {
  const m = allMonsters.find(c => c.id === id);
  if (!m) throw new Error('Criatura no encontrada: ' + id);
  return m;
});

// 3. Funciones de limpieza y normalización para Fantasy Statblocks
function formatSize(s) {
  const map = { T: 'Tiny', S: 'Small', M: 'Medium', L: 'Large', H: 'Huge', G: 'Gargantuan' };
  return map[s] || s || 'Medium';
}

function formatAlignment(a) {
  if (!a) return 'Unaligned';
  if (Array.isArray(a)) a = a.join(' / ');
  const map = {
    'U': 'Unaligned',
    'A': 'Any alignment',
    'L / G': 'Lawful Good',
    'N / G': 'Neutral Good',
    'C / G': 'Chaotic Good',
    'L / N': 'Lawful Neutral',
    'N': 'Neutral',
    'N / E': 'Neutral Evil',
    'C / N': 'Chaotic Neutral',
    'L / E': 'Lawful Evil',
    'C / E': 'Chaotic Evil'
  };
  return map[a] || a;
}

function clean5eTags(text) {
  if (!text || typeof text !== 'string') return '';
  let str = text;
  let prev = '';
  let it = 0;
  while (str !== prev && it < 6) {
    prev = str;
    it++;
    str = str
      .replace(/\{@actTrigger\}/gi, 'Trigger: ')
      .replace(/\{@actResponse(?:\s+[^}]+)?\}/gi, 'Response: ')
      .replace(/\{@actSave\s+(str|fue)[^}]*\}/gi, 'Strength saving throw: ')
      .replace(/\{@actSave\s+(dex|des)[^}]*\}/gi, 'Dexterity saving throw: ')
      .replace(/\{@actSave\s+(con)[^}]*\}/gi, 'Constitution saving throw: ')
      .replace(/\{@actSave\s+(int)[^}]*\}/gi, 'Intelligence saving throw: ')
      .replace(/\{@actSave\s+(wis|sab)[^}]*\}/gi, 'Wisdom saving throw: ')
      .replace(/\{@actSave\s+(cha|car)[^}]*\}/gi, 'Charisma saving throw: ')
      .replace(/\{@actSave\s+([^}]+)\}/gi, 'Saving throw ($1): ')
      .replace(/\{@atk\s+mw\}/gi, 'Melee Weapon Attack:')
      .replace(/\{@atk\s+rw\}/gi, 'Ranged Weapon Attack:')
      .replace(/\{@atk\s+ms\}/gi, 'Melee Spell Attack:')
      .replace(/\{@atk\s+rs\}/gi, 'Ranged Spell Attack:')
      .replace(/\{@hit\s+([+-]?\d+)\}/gi, (_, n) => (n.startsWith('+') || n.startsWith('-')) ? n : '+' + n)
      .replace(/\{@h\}/gi, 'Hit: ')
      .replace(/\{@m\}/gi, 'Miss: ')
      .replace(/\{@recharge\s*([^}]+)?\}/gi, (_, n) => '(Recharge ' + (n ? n.trim() : '6') + ')')
      .replace(/\{@dice\s+([^}]+)\}/gi, '$1')
      .replace(/\{@damage\s+([^}]+)\}/gi, '$1')
      .replace(/\{@dc\s+([^}]+)\}/gi, 'DC $1')
      .replace(/\{@spell\s+([^}|]+)(?:\|[^}|]+)?(?:\|([^}]+))?\}/gi, (_, name, disp) => disp || name)
      .replace(/\{@condition\s+([^}|]+)(?:\|[^}|]+)?(?:\|([^}]+))?\}/gi, (_, name, disp) => disp || name)
      .replace(/\{@skill\s+([^}|]+)(?:\|[^}|]+)?(?:\|([^}]+))?\}/gi, (_, name, disp) => disp || name)
      .replace(/\{@b\s+([^}]+)\}/gi, '$1')
      .replace(/\{@i\s+([^}]+)\}/gi, '$1')
      .replace(/\{@[a-zA-Z]+\s*([^}|]+)?(?:\|[^}|]*)*(?:\|([^}]+))?\}/gi, (_, p1, p2) => p2 || p1 || '');
  }
  // Normalizar prefijos compactos como "mw 7 to hit" o "rw 5 to hit"
  str = str.replace(/\b(?:mw)\s+([+-]?\d+)\s+to\s+hit/gi, (_, n) => `Melee Weapon Attack: +${n} to hit`);
  str = str.replace(/\b(?:rw)\s+([+-]?\d+)\s+to\s+hit/gi, (_, n) => `Ranged Weapon Attack: +${n} to hit`);
  str = str.replace(/\b(?:ms)\s+([+-]?\d+)\s+to\s+hit/gi, (_, n) => `Melee Spell Attack: +${n} to hit`);
  str = str.replace(/\b(?:rs)\s+([+-]?\d+)\s+to\s+hit/gi, (_, n) => `Ranged Spell Attack: +${n} to hit`);
  return str.replace(/\s{2,}/g, ' ').trim();
}

function extractText(entries) {
  if (!entries) return '';
  if (typeof entries === 'string') return clean5eTags(entries);
  if (Array.isArray(entries)) return entries.map(extractText).filter(Boolean).join('\n\n');
  if (typeof entries === 'object') {
    const parts = [];
    if (entries.name) parts.push(clean5eTags(entries.name) + ':');
    if (entries.entry) parts.push(clean5eTags(entries.entry));
    if (entries.entries) parts.push(extractText(entries.entries));
    if (entries.items) {
      const itemsText = entries.items.map(it => {
        if (typeof it === 'string') return '• ' + clean5eTags(it);
        if (it && it.name) return '• ' + clean5eTags(it.name) + ': ' + extractText(it.entry || it.entries);
        return '• ' + extractText(it);
      }).join('\n');
      parts.push(itemsText);
    }
    return parts.filter(Boolean).join(' ');
  }
  return String(entries);
}

function formatSpeed(speed) {
  if (!speed) return '30 ft.';
  if (typeof speed === 'string') return speed;
  const parts = [];
  if (speed.walk) parts.push(speed.walk + ' ft.');
  if (speed.burrow) parts.push('burrow ' + speed.burrow + ' ft.');
  if (speed.climb) parts.push('climb ' + speed.climb + ' ft.');
  if (speed.fly) parts.push('fly ' + speed.fly + ' ft.' + (speed.canHover ? ' (hover)' : ''));
  if (speed.swim) parts.push('swim ' + speed.swim + ' ft.');
  return parts.length > 0 ? parts.join(', ') : '30 ft.';
}

function getMod(val) {
  const m = Math.floor((val - 10) / 2);
  return m >= 0 ? '+' + m : String(m);
}

function getProficiencyBonus(cr) {
  if (!cr) return '+2';
  const num = typeof cr === 'string' && cr.includes('/') ? 0 : parseFloat(cr);
  if (num >= 29) return '+9';
  if (num >= 25) return '+8';
  if (num >= 21) return '+7';
  if (num >= 17) return '+6';
  if (num >= 13) return '+5';
  if (num >= 9) return '+4';
  if (num >= 5) return '+3';
  return '+2';
}

// 4. Formatear para Fantasy Statblocks JSON
function generateFantasyStatblockJson(c) {
  const sb = {
    name: c.name,
    size: formatSize(c.size),
    type: c.type || 'monstrosity',
    alignment: formatAlignment(c.alignment),
    ac: c.acText || (c.ac ? String(c.ac) : '10'),
    hp: c.hp || 10,
    hit_dice: c.hpFormula || '',
    speed: formatSpeed(c.speed),
    stats: [c.str || 10, c.dex || 10, c.con || 10, c.int || 10, c.wis || 10, c.cha || 10]
  };

  if (c.save && Object.keys(c.save).length > 0) {
    sb.saves = Object.entries(c.save).map(([k, v]) => ({ [k.toLowerCase()]: v }));
  }

  if (c.skill && Object.keys(c.skill).length > 0) {
    sb.skills = {};
    for (const [k, v] of Object.entries(c.skill)) {
      const cap = k.charAt(0).toUpperCase() + k.slice(1);
      sb.skills[cap] = v;
    }
  }

  if (c.vulnerable && c.vulnerable.length > 0) sb.damage_vulnerabilities = c.vulnerable.join(', ');
  if (c.resist && c.resist.length > 0) sb.damage_resistances = c.resist.join(', ');
  if (c.immune && c.immune.length > 0) sb.damage_immunities = c.immune.join(', ');
  if (c.conditionImmune && c.conditionImmune.length > 0) sb.condition_immunities = c.conditionImmune.join(', ');

  const senses = [];
  if (c.senses) senses.push(c.senses);
  if (c.passivePerception) senses.push('passive Perception ' + c.passivePerception);
  sb.senses = senses.join(', ') || 'passive Perception 10';

  sb.languages = c.languages || '--';
  sb.cr = String(c.cr || '0');
  sb.proficiency_bonus = getProficiencyBonus(c.cr);

  // Traits
  const traits = [];
  if (c.trait && c.trait.length > 0) {
    c.trait.forEach(t => traits.push({ name: clean5eTags(t.name), desc: extractText(t.entries) }));
  }
  // Añadir Spellcasting si existe como trait
  if (c.spellcasting && c.spellcasting.length > 0) {
    c.spellcasting.forEach(sp => {
      let desc = '';
      if (sp.headerEntries) desc += extractText(sp.headerEntries) + '\n';
      if (sp.will && sp.will.length > 0) desc += 'At will: ' + sp.will.join(', ') + '\n';
      if (sp.daily) {
        for (const [k, v] of Object.entries(sp.daily)) {
          const times = k.replace(/e$/, '/day each').replace(/^(\d+)$/, '$1/day');
          desc += times + ': ' + (Array.isArray(v) ? v.join(', ') : v) + '\n';
        }
      }
      if (sp.spells) {
        for (const [lvl, data] of Object.entries(sp.spells)) {
          const lName = lvl === '0' ? 'Cantrips (at will)' : lvl + ' level' + (data.slots ? ' (' + data.slots + ' slots)' : '');
          if (data.spells) desc += lName + ': ' + data.spells.join(', ') + '\n';
        }
      }
      traits.push({ name: clean5eTags(sp.name || 'Spellcasting'), desc: desc.trim() });
    });
  }
  if (traits.length > 0) sb.traits = traits;

  if (c.action && c.action.length > 0) {
    sb.actions = c.action.map(a => ({ name: clean5eTags(a.name), desc: extractText(a.entries) }));
  }
  if (c.bonus && c.bonus.length > 0) {
    sb.bonus_actions = c.bonus.map(b => ({ name: clean5eTags(b.name), desc: extractText(b.entries) }));
  }
  if (c.reaction && c.reaction.length > 0) {
    sb.reactions = c.reaction.map(r => ({ name: clean5eTags(r.name), desc: extractText(r.entries) }));
  }
  if (c.legendary && c.legendary.length > 0) {
    sb.legendary_description = 'The ' + c.name.toLowerCase() + ' can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature\'s turn. The ' + c.name.toLowerCase() + ' regains spent legendary actions at the start of its turn.';
    sb.legendary_actions = c.legendary.map(l => ({ name: clean5eTags(l.name), desc: extractText(l.entries) }));
  }

  return sb;
}

function generateMarkdownNote(c) {
  const sb = generateFantasyStatblockJson(c);
  return '```statblock\n' + JSON.stringify(sb, null, 4) + '\n```\n\n![[' + c.name + '.png|center|350]]\n';
}

// 5. Preparar datos procesados para el frontend
const processedCreatures = rawCreatures.map(c => {
  const sbJson = generateFantasyStatblockJson(c);
  const markdown = generateMarkdownNote(c);
  const vaultName = 'DnD - DM (Remote)';
  const folderPath = '04. Custom Bestiary/00. Criaturas Varias';
  const fileName = c.name;
  const uri = 'obsidian://new?vault=' + encodeURIComponent(vaultName) +
              '&file=' + encodeURIComponent(folderPath + '/' + fileName) +
              '&content=' + encodeURIComponent(markdown) +
              '&overwrite=true';

  return {
    raw: c,
    statblockJson: sbJson,
    markdown: markdown,
    obsidianUri: uri,
    vaultTarget: {
      vault: vaultName,
      folder: folderPath,
      file: fileName + '.md'
    }
  };
});

console.log('Criaturas procesadas exitosamente:');
processedCreatures.forEach(p => console.log('✓ ' + p.raw.name + ' (URI length: ' + p.obsidianUri.length + ' chars)'));

// Exportar datos listos para el HTML
fs.writeFileSync(path.join(__dirname, 'demo_creatures_data.json'), JSON.stringify(processedCreatures, null, 2), 'utf8');
console.log('Guardado demo_creatures_data.json');

