/**
 * Version Manager for D&D 5e Bestiary
 * Manages creature version detection, grouping of reprints/variants,
 * and statistical diff computation (2024 Revised vs 2014 Classic, 3PP, Crossovers).
 */

/**
 * Returns structured metadata describing a creature's edition, origin, and label.
 */
export function getCreatureVersionMeta(c) {
  if (!c) return { badge: '', shortLabel: '', pillType: 'wotc', priority: 99 };

  const src = (c.source || '').toUpperCase();
  const srcGrp = (c.sourceGroup || '').toLowerCase();
  
  const is2024 = src === 'XMM' || src === 'XPHB' || src === 'XDMG' || 
                 srcGrp.includes('xmm') || srcGrp.includes('2024') || srcGrp.includes('revised');
  const is2014 = src === 'MM' || src === 'PHB' || src === 'DMG' || srcGrp.includes('2014');
  const is3pp = c.category === 'Third-Party (3PP Pro)';
  const isCrossover = c.category === 'Crossover / Video Games';

  let badge = c.source || 'WotC';
  let shortLabel = c.sourceGroup || c.source || 'Official';
  let pillType = 'wotc';
  let priority = 3;

  if (is2024) {
    badge = '2024';
    shortLabel = '2024 Revised';
    pillType = '2024';
    priority = 1;
  } else if (is2014) {
    badge = '2014';
    shortLabel = '2014 Classic';
    pillType = '2014';
    priority = 2;
  } else if (src === 'MPMM') {
    badge = 'MPMM';
    shortLabel = 'Multiverse (MPMM)';
    pillType = 'wotc';
    priority = 2.5;
  } else if (src === 'VGM') {
    badge = 'VGM';
    shortLabel = "Volo's (VGM)";
    pillType = 'wotc';
    priority = 2.8;
  } else if (src === 'MTF') {
    badge = 'MTF';
    shortLabel = "Mordenkainen (MTF)";
    pillType = 'wotc';
    priority = 2.9;
  } else if (is3pp) {
    const pub = c.publisher ? c.publisher.replace(' Productions', '').replace(' Press', '') : '3PP';
    badge = pub;
    shortLabel = `${pub}: ${c.sourceGroup || c.source}`;
    pillType = '3pp';
    priority = 4;
  } else if (isCrossover) {
    const pub = c.publisher || 'Crossover';
    badge = pub.split('/')[0].trim();
    shortLabel = `${c.publisher}: ${c.sourceGroup || c.source}`;
    pillType = 'crossover';
    priority = 5;
  }

  // Check if it was a hollow stub (10 HP, 10 AC, 0 actions)
  const isHollow = c.hp === 10 && c.ac === 10 && c.str === 10 && c.dex === 10 && 
                  (c.cr === '0' || c.crNumeric === 0) && (!c.action || c.action.length === 0);
  if (isHollow) {
    priority += 20;
  }

  return {
    is2024,
    is2014,
    is3pp,
    isCrossover,
    badge,
    shortLabel,
    fullLabel: c.sourceGroup ? `${c.sourceGroup} (${c.source})` : c.source,
    pillType,
    priority,
    isHollow
  };
}

/**
 * Repairs hollow copy stubs by inheriting valid stats from base creatures of the same name.
 */
export function repairHollowCopies(creaturesList) {
  const validMap = new Map();

  // 1. Index high quality base creatures
  for (const c of creaturesList) {
    const isHollow = c.hp === 10 && c.ac === 10 && c.str === 10 && c.dex === 10 && 
                    (c.cr === '0' || c.crNumeric === 0) && (!c.action || c.action.length === 0);
    if (!isHollow) {
      const key = (c.name || '').trim().toLowerCase();
      // Prioritize primary editions: MM, XMM, MPMM, FleeMortals, etc.
      if (!validMap.has(key) || c.source === 'MM' || c.source === 'XMM' || c.source === 'FleeMortals') {
        validMap.set(key, c);
      }
    }
  }

  // 2. Inherit for hollow stubs
  return creaturesList.map(c => {
    const isHollow = c.hp === 10 && c.ac === 10 && c.str === 10 && c.dex === 10 && 
                    (c.cr === '0' || c.crNumeric === 0) && (!c.action || c.action.length === 0);
    if (isHollow) {
      const key = (c.name || '').trim().toLowerCase();
      const base = validMap.get(key);
      if (base) {
        return {
          ...base,
          id: c.id,
          source: c.source,
          sourceGroup: c.sourceGroup,
          category: c.category,
          publisher: c.publisher,
          hasToken: c.hasToken || base.hasToken,
          tokenUrl: c.tokenUrl || base.tokenUrl,
          _isReprintOf: base.source
        };
      }
    }
    return c;
  });
}

/**
 * Groups a list of creatures by normalized name, sorting their versions by edition priority.
 * Returns: { groups: CreatureGroup[], groupsMap: Map<string, CreatureGroup> }
 */
export function groupCreaturesByName(creaturesList) {
  const groupsMap = new Map();

  for (const c of creaturesList) {
    const key = (c.name || '').trim().toLowerCase();
    if (!key) continue;

    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        groupKey: key,
        name: c.name,
        versions: []
      });
    }

    const versionMeta = getCreatureVersionMeta(c);
    groupsMap.get(key).versions.push({
      ...c,
      versionMeta
    });
  }

  const groups = [];

  for (const group of groupsMap.values()) {
    // Sort versions by priority: 2024 -> 2014 -> Core WotC -> 3PP -> Crossover -> Hollow
    group.versions.sort((a, b) => {
      const diff = a.versionMeta.priority - b.versionMeta.priority;
      if (diff !== 0) return diff;
      return (a.sourceGroup || '').localeCompare(b.sourceGroup || '');
    });

    group.hasMultipleVersions = group.versions.length > 1;
    group.defaultVersion = group.versions[0];
    groups.push(group);
  }

  return { groups, groupsMap };
}

/**
 * Computes the differences between a target creature and a baseline creature.
 * Useful for comparing 2024 Revised rules vs 2014 Classic rules or 3PP variants.
 */
export function computeVersionDiff(curr, base) {
  if (!curr || !base || curr.id === base.id) return [];
  const diffs = [];

  // CR Difference
  if (curr.cr !== base.cr) {
    diffs.push({
      label: 'CR',
      from: curr.cr,
      to: base.cr,
      text: `CR ${base.cr} → ${curr.cr}`
    });
  }

  // HP Difference
  if (curr.hp !== base.hp) {
    const delta = curr.hp - base.hp;
    diffs.push({
      label: 'HP',
      from: base.hp,
      to: curr.hp,
      delta: delta > 0 ? `+${delta}` : `${delta}`,
      text: `HP: ${base.hp} → ${curr.hp} (${delta > 0 ? `+${delta}` : delta})`
    });
  }

  // AC Difference
  if (curr.ac !== base.ac) {
    const delta = curr.ac - base.ac;
    diffs.push({
      label: 'CA',
      from: base.ac,
      to: curr.ac,
      delta: delta > 0 ? `+${delta}` : `${delta}`,
      text: `CA: ${base.ac} → ${curr.ac}`
    });
  }

  // Ability Scores
  ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
    if (curr[stat] !== base[stat]) {
      const delta = curr[stat] - base[stat];
      diffs.push({
        label: stat.toUpperCase(),
        from: base[stat],
        to: curr[stat],
        delta: delta > 0 ? `+${delta}` : `${delta}`,
        text: `${stat.toUpperCase()}: ${base[stat]} → ${curr[stat]}`
      });
    }
  });

  // Speeds
  const currWalk = curr.speed?.walk || 30;
  const baseWalk = base.speed?.walk || 30;
  if (currWalk !== baseWalk) {
    diffs.push({
      label: 'Velocidad',
      from: `${baseWalk} ft`,
      to: `${currWalk} ft`,
      text: `Velocidad: ${baseWalk} ft → ${currWalk} ft`
    });
  }

  // Actions count
  const currActions = curr.action ? curr.action.length : 0;
  const baseActions = base.action ? base.action.length : 0;
  if (currActions !== baseActions) {
    diffs.push({
      label: 'Acciones',
      from: baseActions,
      to: currActions,
      text: `Acciones: ${baseActions} → ${currActions}`
    });
  }

  // Traits count
  const currTraits = curr.trait ? curr.trait.length : 0;
  const baseTraits = base.trait ? base.trait.length : 0;
  if (currTraits !== baseTraits) {
    diffs.push({
      label: 'Rasgos',
      from: baseTraits,
      to: currTraits,
      text: `Rasgos: ${baseTraits} → ${currTraits}`
    });
  }

  return diffs;
}
