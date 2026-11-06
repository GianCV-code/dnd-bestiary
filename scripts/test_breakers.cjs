const fs = require('fs');
const path = require('path');

const bestiary = JSON.parse(fs.readFileSync('public/data/bestiary.json', 'utf8'));

// Copiar funciones de generate_obsidian_demo.cjs
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
  str = str.replace(/\b(?:mw)\s+([+-]?\d+)\s+to\s+hit/gi, (_, n) => `Melee Weapon Attack: +${n} to hit`);
  str = str.replace(/\b(?:rw)\s+([+-]?\d+)\s+to\s+hit/gi, (_, n) => `Ranged Weapon Attack: +${n} to hit`);
  str = str.replace(/\b(?:ms)\s+([+-]?\d+)\s+to\s+hit/gi, (_, n) => `Melee Spell Attack: +${n} to hit`);
  str = str.replace(/\b(?:rs)\s+([+-]?\d+)\s+to\s+hit/gi, (_, n) => `Ranged Spell Attack: +${n} to hit`);
  // Corregir también "12 to hit with spell attacks" -> "+12 to hit with spell attacks"
  str = str.replace(/(\b\d+\b)\s+to\s+hit/gi, (_, n) => `+${n} to hit`);
  return str.replace(/\s{2,}/g, ' ').trim();
}

function extractText(entries) {
  if (!entries) return '';
  if (typeof entries === 'string') return clean5eTags(entries);
  if (Array.isArray(entries)) {
    // Si contiene sub-objetos con name (como los Eye Rays del Beholder), separar con saltos de línea claros
    return entries.map(extractText).filter(Boolean).join('\n\n');
  }
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
  
  // Spellcasting
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
          const lName = lvl === '0' ? 'Cantrips (at will)' : lvl + (lvl === '1' ? 'st' : lvl === '2' ? 'nd' : lvl === '3' ? 'rd' : 'th') + ' level' + (data.slots ? ' (' + data.slots + ' slots)' : '');
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

  // Mythic Actions (Phase 2 Bosses like Tiamat or Suneater Owlbear)
  if (c.mythic && c.mythic.length > 0) {
    sb.mythic_description = 'If the ' + c.name.toLowerCase() + '\'s mythic trait has activated in the last hour, it can use the options below as legendary actions.';
    sb.mythic_actions = c.mythic.map(m => ({ name: clean5eTags(m.name), desc: extractText(m.entries) }));
  }

  return sb;
}

// Probar con los 4 'breakers'
const breakers = ['beholder-mm', 'lich-mm', 'aspect-of-tiamat-ftd', 'adult-suneater-owlbear-helianasguidetomonsterhunting'];
breakers.forEach(id => {
  const m = bestiary.find(c => c.id === id);
  console.log('==============================');
  console.log('TESTING:', m.name, '(CR ' + m.cr + ')');
  const sb = generateFantasyStatblockJson(m);
  
  // Validar JSON
  const jsonStr = JSON.stringify(sb, null, 4);
  try {
    JSON.parse(jsonStr);
    console.log('✓ JSON es 100% válido. Longitud:', jsonStr.length, 'caracteres.');
  } catch (e) {
    console.error('❌ ERROR de JSON en', m.name, e);
  }

  // Comprobar campos críticos
  if (id === 'beholder-mm') {
    const eyeRays = sb.actions.find(a => a.name === 'Eye Rays');
    console.log('Eye Rays length:', eyeRays?.desc?.length);
    console.log('Eye Rays snippet:', eyeRays?.desc?.slice(0, 200) + '...');
  }
  if (id === 'lich-mm') {
    const sp = sb.traits.find(t => t.name === 'Spellcasting');
    console.log('Lich Spellcasting length:', sp?.desc?.length);
    console.log('Lich Spellcasting snippet:', sp?.desc?.slice(0, 250) + '...');
  }
  if (id === 'aspect-of-tiamat-ftd') {
    console.log('Tiamat Mythic Actions count:', sb.mythic_actions?.length);
    console.log('Tiamat Mythic snippet:', sb.mythic_actions?.[0]);
  }
  if (id === 'adult-suneater-owlbear-helianasguidetomonsterhunting') {
    console.log('Suneater Mythic Actions count:', sb.mythic_actions?.length);
  }
});

