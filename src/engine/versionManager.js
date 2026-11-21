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
  const is3pp = c.category === 'Third-Party (3PP Pro)';
  const isCrossover = c.category === 'Crossover / Video Games';
  const isCore2014 = src === 'MM' || src === 'PHB' || src === 'DMG' || srcGrp.includes('2014');
  // All Official WotC creatures that are not 2024 revised are 2014 classic era creatures
  const is2014 = (!is2024 && !is3pp && !isCrossover) || isCore2014;

  let badge = c.source || 'WotC';
  let shortLabel = c.sourceGroup || c.source || 'Official';
  let pillType = 'wotc';
  let priority = 3;

  if (is2024 && !is3pp) {
    badge = '2024';
    shortLabel = '2024 Revised';
    pillType = '2024';
    priority = 1;
  } else if (is2024 && is3pp) {
    const pub = c.publisher ? c.publisher.replace(' Productions', '').replace(' Press', '') : '3PP';
    badge = `${pub} '24`;
    shortLabel = `${pub} (2024)`;
    pillType = '2024';
    priority = 1.5;
  } else if (isCore2014) {
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
  } else {
    // Other Official 2014 WotC books (adventures, campaign settings)
    badge = c.source || 'WotC';
    shortLabel = c.sourceGroup || c.source || 'Official';
    pillType = 'wotc';
    priority = 3;
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
  if (!creaturesList || !Array.isArray(creaturesList)) return [];
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
          hasArt: c.hasArt || base.hasArt,
          artUrl: c.artUrl || base.artUrl,
          _isReprintOf: base.source
        };
      }
    }
    return c;
  });
}

/**
 * Propagates artwork (artUrl, hasArt) and tokens (tokenUrl, hasToken) across versions of the same creature.
 * When multiple editions of a creature exist (e.g. 2024 Revised, 2014 Classic, Dragonix MME 2024 vs MME 2014),
 * editions lacking full illustration or token inherit them from sibling versions so artwork never disappears
 * when toggling versions.
 */
export function propagateVersionMedia(creaturesList) {
  if (!creaturesList || !Array.isArray(creaturesList)) return [];

  const mediaMap = new Map();

  for (const c of creaturesList) {
    const key = (c.name || '').trim().toLowerCase();
    if (!key) continue;

    const meta = getCreatureVersionMeta(c);
    let entry = mediaMap.get(key);
    if (!entry) {
      entry = { bestArt: null, bestArtPriority: 999, bestToken: null, bestTokenPriority: 999 };
      mediaMap.set(key, entry);
    }

    if (c.artUrl && meta.priority <= entry.bestArtPriority) {
      entry.bestArt = c.artUrl;
      entry.bestArtPriority = meta.priority;
    }
    if (c.tokenUrl && meta.priority <= entry.bestTokenPriority) {
      entry.bestToken = c.tokenUrl;
      entry.bestTokenPriority = meta.priority;
    }
  }

  // Helper to extract base name for variant / companion / minion / swarm matching
  const extractBaseVariantName = (name) => {
    const norm = (name || '').trim().toLowerCase();
    const cleaned = norm
      .replace(/\s+companion$/i, '')
      .replace(/\s+minion$/i, '')
      .replace(/\s+\(variant\)$/i, '')
      .replace(/\s+familiar$/i, '')
      .replace(/\s+mount$/i, '')
      .replace(/^swarm of\s+/i, '')
      .trim();
    return cleaned !== norm ? cleaned : null;
  };

  return creaturesList.map(c => {
    const key = (c.name || '').trim().toLowerCase();
    let entry = mediaMap.get(key);

    // If no direct exact match has media, look up variant base name
    if (!entry || (!entry.bestArt && !entry.bestToken)) {
      const baseKey = extractBaseVariantName(c.name);
      if (baseKey && mediaMap.has(baseKey)) {
        entry = mediaMap.get(baseKey);
      }
    }

    if (!entry) return c;

    const needsArt = !c.artUrl && entry.bestArt;
    const needsToken = !c.tokenUrl && entry.bestToken;

    if (!needsArt && !needsToken) return c;

    return {
      ...c,
      artUrl: c.artUrl || entry.bestArt,
      hasArt: c.hasArt || !!entry.bestArt,
      tokenUrl: c.tokenUrl || entry.bestToken,
      hasToken: c.hasToken || !!entry.bestToken,
      _mediaInherited: true
    };
  });
}

const EXCLUDED_VARIANT_PATTERN = /\b(companion|mount|familiar|slime servant|minion)\b/i;
const BIO_VARIANT_PREFIXES = ['fungal', 'corrupted', 'elder', 'lesser', 'greater', 'mutated', 'spore'];

function capitalizeWord(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
}

/**
 * Resolves whether a creature is a recognized variant of a base creature under Approach B:
 * 1. Explicit '(Variant)' in name (e.g. 'Chimera (Protector Variant)')
 * 2. Monster Hunter ranks and growth stages (e.g. 'Archtempered Velkhana', 'Baby Barroth')
 * 3. 3PP biological/thematic variants within the same source (e.g. 'Fungal Acid Ant')
 * Explicitly excludes companions, mounts, familiars, and slime servants.
 */
export function resolveVariantBaseInfo(c, namesInSameSource) {
  if (!c || !c.name) return null;
  const norm = c.name.toLowerCase().trim();
  const src = c.sourceGroup || c.source || '';

  if (EXCLUDED_VARIANT_PATTERN.test(norm)) return null;

  // 1. Explicit (Variant) suffix
  const variantMatch = norm.match(/^(.*?)\s*\((.*?variant.*?)\)$/i);
  if (variantMatch) {
    const candidate = variantMatch[1].trim();
    if (namesInSameSource && namesInSameSource.has(candidate)) {
      const rawLabel = variantMatch[2].replace(/variant/i, '').trim();
      return {
        baseNameKey: candidate,
        variantLabel: rawLabel ? capitalizeWord(rawLabel) : 'Variante'
      };
    }
  }

  // 2. Monster Hunter Ranks and Stages
  if (src === 'Monster Hunter Monster Manual') {
    const rankMatch = norm.match(/^(tempered|archtempered|adolescent|baby|young|juvenile)\s+(.*)$/i);
    if (rankMatch) {
      const candidate = rankMatch[2].trim();
      if (namesInSameSource && namesInSameSource.has(candidate)) {
        return {
          baseNameKey: candidate,
          variantLabel: capitalizeWord(rankMatch[1])
        };
      }
    }
    const stageSuffixMatch = norm.match(/^(.*?)\s+(cub|pup|kit|shoat)$/i);
    if (stageSuffixMatch) {
      const candidate = stageSuffixMatch[1].trim();
      if (namesInSameSource && namesInSameSource.has(candidate)) {
        return {
          baseNameKey: candidate,
          variantLabel: capitalizeWord(stageSuffixMatch[2])
        };
      }
    }
  }

  // 3. Biological 3PP Variants within same source
  for (const prefix of BIO_VARIANT_PREFIXES) {
    if (norm.startsWith(prefix + ' ')) {
      const candidate = norm.slice(prefix.length + 1).trim();
      if (namesInSameSource && namesInSameSource.has(candidate)) {
        return {
          baseNameKey: candidate,
          variantLabel: capitalizeWord(prefix)
        };
      }
    }
  }

  return null;
}

/**
 * Groups a list of creatures by normalized name, sorting their versions by edition priority.
 * Returns both { groups, groupsMap } and { creatureGroups, creatureGroupsMap } for compatibility.
 */
export function groupCreaturesByName(creaturesList) {
  const groupsMap = new Map();

  if (!creaturesList || !Array.isArray(creaturesList)) {
    return {
      creatureGroups: [],
      creatureGroupsMap: groupsMap,
      groups: [],
      groupsMap
    };
  }

  // 1. Index creature names by source for variant detection
  const sourceIndex = new Map();
  for (const c of creaturesList) {
    const src = c.sourceGroup || c.source || 'Other';
    if (!sourceIndex.has(src)) sourceIndex.set(src, new Set());
    sourceIndex.get(src).add((c.name || '').toLowerCase().trim());
  }

  // 2. Map creatures to canonical groups
  for (const c of creaturesList) {
    const norm = (c.name || '').trim().toLowerCase();
    if (!norm) continue;

    const src = c.sourceGroup || c.source || 'Other';
    const namesInSource = sourceIndex.get(src);
    const variantInfo = resolveVariantBaseInfo(c, namesInSource);

    const canonicalKey = variantInfo ? variantInfo.baseNameKey : norm;

    if (!groupsMap.has(canonicalKey)) {
      groupsMap.set(canonicalKey, {
        groupKey: canonicalKey,
        name: c.name,
        versions: []
      });
    }

    const versionMeta = getCreatureVersionMeta(c);
    if (variantInfo) {
      versionMeta.isVariant = true;
      versionMeta.variantLabel = variantInfo.variantLabel;
      versionMeta.pillType = 'variant';
    }

    groupsMap.get(canonicalKey).versions.push({
      ...c,
      versionMeta
    });
  }

  const groups = [];

  for (const group of groupsMap.values()) {
    // Determine if group contains variants
    const hasVariants = group.versions.some(v => v.versionMeta?.isVariant);

    if (hasVariants) {
      // Find base creature to use as group name
      const baseVersion = group.versions.find(v => !v.versionMeta?.isVariant);
      if (baseVersion) {
        group.name = baseVersion.name;
        // Assign base label for clarity if multiple versions/variants exist
        if (!baseVersion.versionMeta.variantLabel) {
          baseVersion.versionMeta.variantLabel = group.versions.some(v => v.sourceGroup === 'Monster Hunter Monster Manual') 
            ? 'Adulto' 
            : 'Común';
        }
      }
    }

    // Sort versions:
    // Base versions come first (!isVariant), then priority, then sourceGroup
    group.versions.sort((a, b) => {
      const aIsVar = a.versionMeta?.isVariant ? 1 : 0;
      const bIsVar = b.versionMeta?.isVariant ? 1 : 0;
      if (aIsVar !== bIsVar) return aIsVar - bIsVar;

      const diff = a.versionMeta.priority - b.versionMeta.priority;
      if (diff !== 0) return diff;
      return (a.sourceGroup || '').localeCompare(b.sourceGroup || '');
    });

    // Ensure all versions within group have artwork and token if any sibling has it
    const canonicalArt = group.versions.find(v => v.artUrl)?.artUrl;
    const canonicalToken = group.versions.find(v => v.tokenUrl)?.tokenUrl;

    if (canonicalArt || canonicalToken) {
      group.versions.forEach(v => {
        if (!v.artUrl && canonicalArt) {
          v.artUrl = canonicalArt;
          v.hasArt = true;
          v._artInherited = true;
        }
        if (!v.tokenUrl && canonicalToken) {
          v.tokenUrl = canonicalToken;
          v.hasToken = true;
          v._tokenInherited = true;
        }
      });
    }

    group.hasMultipleVersions = group.versions.length > 1;
    group.defaultVersion = group.versions[0];
    groups.push(group);
  }

  // 3. Register aliases in groupsMap so any variant name points directly to the canonical group
  for (const group of groups) {
    for (const v of group.versions) {
      const vKey = (v.name || '').trim().toLowerCase();
      if (vKey && !groupsMap.has(vKey)) {
        groupsMap.set(vKey, group);
      }
    }
  }

  return {
    creatureGroups: groups,
    creatureGroupsMap: groupsMap,
    groups,
    groupsMap
  };
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
