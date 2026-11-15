import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Swords, 
  Heart, 
  Zap, 
  Search, 
  SlidersHorizontal, 
  Plus, 
  Minus, 
  Trash2, 
  Play, 
  X, 
  Flame, 
  Skull, 
  Dices,
  BookOpen,
  Filter,
  Users,
  Compass,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Eye,
  Wind,
  Activity,
  Layers
} from 'lucide-react';
import { evaluateEncounter } from './engine/encounterEngine';
import { simulateBattle, DND_CLASSES, getStatsForClassAndLevel } from './engine/combatSimulator';
import { 
  getCreatureVersionMeta, 
  repairHollowCopies, 
  propagateVersionMedia,
  groupCreaturesByName, 
  computeVersionDiff 
} from './engine/versionManager';
import PartySyncBar from './components/PartySyncBar';
import CreatureStatblock from './components/CreatureStatblock';
import { loadBestiaryWithCache, clearBestiaryCache } from './engine/cacheManager';

// 5e Tools Advanced Filter Constants
const SIZES = [
  { id: 'T', label: 'T', title: 'Tiny' },
  { id: 'S', label: 'S', title: 'Small' },
  { id: 'M', label: 'M', title: 'Medium' },
  { id: 'L', label: 'L', title: 'Large' },
  { id: 'H', label: 'H', title: 'Huge' },
  { id: 'G', label: 'G', title: 'Gargantuan' }
];

const SAVES = [
  { id: 'str', label: 'STR' },
  { id: 'dex', label: 'DEX' },
  { id: 'con', label: 'CON' },
  { id: 'int', label: 'INT' },
  { id: 'wis', label: 'WIS' },
  { id: 'cha', label: 'CHA' }
];

const SPEEDS = [
  { id: 'fly', label: 'Fly' },
  { id: 'swim', label: 'Swim' },
  { id: 'climb', label: 'Climb' },
  { id: 'burrow', label: 'Burrow' },
  { id: 'hover', label: 'Hover' }
];

const SENSES = [
  { id: 'darkvision', label: 'Darkvision' },
  { id: 'blindsight', label: 'Blindsight' },
  { id: 'tremorsense', label: 'Tremorsense' },
  { id: 'truesight', label: 'Truesight' }
];

const DAMAGE_TYPES = [
  { id: 'fire', label: 'Fire' },
  { id: 'cold', label: 'Cold' },
  { id: 'poison', label: 'Poison' },
  { id: 'lightning', label: 'Lightning' },
  { id: 'acid', label: 'Acid' },
  { id: 'necrotic', label: 'Necrotic' },
  { id: 'radiant', label: 'Radiant' },
  { id: 'psychic', label: 'Psychic' },
  { id: 'force', label: 'Force' },
  { id: 'thunder', label: 'Thunder' },
  { id: 'bludgeoning', label: 'Bludgeoning' },
  { id: 'piercing', label: 'Piercing' },
  { id: 'slashing', label: 'Slashing' }
];

const CONDITIONS = [
  { id: 'charmed', label: 'Charmed' },
  { id: 'frightened', label: 'Frightened' },
  { id: 'paralyzed', label: 'Paralyzed' },
  { id: 'poisoned', label: 'Poisoned' },
  { id: 'stunned', label: 'Stunned' },
  { id: 'blinded', label: 'Blinded' },
  { id: 'exhaustion', label: 'Exhaustion' },
  { id: 'prone', label: 'Prone' },
  { id: 'petrified', label: 'Petrified' },
  { id: 'restrained', label: 'Restrained' },
  { id: 'grappled', label: 'Grappled' },
  { id: 'deafened', label: 'Deafened' },
  { id: 'unconscious', label: 'Unconscious' }
];

const CONDITION_SYNONYMS = {
  charmed: ['charmed', 'charm', 'hechizado'],
  frightened: ['frightened', 'fear', 'afraid', 'asustado'],
  paralyzed: ['paralyzed', 'paralysed', 'paralizado'],
  poisoned: ['poisoned', 'poison', 'posioned', 'envenenado'],
  stunned: ['stunned', 'stun', 'aturdido'],
  blinded: ['blinded', 'blind', 'cegado'],
  exhaustion: ['exhaustion', 'exhausted', 'agotamiento'],
  prone: ['prone', 'derribado'],
  petrified: ['petrified', 'petrificado'],
  restrained: ['restrained', 'apresado'],
  grappled: ['grappled', 'agarrado'],
  deafened: ['deafened', 'ensordecido'],
  unconscious: ['unconscious', 'inconsciente']
};

const SIZE_NORM = {
  'T': 'T', 'Tiny': 'T', 'tiny': 'T',
  'S': 'S', 'Small': 'S', 'small': 'S',
  'M': 'M', 'Medium': 'M', 'medium': 'M',
  'L': 'L', 'Large': 'L', 'large': 'L',
  'H': 'H', 'Huge': 'H', 'huge': 'H',
  'G': 'G', 'Gargantuan': 'G', 'gargantuan': 'G'
};

function normalizeSize(s) {
  return SIZE_NORM[s] || s || 'M';
}

function getSpeedNumber(val) {
  if (typeof val === 'number') return val;
  if (val && typeof val === 'object' && typeof val.number === 'number') return val.number;
  if (typeof val === 'string') return parseInt(val, 10) || 0;
  return 0;
}

const ENVIRONMENTS = [
  { id: 'jungle', label: '🌴 Jungle / Tropical' },
  { id: 'forest', label: '🌲 Forest' },
  { id: 'swamp', label: '🍄 Swamp' },
  { id: 'mountain', label: '⛰️ Mountain' },
  { id: 'desert', label: '🏜️ Desert' },
  { id: 'coastal', label: '🌊 Coastal' },
  { id: 'arctic', label: '❄️ Arctic' },
  { id: 'grassland', label: '🌾 Grassland' },
  { id: 'hill', label: '🌄 Hill' },
  { id: 'underdark', label: '🦇 Underdark' },
  { id: 'underwater', label: '🐠 Underwater' },
  { id: 'urban', label: '🏛️ Urban' },
  { id: 'planar', label: '🌌 Planar / Other Planes' },
  { id: 'badlands', label: '🏜️ Badlands' },
  { id: 'farmland', label: '🚜 Farmland' },
  { id: 'volcanic', label: '🌋 Volcanic' },
  { id: 'any', label: '🌐 Any Environment' }
];

// Spells with forced saving throws mapping (5e offensive saves)
const SPELL_SAVES_MAP = {
  'sacred flame': ['dex'], 'toll the dead': ['wis'], 'vicious mockery': ['wis'],
  'poison spray': ['con'], 'thunderclap': ['con'], 'frostbite': ['con'],
  'lightning lure': ['str'], 'gust': ['str'], 'infestation': ['con'],
  'command': ['wis'], 'dissonant whispers': ['wis'], 'charm person': ['wis'],
  'faerie fire': ['dex'], 'burning hands': ['dex'], 'thunderwave': ['con'],
  'hellish rebuke': ['dex'], 'arms of hadar': ['str'], 'entangle': ['str'],
  'bane': ['cha'], 'tasha\'s hideous laughter': ['wis'], 'hideous laughter': ['wis'],
  'hold person': ['wis'], 'blindness/deafness': ['con'], 'suggestion': ['wis'],
  'shatter': ['con'], 'web': ['dex'], 'moonbeam': ['con'], 'gust of wind': ['str'],
  'flaming sphere': ['dex'], 'heat metal': ['con'], 'calm emotions': ['cha'],
  'zone of truth': ['cha'], 'crown of madness': ['wis'], 'phantasmal force': ['int'],
  'levitate': ['con'], 'fireball': ['dex'], 'lightning bolt': ['dex'],
  'hypnotic pattern': ['wis'], 'fear': ['wis'], 'slow': ['wis'], 'sleet storm': ['dex'],
  'spirit guardians': ['wis'], 'erupting earth': ['dex'], 'stinking cloud': ['con'],
  'tidal wave': ['dex'], 'wind wall': ['str'], 'enemies abound': ['int'],
  'polymorph': ['wis'], 'banishment': ['cha'], 'confusion': ['wis'],
  'ice storm': ['dex'], 'blight': ['con'], 'resilient sphere': ['dex'],
  'phantasmal killer': ['wis'], 'watery sphere': ['str'], 'cone of cold': ['con'],
  'hold monster': ['wis'], 'dominate person': ['wis'], 'synaptic static': ['int'],
  'telekinesis': ['str'], 'geas': ['wis'], 'flame strike': ['dex'],
  'scrying': ['wis'], 'destructive wave': ['con'], 'contagion': ['con'],
  'insect plague': ['con'], 'cloudkill': ['con'], 'immolation': ['dex'],
  'disintegrate': ['dex'], 'chain lightning': ['dex'], 'circle of death': ['con'],
  'sunbeam': ['con'], 'eyebite': ['wis'], 'mass suggestion': ['wis'],
  'harm': ['con'], 'flesh to stone': ['con'], 'plane shift': ['cha'],
  'finger of death': ['con'], 'fire storm': ['dex'], 'reverse gravity': ['dex'],
  'prismatic spray': ['dex', 'con', 'wis'], 'divine word': ['cha'],
  'symbol': ['wis', 'con', 'int'], 'dominate monster': ['wis'],
  'feeblemind': ['int', 'cha'], 'befuddle': ['int'], 'incendiary cloud': ['dex'],
  'sunburst': ['con'], 'earthquake': ['dex', 'con'], 'meteor swarm': ['dex'],
  'imprisonment': ['wis'], 'prismatic wall': ['dex', 'con', 'wis'],
  'weird': ['wis'], 'storm of vengeance': ['con', 'dex'], 'psychic scream': ['int'],
  'ravenous void': ['str']
};

// Regex patterns to identify saving throws forced on targets by attacks/traits/actions
const FORCED_SAVE_PATTERNS = {
  str: /\b(strength saving throw|dc \d+ (to )?strength|strength save|salvaci[oó]n de fuerza|tirada de salvaci[oó]n de fuerza|cd \d+.*fuerza)\b/i,
  dex: /\b(dexterity saving throw|dc \d+ (to )?dexterity|dexterity save|salvaci[oó]n de destreza|tirada de salvaci[oó]n de destreza|cd \d+.*destreza)\b/i,
  con: /\b(constitution saving throw|dc \d+ (to )?constitution|constitution save|salvaci[oó]n de constituci[oó]n|tirada de salvaci[oó]n de constituci[oó]n|cd \d+.*constituci[oó]n)\b/i,
  int: /\b(intelligence saving throw|dc \d+ (to )?intelligence|intelligence save|salvaci[oó]n de inteligencia|tirada de salvaci[oó]n de inteligencia|cd \d+.*inteligencia)\b/i,
  wis: /\b(wisdom saving throw|dc \d+ (to )?wisdom|wisdom save|salvaci[oó]n de sabidur[ií]a|tirada de salvaci[oó]n de sabidur[ií]a|cd \d+.*sabidur[ií]a)\b/i,
  cha: /\b(charisma saving throw|dc \d+ (to )?charisma|charisma save|salvaci[oó]n de carisma|tirada de salvaci[oó]n de carisma|cd \d+.*carisma)\b/i
};

function extractForcesSaves(c) {
  const saves = new Set();
  const textParts = [];

  ['trait', 'action', 'bonus', 'reaction', 'legendary', 'mythic'].forEach(cat => {
    (c[cat] || []).forEach(item => {
      if (item.name) textParts.push(item.name);
      (item.entries || []).forEach(e => {
        if (typeof e === 'string') textParts.push(e);
        else if (e && e.entries) textParts.push(JSON.stringify(e));
      });
    });
  });

  const fullText = textParts.join(' ').toLowerCase();

  for (const [stat, regex] of Object.entries(FORCED_SAVE_PATTERNS)) {
    if (regex.test(fullText)) {
      saves.add(stat);
    }
  }

  if (c.spellcasting) {
    const spellStr = JSON.stringify(c.spellcasting).toLowerCase();
    for (const [spell, spellSaves] of Object.entries(SPELL_SAVES_MAP)) {
      if (spellStr.includes(spell)) {
        spellSaves.forEach(s => saves.add(s));
      }
    }
  }

  return Array.from(saves);
}

// Transform and index raw bestiary data for instant searches and edition grouping
function indexRawBestiary(data) {
  const repaired = repairHollowCopies(data);
  const mediaEnriched = propagateVersionMedia(repaired);

  const sizeMap = {
    'T': 'tiny diminuto',
    'S': 'small pequeño',
    'M': 'medium mediano',
    'L': 'large grande',
    'H': 'huge enorme',
    'G': 'gargantuan gargantuesco'
  };

  const SIZE_NORM_MAP = {
    'medium': 'M', 'large': 'L', 'huge': 'H', 'small': 'S', 'tiny': 'T', 'gargantuan': 'G',
    'm': 'M', 'l': 'L', 'h': 'H', 's': 'S', 't': 'T', 'g': 'G'
  };

  const TYPE_PLURALS = {
    plant: 'plants plantas vegetacion vegetal flora',
    beast: 'beasts bestias animales fauna animal',
    dragon: 'dragons dragones',
    monstrosity: 'monstrosities monstruosidades',
    humanoid: 'humanoids humanoides',
    undead: 'undeads no-muertos no muertos muertos vivientes',
    fiend: 'fiends infernales demonios diablos',
    fey: 'feéricos feericos fey hadas',
    celestial: 'celestials celestiales',
    construct: 'constructs constructos',
    elemental: 'elementals elementales',
    aberration: 'aberrations aberraciones',
    giant: 'giants gigantes',
    ooze: 'oozes cienos limos',
    wyvern: 'wyverns wyvernos'
  };

  const TROPICAL_PATTERNS = [
    /\bape\b/i, /\bbaboon\b/i, /\btiger\b/i, /\bpanther\b/i, /\bjaguar\b/i,
    /\bgrung\b/i, /\bgirallon\b/i, /\bvelociraptor\b/i, /\btyrannosaurus\b/i,
    /\ballosaurus\b/i, /\bbrontosaurus\b/i, /\bchwinga\b/i, /\bkamadan\b/i,
    /\bsu-monster\b/i, /\bjaculi\b/i, /\bzorbo\b/i, /\beblis\b/i, /\bchultan\b/i
  ];

  return mediaEnriched.map(c => {
    const versionMeta = getCreatureVersionMeta(c);

    // 1. Normalize Size (handles full words from MME 2024 like 'Medium' -> 'M')
    const normSize = SIZE_NORM_MAP[String(c.size || '').toLowerCase()] || c.size || 'M';

    // 2. Normalize Speed (handles object speeds like fly: { number: 150, condition: '(hover)' })
    const speedNorm = { ...(c.speed || {}) };
    let flyNum = 0;
    let hoverFlag = !!speedNorm.canHover;
    if (typeof speedNorm.fly === 'number') {
      flyNum = speedNorm.fly;
    } else if (typeof speedNorm.fly === 'object' && speedNorm.fly !== null) {
      flyNum = speedNorm.fly.number || 0;
      if (speedNorm.fly.condition && String(speedNorm.fly.condition).toLowerCase().includes('hover')) {
        hoverFlag = true;
      }
    }
    speedNorm.fly = flyNum;
    speedNorm.canHover = hoverFlag;
    if (typeof speedNorm.climb === 'object' && speedNorm.climb !== null) speedNorm.climb = speedNorm.climb.number || 0;
    if (typeof speedNorm.swim === 'object' && speedNorm.swim !== null) speedNorm.swim = speedNorm.swim.number || 0;
    if (typeof speedNorm.burrow === 'object' && speedNorm.burrow !== null) speedNorm.burrow = speedNorm.burrow.number || 0;

    // 3. Enrich Environment in Memory (Deterministic rules)
    const envSet = new Set((c.environment || []).map(e => String(e).toLowerCase().trim()));
    // Rule 1: Swamp + Forest (without arctic) = Jungle
    const hasForest = envSet.has('forest');
    const hasSwamp = envSet.has('swamp');
    const hasArctic = envSet.has('arctic');
    if (hasForest && hasSwamp && !hasArctic && envSet.size <= 4) {
      envSet.add('jungle');
    }
    // Rule 2: Tomb of Annihilation (ToA) campaign canon = Jungle
    if (c.source === 'ToA') {
      envSet.add('jungle');
    }
    // Rule 3: Canonical Tropical fauna/flora patterns (Apes, Tigers, Grungs, Dinosaurs)
    if (TROPICAL_PATTERNS.some(p => p.test(c.name))) {
      envSet.add('jungle');
    }
    // Normalizations for Outer Planes and Underground
    for (const e of Array.from(envSet)) {
      if (e.includes('outer planes') || e.includes('abyss') || e.includes('nine hells') || e.includes('astral') || e.includes('ethereal') || e.includes('feywild') || e.includes('shadowfell')) {
        envSet.add('planar');
      }
      if (e.includes('underground')) {
        envSet.add('underdark');
      }
    }
    const enrichedEnvironment = Array.from(envSet);

    const parts = [
      c.name,
      c.type,
      (c.typeTags || []).join(' '),
      c.publisher || '',
      c.sourceGroup || '',
      c.source || '',
      versionMeta.is2024 ? '2024 revised xmm' : '',
      versionMeta.is2014 ? '2014 classic mm' : '',
      versionMeta.is3pp ? '3pp third party' : '',
      versionMeta.isCrossover ? 'crossover video game' : '',
      c.source || '',
      Array.isArray(c.senses) ? c.senses.join(' ') : (c.senses || ''),
      Array.isArray(c.languages) ? c.languages.join(' ') : (c.languages || ''),
      (c.resist || []).join(' '),
      (c.immune || []).join(' '),
      (c.vulnerable || []).join(' '),
      (c.conditionImmune || []).join(' '),
      enrichedEnvironment.join(' ')
    ];

    const normalizedSize = normalizeSize(c.size);
    if (sizeMap[normalizedSize]) parts.push(sizeMap[normalizedSize]);

    // Bilingual damage and condition indexing
    const dmgTermsMap = {
      fire: 'fuego', cold: 'frío frio', poison: 'veneno', lightning: 'rayo relámpago',
      acid: 'ácido acido', necrotic: 'necrótico necrotico', radiant: 'radiante',
      psychic: 'psíquico psiquico', force: 'fuerza', thunder: 'trueno',
      bludgeoning: 'contundente', piercing: 'perforante', slashing: 'cortante'
    };
    (c.immune || []).forEach(im => {
      const s = (typeof im === 'string' ? im : JSON.stringify(im)).toLowerCase();
      parts.push(s);
      if (dmgTermsMap[s]) parts.push(`inmune ${dmgTermsMap[s]}`, `immune ${s}`);
    });
    (c.resist || []).forEach(res => {
      const s = (typeof res === 'string' ? res : JSON.stringify(res)).toLowerCase();
      parts.push(s);
      if (dmgTermsMap[s]) parts.push(`resistencia ${dmgTermsMap[s]}`, `resist ${s}`);
    });
    if (c.senses) {
      const sens = (Array.isArray(c.senses) ? c.senses.join(' ') : String(c.senses)).toLowerCase();
      if (sens.includes('darkvision')) parts.push('visión oscura vision oscura darkvision');
      if (sens.includes('blindsight')) parts.push('a ciegas vista a ciegas blindsight');
      if (sens.includes('tremorsense')) parts.push('sensibilidad sísmica sismica tremorsense');
      if (sens.includes('truesight')) parts.push('visión verdadera vision verdadera truesight');
    }

    if (c.save) {
      Object.keys(c.save).forEach(k => {
        parts.push(`${k} save`, `${k} saving throw`);
        if (k === 'wis') parts.push('wisdom wisdom save wisdom saving throw sab sabiduria');
        if (k === 'dex') parts.push('dexterity dexterity save dexterity saving throw des destreza');
        if (k === 'con') parts.push('constitution constitution save constitution saving throw constitucion');
        if (k === 'str') parts.push('strength strength save strength saving throw fue fuerza');
        if (k === 'int') parts.push('intelligence intelligence save intelligence saving throw inteligencia');
        if (k === 'cha') parts.push('charisma charisma save charisma saving throw car carisma');
      });
    }

    if (c.speed) {
      const flySpeed = getSpeedNumber(c.speed.fly);
      const swimSpeed = getSpeedNumber(c.speed.swim);
      const climbSpeed = getSpeedNumber(c.speed.climb);
      const burrowSpeed = getSpeedNumber(c.speed.burrow);
      const canHover = !!(c.speed.canHover || (c.speed.fly && typeof c.speed.fly === 'object' && c.speed.fly.condition && c.speed.fly.condition.toLowerCase().includes('hover')));

      if (flySpeed > 0) parts.push('fly flying flight volar vuelo');
      if (swimSpeed > 0) parts.push('swim swimming nadar nado');
      if (climbSpeed > 0) parts.push('climb climbing trepar');
      if (burrowSpeed > 0) parts.push('burrow burrowing cavar');
      if (canHover) parts.push('hover levitar');
    }

    if (c.legendary && c.legendary.length > 0) parts.push('legendary legendary action acciones legendarias');
    if (c.mythic && c.mythic.length > 0) parts.push('mythic acciones miticas');
    if (c.spellcasting && c.spellcasting.length > 0) parts.push('spellcaster spellcasting lanzador de conjuros');

    (c.trait || []).forEach(t => {
      parts.push(t.name);
      (t.entries || []).forEach(e => {
        if (typeof e === 'string') parts.push(e);
        else if (e && e.entries) parts.push(JSON.stringify(e));
      });
    });

    (c.action || []).forEach(t => {
      parts.push(t.name);
      (t.entries || []).forEach(e => {
        if (typeof e === 'string') parts.push(e);
        else if (e && e.entries) parts.push(JSON.stringify(e));
      });
    });

    (c.bonus || []).forEach(t => {
      parts.push(t.name);
      (t.entries || []).forEach(e => {
        if (typeof e === 'string') parts.push(e);
        else if (e && e.entries) parts.push(JSON.stringify(e));
      });
    });

    (c.reaction || []).forEach(t => {
      parts.push(t.name);
      (t.entries || []).forEach(e => {
        if (typeof e === 'string') parts.push(e);
        else if (e && e.entries) parts.push(JSON.stringify(e));
      });
    });

    (c.legendary || []).forEach(t => {
      parts.push(t.name);
      (t.entries || []).forEach(e => {
        if (typeof e === 'string') parts.push(e);
        else if (e && e.entries) parts.push(JSON.stringify(e));
      });
    });

    const forcesSaves = extractForcesSaves(c);
    if (forcesSaves.length > 0) {
      forcesSaves.forEach(k => {
        parts.push(`forces ${k} save`, `forces ${k} saving throw`, `exige ${k}`, `salvacion ${k}`);
        if (k === 'wis') parts.push('forces wisdom save exige sabiduria exige salvacion sabiduria wisdom saving throw dc wisdom wisdom');
        if (k === 'dex') parts.push('forces dexterity save exige destreza exige salvacion destreza dexterity saving throw dc dexterity dexterity');
        if (k === 'con') parts.push('forces constitution save exige constitucion exige salvacion constitucion constitution saving throw dc constitution constitution');
        if (k === 'str') parts.push('forces strength save exige fuerza exige salvacion fuerza strength saving throw dc strength strength');
        if (k === 'int') parts.push('forces intelligence save exige inteligencia exige salvacion inteligencia intelligence saving throw dc intelligence intelligence');
        if (k === 'cha') parts.push('forces charisma save exige carisma exige salvacion carisma charisma saving throw dc charisma charisma');
      });
    }

    return {
      ...c,
      size: normSize,
      speed: speedNorm,
      environment: enrichedEnvironment,
      versionMeta,
      forcesSaves,
      _searchIndex: parts.join(' ').toLowerCase()
    };
  });
}

export default function App() {
  const [creatures, setCreatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & 5e Tools Advanced Filters State
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedCrRange, setSelectedCrRange] = useState({ min: 0, max: 30 });
  const [selectedForcesSaves, setSelectedForcesSaves] = useState([]); // Offensive (Exige Salvación)
  const [selectedSaves, setSelectedSaves] = useState([]); // Defensive (Competencia en Salvación)
  const [selectedSpeeds, setSelectedSpeeds] = useState([]);
  const [selectedSenses, setSelectedSenses] = useState([]);
  const [selectedDamageImmunities, setSelectedDamageImmunities] = useState([]);
  const [selectedDamageResistances, setSelectedDamageResistances] = useState([]);
  const [selectedConditionImmunities, setSelectedConditionImmunities] = useState([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState('ALL');
  const [hasLegendary, setHasLegendary] = useState(false);
  const [isSpellcaster, setIsSpellcaster] = useState(false);
  const [hasTokenOnly, setHasTokenOnly] = useState(false);
  const [sortBy, setSortBy] = useState('name-asc');

  // Edition Filter: 'ALL' | '2024' | '2014' | '3pp' | 'crossover'
  const [selectedEdition, setSelectedEdition] = useState('ALL');

  // Group Versions by default to eliminate duplicates and organize reprints
  const [groupVersions, setGroupVersions] = useState(true);

  // Selected Version ID per card: { [groupKey]: creatureId }
  const [cardVersionOverrides, setCardVersionOverrides] = useState({});

  // Modal / Selected Detail Creature
  const [activeModalCreature, setActiveModalCreature] = useState(null);
  const [visibleCount, setVisibleCount] = useState(60);

  useEffect(() => {
    setVisibleCount(60);
  }, [
    search, 
    selectedEdition,
    selectedType, 
    selectedSizes, 
    selectedCrRange, 
    selectedForcesSaves,
    selectedSaves, 
    selectedSpeeds, 
    selectedSenses, 
    selectedDamageImmunities, 
    selectedDamageResistances, 
    selectedConditionImmunities, 
    selectedEnvironment, 
    hasLegendary, 
    isSpellcaster, 
    hasTokenOnly,
    sortBy,
    groupVersions
  ]);

  // Default Starting Custom Party
  const DEFAULT_CUSTOM_PARTY = [
    { id: 'cp-1', name: 'Thorin', className: 'Paladin', level: 5, hp: 44, ac: 18, toHit: 7, dpr: 24 },
    { id: 'cp-2', name: 'Valeria', className: 'Wizard', level: 5, hp: 32, ac: 15, toHit: 7, dpr: 28 },
    { id: 'cp-3', name: 'Lyra', className: 'Cleric', level: 5, hp: 38, ac: 18, toHit: 7, dpr: 18 },
    { id: 'cp-4', name: 'Corvus', className: 'Rogue', level: 5, hp: 38, ac: 16, toHit: 8, dpr: 22 }
  ];

  // Party Mode: 'custom' (Mis Jugadores) vs 'generic' (Grupo Rápido por Nivel)
  const [partyMode, setPartyMode] = useState(() => {
    return localStorage.getItem('dnd_party_mode') || 'custom';
  });

  // Custom Players State (Saved in LocalStorage)
  const [customPlayers, setCustomPlayers] = useState(() => {
    try {
      const saved = localStorage.getItem('dnd_custom_party');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading custom party from localStorage:', e);
    }
    return DEFAULT_CUSTOM_PARTY;
  });

  // Sync Custom Players & Party Mode to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('dnd_custom_party', JSON.stringify(customPlayers));
    } catch (e) {
      console.error(e);
    }
  }, [customPlayers]);

  useEffect(() => {
    try {
      localStorage.setItem('dnd_party_mode', partyMode);
    } catch (e) {
      console.error(e);
    }
  }, [partyMode]);

  // Read party from URL hash if shared (e.g., #party=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash && hash.includes('party=')) {
      try {
        const raw = hash.split('party=')[1];
        if (raw) {
          const jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(raw))));
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const formatted = parsed.map((p, idx) => ({
              id: p.id || ('cp-' + Date.now() + '-' + idx),
              name: p.name || 'Hero',
              className: p.class || p.className || 'Fighter',
              level: Number(p.lvl || p.level) || 5,
              hp: Number(p.hp) || 40,
              ac: Number(p.ac) || 16,
              toHit: Number(p.hit || p.toHit) || 7,
              dpr: Number(p.dpr) || 20
            }));
            setCustomPlayers(formatted);
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }
      } catch (err) {
        console.warn('Could not parse party from URL hash:', err);
      }
    }
  }, []);

  // Generic Party Groups State (Kobold+ Fight Club Quick Mode)
  const [partyGroups, setPartyGroups] = useState([
    { id: 'g1', level: 5, count: 4 }
  ]);

  // Active party payload for KFC & BattleSim
  const activeParty = useMemo(() => {
    if (partyMode === 'custom') return customPlayers;
    return partyGroups;
  }, [partyMode, customPlayers, partyGroups]);

  const [encounterMonsters, setEncounterMonsters] = useState([]);
  const [rulesSystem, setRulesSystem] = useState('2014');
  const [isEncounterOpen, setIsEncounterOpen] = useState(true);

  // BattleSim Simulator State
  const [luck, setLuck] = useState(0.5);
  const [simResult, setSimResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

    // Load Bestiary Data with Persistent IndexedDB Cache (0 bytes bandwidth on repeat visits)
  useEffect(() => {
    const dataUrl = import.meta.env.BASE_URL + 'data/bestiary.json';
    loadBestiaryWithCache(dataUrl, indexRawBestiary)
      .then(indexed => {
        setCreatures(indexed);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Compute Encounter Metrics (KFC Engine)
  const encounterMetrics = useMemo(() => {
    return evaluateEncounter(encounterMonsters, activeParty, rulesSystem);
  }, [encounterMonsters, activeParty, rulesSystem]);

  // Run BattleSim Simulation
  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const res = simulateBattle(encounterMonsters, activeParty, luck, partyMode);
      setSimResult(res);
      setIsSimulating(false);
    }, 120);
  };

  // Re-run simulation when encounter roster or luck changes
  useEffect(() => {
    if (encounterMonsters.length > 0) {
      const res = simulateBattle(encounterMonsters, activeParty, luck, partyMode);
      setSimResult(res);
    } else {
      setSimResult(null);
    }
  }, [encounterMonsters, activeParty, luck, partyMode]);

  // Available Creature Types
  const creatureTypes = useMemo(() => {
    const set = new Set();
    creatures.forEach(c => {
      if (c.type) set.add(c.type);
    });
    return Array.from(set).sort();
  }, [creatures]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (selectedEdition !== 'ALL') count++;
    if (selectedType !== 'ALL') count++;
    if (selectedSizes.length > 0) count += selectedSizes.length;
    if (selectedCrRange.min > 0 || selectedCrRange.max < 30) count++;
    if (selectedForcesSaves.length > 0) count += selectedForcesSaves.length;
    if (selectedSaves.length > 0) count += selectedSaves.length;
    if (selectedSpeeds.length > 0) count += selectedSpeeds.length;
    if (selectedSenses.length > 0) count += selectedSenses.length;
    if (selectedDamageImmunities.length > 0) count += selectedDamageImmunities.length;
    if (selectedDamageResistances.length > 0) count += selectedDamageResistances.length;
    if (selectedConditionImmunities.length > 0) count += selectedConditionImmunities.length;
    if (selectedEnvironment !== 'ALL') count++;
    if (hasLegendary) count++;
    if (isSpellcaster) count++;
    if (hasTokenOnly) count++;
    return count;
  }, [
    search, 
    selectedEdition,
    selectedType, 
    selectedSizes, 
    selectedCrRange, 
    selectedForcesSaves,
    selectedSaves, 
    selectedSpeeds, 
    selectedSenses, 
    selectedDamageImmunities, 
    selectedDamageResistances, 
    selectedConditionImmunities, 
    selectedEnvironment, 
    hasLegendary, 
    isSpellcaster, 
    hasTokenOnly
  ]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedEdition('ALL');
    setSelectedType('ALL');
    setSelectedSizes([]);
    setSelectedCrRange({ min: 0, max: 30 });
    setSelectedForcesSaves([]);
    setSelectedSaves([]);
    setSelectedSpeeds([]);
    setSelectedSenses([]);
    setSelectedDamageImmunities([]);
    setSelectedDamageResistances([]);
    setSelectedConditionImmunities([]);
    setSelectedEnvironment('ALL');
    setHasLegendary(false);
    setIsSpellcaster(false);
    setHasTokenOnly(false);
  };

  const toggleFilterItem = (list, setList, item) => {
    setList(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  };

  // Group creatures by name (eliminating noise from identical reprints and organizing versions)
  const { creatureGroups, creatureGroupsMap } = useMemo(() => {
    const res = groupCreaturesByName(creatures);
    return {
      creatureGroups: res?.creatureGroups || res?.groups || [],
      creatureGroupsMap: res?.creatureGroupsMap || res?.groupsMap || new Map()
    };
  }, [creatures]);

  // Predicate checking if a creature matches all current active filters
  const isCreatureMatching = (c, searchTerms) => {
    // 1. Search Terms (Name, spells, traits, actions, saves)
    if (searchTerms.length > 0) {
      const matchesSearch = searchTerms.every(term => c._searchIndex && c._searchIndex.includes(term));
      if (!matchesSearch) return false;
    }

    // 2. Edition Filter
    if (selectedEdition === '2024' && !c.versionMeta?.is2024) return false;
    if (selectedEdition === '2014' && (c.versionMeta?.is2024 || c.versionMeta?.is3pp || c.versionMeta?.isCrossover)) return false;
    if (selectedEdition === '3pp' && !c.versionMeta?.is3pp) return false;
    if (selectedEdition === 'crossover' && !c.versionMeta?.isCrossover) return false;

    // 3. Creature Type Filter (Case-insensitive)
    if (selectedType !== 'ALL' && (c.type || '').toLowerCase() !== selectedType.toLowerCase()) return false;

    // 4. Size Filter (Normalized)
    if (selectedSizes.length > 0 && !selectedSizes.includes(normalizeSize(c.size))) return false;

    // 5. CR Range Filter
    if (c.crNumeric < selectedCrRange.min || c.crNumeric > selectedCrRange.max) return false;

    // 6. Saving Throws Forced on Targets (Offensive)
    if (selectedForcesSaves.length > 0) {
      const matchesForcesSaves = selectedForcesSaves.every(saveKey => 
        (c.forcesSaves || []).includes(saveKey)
      );
      if (!matchesForcesSaves) return false;
    }

    // 7. Saving Throws Proficiency (Defensive)
    if (selectedSaves.length > 0) {
      const matchesSaves = selectedSaves.every(saveKey => c.save && c.save[saveKey] !== undefined);
      if (!matchesSaves) return false;
    }

    // 8. Movement Speeds (Supports numeric, object, and condition formats)
    if (selectedSpeeds.length > 0) {
      const matchesSpeeds = selectedSpeeds.every(sp => {
        if (sp === 'fly') return getSpeedNumber(c.speed?.fly) > 0;
        if (sp === 'swim') return getSpeedNumber(c.speed?.swim) > 0;
        if (sp === 'climb') return getSpeedNumber(c.speed?.climb) > 0;
        if (sp === 'burrow') return getSpeedNumber(c.speed?.burrow) > 0;
        if (sp === 'hover') return !!(c.speed?.canHover || (c.speed?.fly && typeof c.speed.fly === 'object' && c.speed.fly.condition && c.speed.fly.condition.toLowerCase().includes('hover')));
        return true;
      });
      if (!matchesSpeeds) return false;
    }

    // 9. Senses
    if (selectedSenses.length > 0) {
      const senseStr = (Array.isArray(c.senses) ? c.senses.join(' ') : (c.senses || '')).toLowerCase();
      const matchesSenses = selectedSenses.every(sense => senseStr.includes(sense));
      if (!matchesSenses) return false;
    }

    // 10. Damage Immunities
    if (selectedDamageImmunities.length > 0) {
      const matchesImmunities = selectedDamageImmunities.every(dmg => 
        (c.immune || []).some(im => (typeof im === 'string' ? im : JSON.stringify(im)).toLowerCase().includes(dmg))
      );
      if (!matchesImmunities) return false;
    }

    // 11. Damage Resistances
    if (selectedDamageResistances.length > 0) {
      const matchesResistances = selectedDamageResistances.every(dmg => 
        (c.resist || []).some(res => (typeof res === 'string' ? res : JSON.stringify(res)).toLowerCase().includes(dmg))
      );
      if (!matchesResistances) return false;
    }

    // 12. Condition Immunities (With synonym & typo tolerance)
    if (selectedConditionImmunities.length > 0) {
      const matchesConditions = selectedConditionImmunities.every(cond => {
        const targets = CONDITION_SYNONYMS[cond] || [cond];
        return (c.conditionImmune || []).some(ci => {
          const str = (typeof ci === 'string' ? ci : JSON.stringify(ci)).toLowerCase();
          return targets.some(t => str.includes(t));
        });
      });
      if (!matchesConditions) return false;
    }

    // 13. Environment (Supports all 5e environments and regional aliases)
    if (selectedEnvironment !== 'ALL') {
      const envTarget = selectedEnvironment.toLowerCase();
      const matchesEnv = (c.environment || []).some(env => {
        const e = env.toLowerCase();
        if (envTarget === 'jungle') return e.includes('jungle') || e.includes('tropical');
        if (envTarget === 'planar') return e.includes('planar') || e.includes('plane') || e.includes('feywild') || e.includes('shadowfell') || e.includes('abyss') || e.includes('astral') || e.includes('ethereal') || e.includes('nine hells');
        if (envTarget === 'underdark') return e.includes('underdark') || e.includes('underground');
        if (envTarget === 'any') return e === 'any';
        return e.includes(envTarget);
      });
      if (!matchesEnv) return false;
    }

    // 14. Special Traits
    if (hasLegendary && (!c.legendary || c.legendary.length === 0)) return false;
    if (isSpellcaster) {
      const isCaster = (c.spellcasting && c.spellcasting.length > 0) ||
        (c.trait || []).some(t => t.name && /spellcasting|lanzamiento de conjuros/i.test(t.name)) ||
        (c.action || []).some(a => a.name && /spellcasting|lanzamiento de conjuros/i.test(a.name));
      if (!isCaster) return false;
    }
    if (hasTokenOnly && !c.hasToken) return false;

    return true;
  };

  // Filtered Creature Groups (Smart versioning grouping)
  const { filteredCreatureGroups, totalMatchingVersionsCount } = useMemo(() => {
    const searchTerms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);

    let matchingVersionsTotal = 0;
    const groupsResult = [];

    for (const group of (creatureGroups || [])) {
      // Find matching versions in this group
      const matchingVersions = group.versions.filter(v => isCreatureMatching(v, searchTerms));
      if (matchingVersions.length === 0) continue;

      matchingVersionsTotal += matchingVersions.length;

      // Select active version for this group
      const overrideId = cardVersionOverrides[group.groupKey];
      let activeVersion = matchingVersions.find(v => v.id === overrideId);
      if (!activeVersion) {
        // Fall back to preferred default among matching versions
        activeVersion = matchingVersions[0];
      }

      groupsResult.push({
        groupKey: group.groupKey,
        name: group.name,
        versions: group.versions,
        matchingVersions: matchingVersions,
        activeVersion: activeVersion,
        hasMultipleVersions: group.versions.length > 1
      });
    }

    // Sort groups based on activeVersion
    groupsResult.sort((a, b) => {
      const ca = a.activeVersion;
      const cb = b.activeVersion;
      if (sortBy === 'name-asc') return ca.name.localeCompare(cb.name);
      if (sortBy === 'name-desc') return cb.name.localeCompare(ca.name);
      if (sortBy === 'cr-asc') return ca.crNumeric - cb.crNumeric || ca.name.localeCompare(cb.name);
      if (sortBy === 'cr-desc') return cb.crNumeric - ca.crNumeric || ca.name.localeCompare(cb.name);
      if (sortBy === 'hp-desc') return cb.hp - ca.hp;
      if (sortBy === 'ac-desc') return cb.ac - ca.ac;
      return 0;
    });

    return {
      filteredCreatureGroups: groupsResult,
      totalMatchingVersionsCount: matchingVersionsTotal
    };
  }, [
    creatureGroups,
    cardVersionOverrides,
    search,
    selectedEdition,
    selectedType,
    selectedSizes,
    selectedCrRange,
    selectedForcesSaves,
    selectedSaves,
    selectedSpeeds,
    selectedSenses,
    selectedDamageImmunities,
    selectedDamageResistances,
    selectedConditionImmunities,
    selectedEnvironment,
    hasLegendary,
    isSpellcaster,
    hasTokenOnly,
    sortBy
  ]);

  // Flat Filtered Creatures (Fallback when user disables grouping)
  const flatFilteredCreatures = useMemo(() => {
    if (groupVersions) return [];
    const searchTerms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);

    return creatures.filter(c => isCreatureMatching(c, searchTerms)).sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'cr-asc') return a.crNumeric - b.crNumeric || a.name.localeCompare(b.name);
      if (sortBy === 'cr-desc') return b.crNumeric - a.crNumeric || a.name.localeCompare(b.name);
      if (sortBy === 'hp-desc') return b.hp - a.hp;
      if (sortBy === 'ac-desc') return b.ac - a.ac;
      return 0;
    });
  }, [
    groupVersions,
    creatures,
    search,
    selectedEdition,
    selectedType,
    selectedSizes,
    selectedCrRange,
    selectedForcesSaves,
    selectedSaves,
    selectedSpeeds,
    selectedSenses,
    selectedDamageImmunities,
    selectedDamageResistances,
    selectedConditionImmunities,
    selectedEnvironment,
    hasLegendary,
    isSpellcaster,
    hasTokenOnly,
    sortBy
  ]);

  // Lookup group for active modal creature
  const modalGroup = useMemo(() => {
    if (!activeModalCreature) return null;
    return creatureGroupsMap && creatureGroupsMap.get ? (creatureGroupsMap.get(activeModalCreature.name.toLowerCase().trim()) || null) : null;
  }, [activeModalCreature, creatureGroupsMap]);

  // Determine comparison baseline for smart diff in modal
  const comparisonBaseline = useMemo(() => {
    if (!activeModalCreature || !modalGroup || modalGroup.versions.length < 2) return null;

    // If active is 2024, compare against 2014 if available
    if (activeModalCreature.versionMeta?.is2024) {
      const v2014 = modalGroup.versions.find(v => v.versionMeta?.is2014);
      if (v2014 && v2014.id !== activeModalCreature.id) return v2014;
    }

    // If active is 2014, compare against 2024 if available
    if (activeModalCreature.versionMeta?.is2014) {
      const v2024 = modalGroup.versions.find(v => v.versionMeta?.is2024);
      if (v2024 && v2024.id !== activeModalCreature.id) return v2024;
    }

    // Otherwise compare against default version
    if (activeModalCreature.id !== modalGroup.defaultVersion.id) {
      return modalGroup.defaultVersion;
    }

    return modalGroup.versions.find(v => v.id !== activeModalCreature.id) || null;
  }, [activeModalCreature, modalGroup]);

  // Compute differences for modal
  const modalVersionDiffs = useMemo(() => {
    if (!activeModalCreature || !comparisonBaseline) return [];
    return computeVersionDiff(activeModalCreature, comparisonBaseline);
  }, [activeModalCreature, comparisonBaseline]);

  // Add Creature to Encounter
  const handleAddToEncounter = (creature, e) => {
    if (e) e.stopPropagation();
    setEncounterMonsters(prev => {
      const idx = prev.findIndex(item => item.creature.id === creature.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], count: next[idx].count + 1 };
        return next;
      } else {
        return [...prev, { creature, count: 1 }];
      }
    });
    setIsEncounterOpen(true);
  };

  const handleUpdateMonsterCount = (creatureId, delta) => {
    setEncounterMonsters(prev => {
      return prev.map(item => {
        if (item.creature.id === creatureId) {
          const newCount = item.count + delta;
          return newCount > 0 ? { ...item, count: newCount } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const handleRemoveMonster = (creatureId) => {
    setEncounterMonsters(prev => prev.filter(m => m.creature.id !== creatureId));
  };

  // Add / Edit Party Group
  const handleAddPartyGroup = () => {
    setPartyGroups(prev => [...prev, { id: `g${Date.now()}`, level: 5, count: 1 }]);
  };

  const handleUpdatePartyGroup = (id, field, value) => {
    setPartyGroups(prev => prev.map(g => {
      if (g.id === id) {
        return { ...g, [field]: Math.max(1, parseInt(value, 10) || 1) };
      }
      return g;
    }));
  };

  const handleRemovePartyGroup = (id) => {
    if (partyGroups.length <= 1) return;
    setPartyGroups(prev => prev.filter(g => g.id !== id));
  };

  // Custom Player Handlers
  const handleAddCustomPlayer = () => {
    const newId = `cp-${Date.now()}`;
    const defaultClass = 'Fighter';
    const defaultLevel = 5;
    const stats = getStatsForClassAndLevel(defaultClass, defaultLevel);
    setCustomPlayers(prev => [
      ...prev,
      {
        id: newId,
        name: `Hero ${prev.length + 1}`,
        className: defaultClass,
        level: defaultLevel,
        hp: stats.hp,
        ac: stats.ac,
        toHit: stats.toHit,
        dpr: stats.dpr
      }
    ]);
  };

  const handleUpdateCustomPlayer = (id, field, value) => {
    setCustomPlayers(prev => prev.map(p => {
      if (p.id !== id) return p;
      let nextVal = value;
      if (['level', 'hp', 'ac', 'toHit', 'dpr'].includes(field)) {
        nextVal = Number(value) || 0;
      }
      return { ...p, [field]: nextVal };
    }));
  };

  const handleApplyClassPreset = (id) => {
    setCustomPlayers(prev => prev.map(p => {
      if (p.id !== id) return p;
      const stats = getStatsForClassAndLevel(p.className, p.level);
      return {
        ...p,
        hp: stats.hp,
        ac: stats.ac,
        toHit: stats.toHit,
        dpr: stats.dpr
      };
    }));
  };

  const handleRemoveCustomPlayer = (id) => {
    if (customPlayers.length <= 1) return;
    setCustomPlayers(prev => prev.filter(p => p.id !== id));
  };

  const handleResetCustomParty = () => {
    setCustomPlayers(DEFAULT_CUSTOM_PARTY);
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: '#0a0c10' }}>
        <Flame className="brand-icon" style={{ width: '48px', height: '48px', animation: 'pulse 1.5s infinite' }} />
        <h2 style={{ fontFamily: 'Cinzel', color: '#fbbf24' }}>Loading Tactical Bestiary...</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Indexing 10,992 creatures from WotC (114 books), Third-Party Pro, and Crossovers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e' }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">
            <Flame size={20} />
          </div>
          <span className="brand-title">D&D 5e Bestiary Suite</span>
          <span className="brand-tag">Tactical Engine</span>
        </div>

        <div className="header-actions">
          <a
            href="./image-demos.html"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(244, 63, 94, 0.2))',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#fef08a',
              textDecoration: 'none',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
            title="Open image style demonstration with 5eTools gallery"
          >
            <span>🎨</span>
            <span>Image Styles Demo</span>
          </a>
          <a
            href="./demos.html"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#fde68a',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
            title="Open interactive 6-statblock comparator"
          >
            <span>🧪</span>
            <span>View Statblock Demos</span>
          </a>
          <button 
            id="encounter-drawer-toggle"
            className="encounter-toggle-btn"
            onClick={() => setIsEncounterOpen(!isEncounterOpen)}
          >
            <Swords size={18} />
            <span>Encounter & Combat Sim</span>
            {encounterMetrics.totalMonsters > 0 && (
              <span className="badge-counter">{encounterMetrics.totalMonsters}</span>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="main-content">
        {/* Left Filter Sidebar */}
        <aside className="filters-sidebar">
          {/* Quick Search Box with Keyword Intelligence */}
          <div>
            <div className="filter-section-title">
              <span>Intelligent Search</span>
              <Search size={14} />
            </div>
            <div className="search-input-wrapper">
              <Search size={16} />
              <input 
                id="monster-search-input"
                type="text"
                className="search-input"
                placeholder='e.g. "Wisdom", "Fire immune", "Lich"...'
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <p className="filter-subtext">
              Filters by name, saving throws (e.g. <em>"Wisdom save"</em>), traits, actions, spells, or damage types.
            </p>
          </div>

          {/* Reset All Filters Button */}
          {activeFiltersCount > 0 && (
            <button 
              id="clear-all-filters-btn"
              className="clear-filters-btn"
              onClick={handleResetFilters}
            >
              <RotateCcw size={13} />
              <span>Clear filters ({activeFiltersCount})</span>
            </button>
          )}

          {/* Creature Type Filter */}
          <div>
            <div className="filter-section-title">
              <span>Creature Type</span>
              <Compass size={14} />
            </div>
            <select 
              id="type-filter-select"
              className="select-styled"
              style={{ width: '100%' }}
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
            >
              <option value="ALL">All Types ({creatureTypes.length})</option>
              {creatureTypes.map(t => (
                <option key={t} value={t}>{t.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Environment / Habitat (5e Tools) */}
          <div>
            <div className="filter-section-title">
              <span>Environment / Habitat</span>
              <Compass size={14} />
            </div>
            <select 
              id="environment-filter-select"
              className="select-styled"
              style={{ width: '100%' }}
              value={selectedEnvironment}
              onChange={e => setSelectedEnvironment(e.target.value)}
            >
              <option value="ALL">All Habitats</option>
              {ENVIRONMENTS.map(env => (
                <option key={env.id} value={env.id}>{env.label}</option>
              ))}
            </select>
          </div>

          {/* Size Filter */}
          <div>
            <div className="filter-section-title">
              <span>Size</span>
              <SlidersHorizontal size={14} />
            </div>
            <div className="filter-chips-grid">
              {SIZES.map(s => {
                const isSelected = selectedSizes.includes(s.id);
                return (
                  <button 
                    key={s.id}
                    title={s.title}
                    className={`chip-btn ${isSelected ? 'active-amber' : ''}`}
                    onClick={() => toggleFilterItem(selectedSizes, setSelectedSizes, s.id)}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CR Filter Range & Presets */}
          <div>
            <div className="filter-section-title">
              <span>Challenge Rating (CR: {selectedCrRange.min} - {selectedCrRange.max})</span>
              <Shield size={14} />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                id="cr-min-input"
                type="number"
                min="0"
                max="30"
                className="select-styled"
                style={{ width: '70px' }}
                value={selectedCrRange.min}
                onChange={e => setSelectedCrRange(prev => ({ ...prev, min: Number(e.target.value) }))}
              />
              <span style={{ color: 'var(--text-dark)' }}>to</span>
              <input 
                id="cr-max-input"
                type="number"
                min="0"
                max="30"
                className="select-styled"
                style={{ width: '70px' }}
                value={selectedCrRange.max}
                onChange={e => setSelectedCrRange(prev => ({ ...prev, max: Number(e.target.value) }))}
              />
            </div>
            <div className="cr-presets">
              <span 
                className={`cr-preset-chip ${selectedCrRange.min === 0 && selectedCrRange.max === 4 ? 'active' : ''}`}
                onClick={() => setSelectedCrRange({ min: 0, max: 4 })}
              >
                T1 (0-4)
              </span>
              <span 
                className={`cr-preset-chip ${selectedCrRange.min === 5 && selectedCrRange.max === 10 ? 'active' : ''}`}
                onClick={() => setSelectedCrRange({ min: 5, max: 10 })}
              >
                T2 (5-10)
              </span>
              <span 
                className={`cr-preset-chip ${selectedCrRange.min === 11 && selectedCrRange.max === 16 ? 'active' : ''}`}
                onClick={() => setSelectedCrRange({ min: 11, max: 16 })}
              >
                T3 (11-16)
              </span>
              <span 
                className={`cr-preset-chip ${selectedCrRange.min === 17 && selectedCrRange.max === 30 ? 'active' : ''}`}
                onClick={() => setSelectedCrRange({ min: 17, max: 30 })}
              >
                T4 (17+)
              </span>
              <span 
                className={`cr-preset-chip ${selectedCrRange.min === 0 && selectedCrRange.max === 30 ? 'active' : ''}`}
                onClick={() => setSelectedCrRange({ min: 0, max: 30 })}
              >
                All
              </span>
            </div>
          </div>

          {/* Saving Throws Forced on Targets (Offensive Saves - 5e Tools) */}
          <div>
            <div className="filter-section-title" title="Filters creatures that force saving throws on targets with attacks, spells, or traits">
              <span>Offensive Saves Forced</span>
              <Zap size={14} style={{ color: '#fbbf24' }} />
            </div>
            <div className="filter-chips-grid">
              {SAVES.map(sv => {
                const isSelected = selectedForcesSaves.includes(sv.id);
                return (
                  <button 
                    key={sv.id}
                    id={`filter-forces-save-${sv.id}`}
                    title={`Creatures that force ${sv.label} saving throws`}
                    className={`chip-btn ${isSelected ? 'active-amber' : ''}`}
                    onClick={() => toggleFilterItem(selectedForcesSaves, setSelectedForcesSaves, sv.id)}
                  >
                    <Zap size={11} style={{ opacity: isSelected ? 1 : 0.6 }} />
                    {sv.label}
                  </button>
                );
              })}
            </div>
            <p className="filter-subtext">
              Breaths, poisons, spells, auras, or gazes that impose saving throws on targets.
            </p>
          </div>

          {/* Saving Throws Proficiency (Defensive Saves - 5e Tools) */}
          <div>
            <div className="filter-section-title" title="Filters creatures with proficiency in saving throws">
              <span>Defensive Saves (Proficient)</span>
              <Shield size={14} style={{ color: '#10b981' }} />
            </div>
            <div className="filter-chips-grid">
              {SAVES.map(sv => {
                const isSelected = selectedSaves.includes(sv.id);
                return (
                  <button 
                    key={sv.id}
                    id={`filter-save-${sv.id}`}
                    title={`Creatures with defensive proficiency in ${sv.label} saves`}
                    className={`chip-btn ${isSelected ? 'active-emerald' : ''}`}
                    onClick={() => toggleFilterItem(selectedSaves, setSelectedSaves, sv.id)}
                  >
                    <Shield size={11} style={{ opacity: isSelected ? 1 : 0.6 }} />
                    {sv.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Movement Types (5e Tools) */}
          <div>
            <div className="filter-section-title">
              <span>Movement / Speed</span>
              <Wind size={14} />
            </div>
            <div className="filter-chips-grid">
              {SPEEDS.map(sp => {
                const isSelected = selectedSpeeds.includes(sp.id);
                return (
                  <button 
                    key={sp.id}
                    className={`chip-btn ${isSelected ? 'active-blue' : ''}`}
                    onClick={() => toggleFilterItem(selectedSpeeds, setSelectedSpeeds, sp.id)}
                  >
                    {sp.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Senses (5e Tools) */}
          <div>
            <div className="filter-section-title">
              <span>Special Senses</span>
              <Eye size={14} />
            </div>
            <div className="filter-chips-grid">
              {SENSES.map(sn => {
                const isSelected = selectedSenses.includes(sn.id);
                return (
                  <button 
                    key={sn.id}
                    className={`chip-btn ${isSelected ? 'active-amber' : ''}`}
                    onClick={() => toggleFilterItem(selectedSenses, setSelectedSenses, sn.id)}
                  >
                    {sn.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Damage Immunities (5e Tools) */}
          <div>
            <div className="filter-section-title">
              <span>Damage Immunities</span>
              <Skull size={14} />
            </div>
            <div className="filter-chips-grid">
              {DAMAGE_TYPES.map(dt => {
                const isSelected = selectedDamageImmunities.includes(dt.id);
                return (
                  <button 
                    key={dt.id}
                    className={`chip-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleFilterItem(selectedDamageImmunities, setSelectedDamageImmunities, dt.id)}
                  >
                    {dt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Damage Resistances (5e Tools) */}
          <div>
            <div className="filter-section-title">
              <span>Damage Resistances</span>
              <Shield size={14} />
            </div>
            <div className="filter-chips-grid">
              {DAMAGE_TYPES.map(dt => {
                const isSelected = selectedDamageResistances.includes(dt.id);
                return (
                  <button 
                    key={dt.id}
                    className={`chip-btn ${isSelected ? 'active-blue' : ''}`}
                    onClick={() => toggleFilterItem(selectedDamageResistances, setSelectedDamageResistances, dt.id)}
                  >
                    {dt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Condition Immunities (5e Tools) */}
          <div>
            <div className="filter-section-title">
              <span>Condition Immunities</span>
              <Activity size={14} />
            </div>
            <div className="filter-chips-grid">
              {CONDITIONS.map(cond => {
                const isSelected = selectedConditionImmunities.includes(cond.id);
                return (
                  <button 
                    key={cond.id}
                    className={`chip-btn ${isSelected ? 'active-amber' : ''}`}
                    onClick={() => toggleFilterItem(selectedConditionImmunities, setSelectedConditionImmunities, cond.id)}
                  >
                    {cond.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Environment / Habitat (5e Tools) */}
          <div>
            <div className="filter-section-title">
              <span>Environment</span>
              <Compass size={14} />
            </div>
            <select 
              id="environment-filter-select"
              className="select-styled"
              style={{ width: '100%' }}
              value={selectedEnvironment}
              onChange={e => setSelectedEnvironment(e.target.value)}
            >
              <option value="ALL">All Environments</option>
              {ENVIRONMENTS.map(env => (
                <option key={env.id} value={env.id}>{env.label}</option>
              ))}
            </select>
          </div>

          {/* Combat Features & Token Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="filter-section-title">
              <span>Combat Traits</span>
              <Sparkles size={14} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <input 
                id="legendary-filter-check"
                type="checkbox"
                checked={hasLegendary}
                onChange={e => setHasLegendary(e.target.checked)}
                style={{ accentColor: 'var(--accent-crimson)' }}
              />
              <span>Legendary Actions</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <input 
                id="spellcaster-filter-check"
                type="checkbox"
                checked={isSpellcaster}
                onChange={e => setIsSpellcaster(e.target.checked)}
                style={{ accentColor: 'var(--accent-crimson)' }}
              />
              <span>Spellcaster</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <input 
                id="token-filter-check"
                type="checkbox"
                checked={hasTokenOnly}
                onChange={e => setHasTokenOnly(e.target.checked)}
                style={{ accentColor: 'var(--accent-crimson)' }}
              />
              <span>Only with VTT Token</span>
            </label>
          </div>
        </aside>

        {/* Center: Creature Cards Grid */}
        <main className="creatures-view">
          <div className="view-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span className="result-count">
                Showing <strong>{groupVersions ? filteredCreatureGroups.length : flatFilteredCreatures.length}</strong> {groupVersions ? 'unique creatures' : 'creatures'}
                {groupVersions && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', marginLeft: '6px' }}>
                    ({totalMatchingVersionsCount} indexed versions)
                  </span>
                )}
              </span>

              {/* Grouping Toggle Button */}
              <button 
                type="button"
                className={`group-toggle-btn ${groupVersions ? 'active' : ''}`}
                onClick={() => setGroupVersions(prev => !prev)}
                title={groupVersions ? "Click to view full flat list (without grouping reprints)" : "Click to group editions under a single creature entry"}
              >
                <Layers size={13} />
                <span>{groupVersions ? 'Grouped Versions' : 'Flat List'}</span>
              </button>

              {/* Quick Edition Selector Pills */}
              <div className="edition-filter-group" title="Filter creatures by rules edition or source type">
                <button 
                  type="button"
                  className={`edition-btn ${selectedEdition === 'ALL' ? 'active' : ''}`}
                  onClick={() => setSelectedEdition('ALL')}
                >
                  All
                </button>
                <button 
                  type="button"
                  className={`edition-btn btn-2024-filter ${selectedEdition === '2024' ? 'active' : ''}`}
                  onClick={() => setSelectedEdition(selectedEdition === '2024' ? 'ALL' : '2024')}
                  title="Show creatures with official 2024 revised edition (XMM, XPHB, XDMG)"
                >
                  ✨ 2024
                </button>
                <button 
                  type="button"
                  className={`edition-btn btn-2014-filter ${selectedEdition === '2014' ? 'active' : ''}`}
                  onClick={() => setSelectedEdition(selectedEdition === '2014' ? 'ALL' : '2014')}
                  title="Show creatures with official 2014 classic edition (Monster Manual, etc.)"
                >
                  📜 2014
                </button>
                <button 
                  type="button"
                  className={`edition-btn btn-3pp-filter ${selectedEdition === '3pp' ? 'active' : ''}`}
                  onClick={() => setSelectedEdition(selectedEdition === '3pp' ? 'ALL' : '3pp')}
                  title="Show creatures from professional Third-Party publishers (Kobold Press, MCDM, etc.)"
                >
                  🛡️ 3PP Pro
                </button>
                <button 
                  type="button"
                  className={`edition-btn btn-crossover-filter ${selectedEdition === 'crossover' ? 'active' : ''}`}
                  onClick={() => setSelectedEdition(selectedEdition === 'crossover' ? 'ALL' : 'crossover')}
                  title="Show creatures from video game crossovers (Dark Souls, Monster Hunter, etc.)"
                >
                  🎮 Crossovers
                </button>
              </div>
            </div>

            <div className="sort-controls">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)' }}>Sort by:</span>
              <select 
                className="select-styled"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="cr-asc">Challenge Rating (Low to High)</option>
                <option value="cr-desc">Challenge Rating (High to Low)</option>
                <option value="hp-desc">Hit Points (HP)</option>
                <option value="ac-desc">Armor Class (AC)</option>
              </select>
            </div>
          </div>

          <div className="creatures-scroll-area">
            <div className="creatures-grid">
              {(groupVersions ? filteredCreatureGroups : flatFilteredCreatures).slice(0, visibleCount).map(item => {
                const isGroup = groupVersions;
                const group = isGroup ? item : null;
                const creature = isGroup ? item.activeVersion : item;

                return (
                  <div 
                    key={creature.id}
                    className="creature-card"
                    onClick={() => setActiveModalCreature(creature)}
                  >
                    <div className="card-top">
                      <div className="creature-token">
                        {creature.hasToken ? (
                          <img 
                            src={creature.tokenUrl} 
                            alt={creature.name}
                            loading="lazy"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="token-fallback">
                            {creature.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="card-meta">
                        <h3 className="card-name" title={creature.name}>{creature.name}</h3>
                        <p className="card-type-line">
                          {creature.size} {creature.type}
                          {creature.typeTags && creature.typeTags.length > 0 ? ` (${creature.typeTags.join(', ')})` : ''}
                        </p>
                      </div>

                      <div className="cr-badge">
                        <span>CR</span>
                        {creature.cr}
                      </div>
                    </div>

                    {/* Version Switcher Bar on the Card (When creature has multiple editions/versions) */}
                    {isGroup && group.hasMultipleVersions && (
                      <div className="card-versions-bar">
                        <div className="card-versions-header">
                          <span className="card-versions-title">
                            <Sparkles size={11} /> {group.versions.length} {group.versions.length === 1 ? 'version' : 'versions'}
                          </span>
                          <span className={`card-versions-active-tag tag-${creature.versionMeta.pillType}`}>
                            {creature.versionMeta.shortLabel}
                          </span>
                        </div>

                        <div className="card-version-pills-row">
                          {group.versions.map(v => {
                            const isSelected = v.id === creature.id;
                            return (
                              <button
                                key={v.id}
                                type="button"
                                className={`card-version-btn ${isSelected ? 'active' : ''} btn-${v.versionMeta.pillType}`}
                                onClick={(e) => {
                                   e.stopPropagation();
                                   setCardVersionOverrides(prev => ({ ...prev, [group.groupKey]: v.id }));
                                }}
                                title={`${v.versionMeta.shortLabel} (${v.sourceGroup || v.source}) — CR ${v.cr}, HP ${v.hp}, AC ${v.ac}`}
                              >
                                {v.versionMeta.is2024 && <span className="btn-sparkle">✨</span>}
                                {v.versionMeta.is2014 && <span className="btn-sparkle">📜</span>}
                                {v.versionMeta.badge}
                                {v.cr !== group.versions[0].cr && (
                                  <span className="pill-cr-delta">CR {v.cr}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="card-stats-row">
                      <div className="card-stat-item">
                        <span className="card-stat-label">AC / Armor</span>
                        <span className="card-stat-val">{creature.ac}</span>
                      </div>
                      <div className="card-stat-item">
                        <span className="card-stat-label">HP / Hit Points</span>
                        <span className="card-stat-val">{creature.hp}</span>
                      </div>
                      <div className="card-stat-item">
                        <span className="card-stat-label">Speed</span>
                        <span className="card-stat-val">
                          {(creature.speed && typeof creature.speed === 'object')
                            ? (typeof creature.speed.walk === 'number'
                                ? `${creature.speed.walk} ft`
                                : (creature.speed.walk 
                                    ? `${creature.speed.walk} ft` 
                                    : (creature.speed.fly ? `fly ${creature.speed.fly} ft` : (creature.speed.swim ? `swim ${creature.speed.swim} ft` : '0 ft'))))
                            : (typeof creature.speed === 'number'
                                ? `${creature.speed} ft`
                                : (typeof creature.speed === 'string' ? creature.speed : '30 ft'))
                          }
                        </span>
                      </div>
                    </div>

                    {(creature.forcesSaves?.length > 0 || (creature.save && Object.keys(creature.save).length > 0)) && (
                      <div className="card-saves-row">
                        {creature.forcesSaves?.length > 0 && (
                          <span className="card-forces-saves-badge" title="Saving throws forced on targets">
                            <Zap size={10} />
                            Forces: {creature.forcesSaves.map(s => s.toUpperCase()).join(', ')}
                          </span>
                        )}
                        {creature.save && Object.keys(creature.save).length > 0 && (
                          <span className="card-def-saves-badge" title="Saving throws in which the creature is proficient">
                            <Shield size={10} />
                            Def: {Object.keys(creature.save).map(s => s.toUpperCase()).join(', ')}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="card-bottom-actions">
                      <div className="card-source-badges">
                        <span className={`publisher-pill ${
                          creature.category === 'Third-Party (3PP Pro)' 
                            ? 'pill-3pp' 
                            : creature.category === 'Crossover / Video Games' 
                              ? 'pill-crossover' 
                              : 'pill-wotc'
                        }`}>
                          {creature.publisher || 'WotC'}
                        </span>
                        <span className="source-pill" title={creature.sourceGroup}>
                          {creature.sourceGroup}
                        </span>
                      </div>

                      <button 
                        className="add-encounter-btn"
                        onClick={(e) => handleAddToEncounter(creature, e)}
                        title="Add to encounter"
                      >
                        <Plus size={14} />
                        <span>Add to Encounter</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button when there are more matching creatures */}
            {(groupVersions ? filteredCreatureGroups : flatFilteredCreatures).length > visibleCount && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0 16px', width: '100%' }}>
                <button
                  type="button"
                  className="btn-load-more"
                  onClick={() => setVisibleCount(prev => prev + 60)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    color: '#fde68a',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}
                >
                  <span>Load more creatures (Showing {visibleCount} of {(groupVersions ? filteredCreatureGroups : flatFilteredCreatures).length})</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Right Drawer: Encounter Builder & Combat Simulator */}
        {isEncounterOpen && (
          <aside className="encounter-drawer">
            <div className="drawer-header">
              <span className="drawer-title">
                <Swords size={18} color="#e11d48" />
                <span>Encounter & BattleSim Suite</span>
              </span>
              <button 
                className="close-btn"
                onClick={() => setIsEncounterOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="drawer-content">
              {/* 1. Party Manager Card */}
              <div className="panel-card">
                {/* Party Mode Segmented Tabs */}
                <div className="party-mode-tabs">
                  <button 
                    id="party-mode-custom-btn"
                    className={`party-tab-btn ${partyMode === 'custom' ? 'active' : ''}`}
                    onClick={() => setPartyMode('custom')}
                  >
                    <Users size={14} />
                    <span>My Players ({customPlayers.length})</span>
                  </button>
                  <button 
                    id="party-mode-generic-btn"
                    className={`party-tab-btn ${partyMode === 'generic' ? 'active' : ''}`}
                    onClick={() => setPartyMode('generic')}
                  >
                    <SlidersHorizontal size={14} />
                    <span>Quick Party ({partyGroups.reduce((sum, g) => sum + (Number(g.count) || 0), 0)})</span>
                  </button>
                </div>

                {partyMode === 'custom' ? (
                  /* Custom Players Mode */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <PartySyncBar 
                      customPlayers={customPlayers}
                      onPartyLoaded={(newParty) => setCustomPlayers(newParty)}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Player Character Roster
                      </span>
                      <button 
                        onClick={handleResetCustomParty}
                        title="Reset to default 4-player party"
                        style={{ fontSize: '0.7rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '3px' }}
                      >
                        <RotateCcw size={10} /> Reset
                      </button>
                    </div>

                    <div className="custom-players-list">
                      {customPlayers.map((player) => (
                        <div key={player.id} className="custom-player-card">
                          <div className="custom-player-header">
                            <input 
                              type="text"
                              className="player-name-input"
                              placeholder="PC Name"
                              value={player.name}
                              onChange={e => handleUpdateCustomPlayer(player.id, 'name', e.target.value)}
                              title="Character Name"
                            />

                            <select 
                              className="player-class-select"
                              value={player.className}
                              onChange={e => {
                                const newClass = e.target.value;
                                const stats = getStatsForClassAndLevel(newClass, player.level);
                                setCustomPlayers(prev => prev.map(p => {
                                  if (p.id !== player.id) return p;
                                  return {
                                    ...p,
                                    className: newClass,
                                    hp: stats.hp,
                                    ac: stats.ac,
                                    toHit: stats.toHit,
                                    dpr: stats.dpr
                                  };
                                }));
                              }}
                              title="D&D Class (updates suggested stats on change)"
                            >
                              {DND_CLASSES.map(cls => (
                                <option key={cls} value={cls}>{cls}</option>
                              ))}
                            </select>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Lv</span>
                              <input 
                                type="number"
                                min="1"
                                max="20"
                                className="player-level-input"
                                value={player.level}
                                onChange={e => {
                                  const newLvl = Math.max(1, Math.min(20, Number(e.target.value) || 1));
                                  handleUpdateCustomPlayer(player.id, 'level', newLvl);
                                }}
                                title="Character Level (1-20)"
                              />
                            </div>

                            {customPlayers.length > 1 && (
                              <button 
                                className="player-delete-btn"
                                onClick={() => handleRemoveCustomPlayer(player.id)}
                                title="Remove this player"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>

                          {/* 4 Essential Stats Grid: HP, AC, +ToHit, DPR */}
                          <div className="custom-player-stats-grid">
                            <div className="stat-field-mini">
                              <span className="stat-field-label">HP</span>
                              <input 
                                type="number"
                                min="1"
                                max="999"
                                className="stat-field-input"
                                value={player.hp}
                                onChange={e => handleUpdateCustomPlayer(player.id, 'hp', e.target.value)}
                                title="Max Hit Points"
                              />
                            </div>

                            <div className="stat-field-mini">
                              <span className="stat-field-label">AC</span>
                              <input 
                                type="number"
                                min="1"
                                max="40"
                                className="stat-field-input"
                                value={player.ac}
                                onChange={e => handleUpdateCustomPlayer(player.id, 'ac', e.target.value)}
                                title="Armor Class"
                              />
                            </div>

                            <div className="stat-field-mini">
                              <span className="stat-field-label" title="Main attack bonus (+To-Hit, e.g. +7). For save-based casters, enter DC - 8">+ATK</span>
                              <input 
                                type="number"
                                min="-5"
                                max="25"
                                className="stat-field-input"
                                value={player.toHit}
                                onChange={e => handleUpdateCustomPlayer(player.id, 'toHit', e.target.value)}
                                title="Main Attack Bonus (+To-Hit, e.g. +7). For spellcasters using saves, enter (Save DC - 8)."
                              />
                            </div>

                            <div className="stat-field-mini">
                              <span className="stat-field-label">DPR</span>
                              <input 
                                type="number"
                                min="1"
                                max="500"
                                className="stat-field-input"
                                value={player.dpr}
                                onChange={e => handleUpdateCustomPlayer(player.id, 'dpr', e.target.value)}
                                title="Average Damage Per Round (DPR)"
                              />
                            </div>

                            <button 
                              className="preset-magic-btn"
                              onClick={() => handleApplyClassPreset(player.id)}
                              title="Automatically recalculate suggested HP, AC, Atk, and DPR for this class and level"
                            >
                              <Sparkles size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button 
                      id="add-custom-player-btn"
                      className="add-player-btn"
                      onClick={handleAddCustomPlayer}
                    >
                      <Plus size={14} />
                      <span>Add Player to Table</span>
                    </button>
                  </div>
                ) : (
                  /* Generic Mode (KFC Groups by Level) */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Generic Level Groups
                      </span>
                      <button 
                        onClick={handleAddPartyGroup}
                        style={{ color: '#38bdf8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={12} /> Add Level Group
                      </button>
                    </div>

                    {partyGroups.map(group => (
                      <div key={group.id} className="party-group-row">
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Count:</span>
                        <input 
                          type="number"
                          min="1"
                          max="10"
                          className="select-styled"
                          style={{ width: '50px', padding: '3px 6px' }}
                          value={group.count}
                          onChange={e => handleUpdatePartyGroup(group.id, 'count', e.target.value)}
                        />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Level:</span>
                        <input 
                          type="number"
                          min="1"
                          max="20"
                          className="select-styled"
                          style={{ width: '55px', padding: '3px 6px' }}
                          value={group.level}
                          onChange={e => handleUpdatePartyGroup(group.id, 'level', e.target.value)}
                        />
                        {partyGroups.length > 1 && (
                          <button 
                            onClick={() => handleRemovePartyGroup(group.id)}
                            style={{ marginLeft: 'auto', color: '#f43f5e' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dark)', marginTop: '4px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                  <span>Rules System:</span>
                  <select 
                    className="select-styled"
                    style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                    value={rulesSystem}
                    onChange={e => setRulesSystem(e.target.value)}
                  >
                    <option value="2014">D&D 5e (2014 DMG)</option>
                    <option value="2024">D&D 5.5e (2024 Revised)</option>
                  </select>
                </div>
              </div>

              {/* 2. Monster Roster Card */}
              <div className="panel-card">
                <div className="panel-card-title">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Skull size={14} />
                    <span>Monsters in Combat ({encounterMetrics.totalMonsters})</span>
                  </span>
                  {encounterMonsters.length > 0 && (
                    <button 
                      onClick={() => setEncounterMonsters([])}
                      style={{ color: '#f43f5e', fontSize: '0.75rem' }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {encounterMonsters.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dark)', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                    Click "+ Add to Encounter" on any creature card to add it.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {encounterMonsters.map(({ creature, count }) => (
                      <div key={creature.id} className="encounter-monster-item">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{creature.name}</span>
                            <span className={`publisher-pill ${
                              creature.category === 'Third-Party (3PP Pro)' 
                                ? 'pill-3pp' 
                                : creature.category === 'Crossover / Video Games' 
                                  ? 'pill-crossover' 
                                  : 'pill-wotc'
                            }`} style={{ fontSize: '0.6rem', padding: '0 4px' }}>
                              {creature.versionMeta?.badge || creature.source}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            CR {creature.cr} &bull; {creature.xp.toLocaleString()} XP each
                          </div>
                        </div>

                        <div className="count-stepper">
                          <button className="step-btn" onClick={() => handleUpdateMonsterCount(creature.id, -1)}>
                            <Minus size={12} />
                          </button>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '18px', textAlign: 'center' }}>
                            {count}
                          </span>
                          <button className="step-btn" onClick={() => handleUpdateMonsterCount(creature.id, 1)}>
                            <Plus size={12} />
                          </button>
                          <button 
                            onClick={() => handleRemoveMonster(creature.id)}
                            style={{ color: 'var(--text-dark)', marginLeft: '4px' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Kobold+ Fight Club Difficulty Meter */}
              <div className="difficulty-meter">
                <div className="meter-header">
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Official Difficulty (KFC)
                  </span>
                  <span 
                    className="difficulty-badge"
                    style={{ 
                      background: `${encounterMetrics.difficultyColor}22`,
                      color: encounterMetrics.difficultyColor,
                      border: `1px solid ${encounterMetrics.difficultyColor}66`
                    }}
                  >
                    {encounterMetrics.difficulty}
                  </span>
                </div>

                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${Math.min(100, Math.max(8, encounterMetrics.intensity * 100))}%`,
                      background: encounterMetrics.difficultyColor
                    }} 
                  />
                </div>

                <div className="meter-stats-row">
                  <span>Raw XP: <strong>{encounterMetrics.rawXp.toLocaleString()} XP</strong></span>
                  {rulesSystem === '2014' && (
                    <span>Mult: <strong>&times;{encounterMetrics.multiplier}</strong> ({encounterMetrics.adjustedXp.toLocaleString()} Adjusted XP)</span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', fontSize: '0.65rem', textAlign: 'center', marginTop: '4px', color: 'var(--text-dark)' }}>
                  <div>Easy: {encounterMetrics.partyBudget.easy?.toLocaleString() || encounterMetrics.partyBudget.low?.toLocaleString()}</div>
                  <div>Medium: {encounterMetrics.partyBudget.medium?.toLocaleString() || encounterMetrics.partyBudget.moderate?.toLocaleString()}</div>
                  <div>Hard: {encounterMetrics.partyBudget.hard?.toLocaleString() || encounterMetrics.partyBudget.high?.toLocaleString()}</div>
                  <div>Deadly: {encounterMetrics.partyBudget.deadly?.toLocaleString() || '—'}</div>
                </div>
              </div>

              {/* 4. BattleSim Combat Simulator Card */}
              <div className="simulator-panel">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'Cinzel', fontWeight: 700, fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={16} color="#e11d48" />
                    <span>BattleSim: Tactical Combat Simulator</span>
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)' }}>Markov Model</span>
                </div>

                {/* Luck Slider */}
                <div className="luck-slider-row">
                  <div className="luck-labels">
                    <span>Luck Factor: <strong>{luck < 0.45 ? 'Unlucky' : luck > 0.55 ? 'Lucky' : 'Neutral'} ({(luck * 100).toFixed(0)}%)</strong></span>
                    <span>1d20 Avg: {(21 * luck).toFixed(1)}</span>
                  </div>
                  <input 
                    type="range"
                    min="0.35"
                    max="0.65"
                    step="0.01"
                    className="range-slider"
                    value={luck}
                    onChange={e => setLuck(parseFloat(e.target.value))}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-dark)' }}>
                    <span>0.35 (Terrible run)</span>
                    <span>0.50 (Standard)</span>
                    <span>0.65 (Epic crits)</span>
                  </div>
                </div>

                <button 
                  className="simulate-action-btn"
                  onClick={handleRunSimulation}
                  disabled={encounterMonsters.length === 0}
                >
                  <Play size={16} />
                  <span>{isSimulating ? 'Simulating...' : 'Simulate Combat'}</span>
                </button>

                {simResult && encounterMonsters.length > 0 && (
                  <div className="simulation-results-box">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: simResult.victory ? '#34d399' : '#f43f5e' }}>
                        {simResult.victory ? 'Estimated Party Victory' : 'Critical TPK Risk'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {simResult.rounds} Avg Rounds
                      </span>
                    </div>

                    <div className="sim-metrics-grid">
                      <div className="metric-card">
                        <div className="metric-val" style={{ color: simResult.partyRemainingHpPercent > 50 ? '#34d399' : '#fbbf24' }}>
                          {simResult.partyRemainingHpPercent}%
                        </div>
                        <div className="metric-label">Party Remaining HP</div>
                      </div>

                      <div className="metric-card">
                        <div className="metric-val" style={{ color: simResult.tpkRisk > 50 ? '#ef4444' : simResult.tpkRisk > 20 ? '#fbbf24' : '#34d399' }}>
                          {simResult.tpkRisk}%
                        </div>
                        <div className="metric-label">TPK Risk</div>
                      </div>

                      <div className="metric-card">
                        <div className="metric-val" style={{ color: '#38bdf8' }}>
                          {simResult.rounds} Rds
                        </div>
                        <div className="metric-label">Combat Duration</div>
                      </div>
                      <div className="metric-label">TPK Risk</div>
                    </div>

                    {/* Detailed Health Bars for Players */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Estimated Final State of Heroes:
                      </span>
                      {simResult.playersSummary?.map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: 'rgba(0,0,0,0.25)', padding: '4px 6px', borderRadius: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                              <span style={{ fontWeight: 600, color: p.isAlive ? '#f8fafc' : '#ef4444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.name}
                              </span>
                              {p.className && (
                                <span style={{ fontSize: '0.65rem', color: '#93c5fd', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>
                                  {p.className}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono', color: p.isAlive ? 'var(--text-muted)' : '#ef4444' }}>
                              {p.isAlive ? `${p.currentHp}/${p.maxHp} HP (${p.hpPercent}%)` : 'DOWN (0 HP)'}
                            </span>
                          </div>
                          <div style={{ height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${p.hpPercent}%`, height: '100%', background: p.hpPercent > 40 ? '#10b981' : p.hpPercent > 15 ? '#f59e0b' : '#ef4444', transition: 'width 0.3s ease' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </aside>
        )}
      </div>

      {/* Creature Statblock Modal */}
      {activeModalCreature && (
        <div className="modal-overlay" onClick={() => setActiveModalCreature(null)}>
          <CreatureStatblock 
            creature={activeModalCreature}
            modalGroup={modalGroup}
            onSelectVersion={(v) => {
              setActiveModalCreature(v);
              setCardVersionOverrides(prev => ({ ...prev, [modalGroup.groupKey]: v.id }));
            }}
            modalVersionDiffs={modalVersionDiffs}
            comparisonBaseline={comparisonBaseline}
            onAddToEncounter={(c) => {
              handleAddToEncounter(c);
              setActiveModalCreature(null);
            }}
            onClose={() => setActiveModalCreature(null)}
          />
        </div>
      )}
    </div>
  );
}