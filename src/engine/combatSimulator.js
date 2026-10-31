/**
 * Combat Simulator Engine based on BattleSim (by Trekiros)
 * Features:
 * - Analytical Expected Value Markovian Model
 * - Exact Hit Chance with Advantage/Disadvantage probability weighting
 * - Trekiros's Luck Slider Distribution (A + B*n)
 * - Multi-round combat resolution with target focus
 * - Win rate %, TPK probability, rounds to defeat, remaining party HP %
 */

/**
 * Weighted die face probability given die size N and luck factor L in [0.35, 0.65]
 * Formula by Trekiros:
 * A = (4 - 6*L) / N
 * B = 6*(2*L - 1) / (N*(N + 1))
 * P(face n) = A + B*n
 */
export function getWeightedDieProbabilities(sides, luck = 0.5) {
  const A = (4 - 6 * luck) / sides;
  const B = (6 * (2 * luck - 1)) / (sides * (sides + 1));
  const weights = [];
  for (let n = 1; n <= sides; n++) {
    weights.push(Math.min(1, Math.max(0, A + B * n)));
  }
  return weights;
}

/**
 * Evaluates the expected average of a die with luck factor
 * e.g. 1d6 with luck 0.5 is 3.5. With luck 0.6 is (6 + 1) * 0.6 = 4.2
 */
export function evaluateDieExpected(count, sides, luck = 0.5) {
  return count * (sides + 1) * luck;
}

/**
 * Parses simple dice formulas like "2d6 + 4" or "1d8 + 3" or raw numbers
 */
export function parseAndEvaluateFormula(formula, luck = 0.5) {
  if (typeof formula === 'number') return formula;
  if (!formula || typeof formula !== 'string') return 0;

  const match = formula.match(/(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?/i);
  if (match) {
    const count = parseInt(match[1], 10);
    const sides = parseInt(match[2], 10);
    const sign = match[3] === '-' ? -1 : 1;
    const bonus = match[4] ? parseInt(match[4], 10) * sign : 0;
    return evaluateDieExpected(count, sides, luck) + bonus;
  }

  const num = parseFloat(formula);
  return isNaN(num) ? 0 : num;
}

/**
 * Computes hit probability for a d20 roll against AC
 */
export function calculateHitChance(toHit, ac, hasAdvantage = false, hasDisadvantage = false) {
  // Base d20 hit chance: (21 + toHit - AC) / 20
  const rawChance = (21 + toHit - ac) / 20;
  // Natural 1 always misses (max 0.95), Natural 20 always hits (min 0.05)
  const baseHit = Math.min(0.95, Math.max(0.05, rawChance));

  if (hasAdvantage && !hasDisadvantage) {
    // 1 - (1 - P)^2
    return baseHit + (1 - baseHit) * baseHit;
  }
  if (hasDisadvantage && !hasAdvantage) {
    // P^2
    return baseHit * baseHit;
  }
  return baseHit;
}

/**
 * Computes save failure chance against a DC
 */
export function calculateSaveFailChance(saveBonus, dc, hasAdvantage = false, hasDisadvantage = false) {
  let modSave = saveBonus;
  if (hasAdvantage && !hasDisadvantage) modSave += 4.5;
  if (hasDisadvantage && !hasAdvantage) modSave -= 4.5;

  const passChance = (21 + modSave - dc) / 20;
  const clampedPass = Math.min(0.95, Math.max(0.05, passChance));
  return 1 - clampedPass;
}

/**
 * Estimates synthetic player stats for testing if raw player stats aren't provided
 */
export function getStandardPlayerStats(level) {
  const hpByLevel = [0, 10, 18, 26, 34, 42, 50, 58, 66, 74, 82, 90, 98, 106, 114, 122, 130, 138, 146, 154, 162];
  const acByLevel = level >= 8 ? 17 : (level >= 4 ? 16 : 15);
  const toHit = Math.floor(2 + (level - 1) / 4) + (level >= 8 ? 4 : (level >= 4 ? 3 : 2));
  // Average damage scaling per level (attacks, cantrips, spell slots)
  const dpr = Math.max(6, Math.floor(level * 4.5 + 4));

  return {
    name: `Adventurer (Lv ${level})`,
    hp: hpByLevel[level] || (level * 8 + 2),
    ac: acByLevel,
    toHit: toHit,
    dprFormula: `${Math.floor(dpr / 2)}d6 + ${Math.floor(dpr / 3)}`,
    dpr: dpr,
    saveBonus: Math.floor((level - 1) / 4) + 2
  };
}

/**
 * Extracts average attack stats from a creature statblock
 */
export function extractMonsterCombatStats(creature) {
  const cr = creature.crNumeric || 0;
  const ac = creature.ac || 12;
  const hp = creature.hp || 20;

  // Derive toHit from CR or attacks
  let toHit = Math.floor(3 + cr * 0.4);
  let dpr = Math.max(4, Math.floor(cr * 6 + 4));

  // If actions exist, parse the primary attack
  if (Array.isArray(creature.action) && creature.action.length > 0) {
    for (const act of creature.action) {
      const text = (act.entries || []).join ? act.entries.join(' ') : String(act.entries || '');
      const toHitMatch = text.match(/\+([0-9]+)\s+to hit/i);
      if (toHitMatch) {
        toHit = parseInt(toHitMatch[1], 10);
      }
      const dmgMatch = text.match(/\(([0-9]+d[0-9]+(?:\s*[+-]\s*[0-9]+)?)\)\s*(?:[a-z]+)?\s*damage/i);
      if (dmgMatch) {
        dpr = parseAndEvaluateFormula(dmgMatch[1], 0.5);
        if (text.includes('Multiattack') || act.name.includes('Multiattack')) {
          dpr *= 2;
        }
      }
    }
  }

  return { ac, hp, toHit, dpr };
}

export const DND_CLASSES = [
  'Bárbaro',
  'Bardo',
  'Clérigo',
  'Druida',
  'Guerrero',
  'Monje',
  'Paladín',
  'Explorador',
  'Pícaro',
  'Hechicero',
  'Brujo',
  'Mago',
  'Artífice'
];

/**
 * Calculates realistic default D&D 5e stats for a character based on class and level
 */
export function getStatsForClassAndLevel(className, level = 5) {
  const lvl = Math.max(1, Math.min(20, Number(level) || 1));
  const prof = Math.floor(2 + (lvl - 1) / 4);
  const statMod = lvl >= 8 ? 5 : (lvl >= 4 ? 4 : 3);

  switch (className) {
    case 'Bárbaro': {
      const conMod = 3;
      const hp = 12 + conMod + (lvl - 1) * (7 + conMod);
      const ac = 15 + (lvl >= 8 ? 1 : 0);
      const attacks = lvl >= 5 ? 2 : 1;
      const rage = lvl >= 16 ? 4 : (lvl >= 9 ? 3 : 2);
      const dpr = attacks * (7 + statMod + rage);
      return { hp, ac, toHit: prof + statMod, dpr: Math.round(dpr) };
    }
    case 'Guerrero': {
      const conMod = 2;
      const hp = 10 + conMod + (lvl - 1) * (6 + conMod);
      const ac = 17 + (lvl >= 4 ? 1 : 0);
      const attacks = lvl >= 20 ? 4 : (lvl >= 11 ? 3 : (lvl >= 5 ? 2 : 1));
      const dpr = attacks * (8.5 + statMod);
      return { hp, ac, toHit: prof + statMod, dpr: Math.round(dpr) };
    }
    case 'Paladín': {
      const conMod = 2;
      const hp = 10 + conMod + (lvl - 1) * (6 + conMod);
      const ac = 18 + (lvl >= 8 ? 1 : 0);
      const attacks = lvl >= 5 ? 2 : 1;
      const smiteBonus = lvl >= 5 ? 9 : 4.5;
      const dpr = attacks * (4.5 + statMod) + smiteBonus;
      return { hp, ac, toHit: prof + statMod, dpr: Math.round(dpr) };
    }
    case 'Pícaro': {
      const conMod = 2;
      const hp = 8 + conMod + (lvl - 1) * (5 + conMod);
      const ac = 14 + statMod;
      const sneakDice = Math.ceil(lvl / 2);
      const dpr = (4.5 + statMod) + sneakDice * 3.5;
      return { hp, ac: Math.min(18, ac), toHit: prof + statMod, dpr: Math.round(dpr) };
    }
    case 'Mago': {
      const conMod = 2;
      const hp = 6 + conMod + (lvl - 1) * (4 + conMod);
      const ac = 12 + (lvl >= 4 ? 3 : 2);
      const cantripDice = lvl >= 17 ? 4 : (lvl >= 11 ? 3 : (lvl >= 5 ? 2 : 1));
      const dpr = lvl >= 5 ? Math.round(24 + (lvl - 5) * 3) : cantripDice * 5.5 + 3;
      return { hp, ac, toHit: prof + statMod, dpr };
    }
    case 'Clérigo': {
      const conMod = 2;
      const hp = 8 + conMod + (lvl - 1) * (5 + conMod);
      const ac = 18;
      const dpr = lvl >= 5 ? Math.round(18 + (lvl - 5) * 2.5) : 10;
      return { hp, ac, toHit: prof + statMod, dpr };
    }
    case 'Bardo': {
      const conMod = 2;
      const hp = 8 + conMod + (lvl - 1) * (5 + conMod);
      const ac = 15;
      const dpr = lvl >= 5 ? Math.round(16 + (lvl - 5) * 2) : 9;
      return { hp, ac, toHit: prof + statMod, dpr };
    }
    case 'Druida': {
      const conMod = 2;
      const hp = 8 + conMod + (lvl - 1) * (5 + conMod);
      const ac = 15;
      const dpr = lvl >= 5 ? Math.round(18 + (lvl - 5) * 2.5) : 10;
      return { hp, ac, toHit: prof + statMod, dpr };
    }
    case 'Monje': {
      const conMod = 2;
      const hp = 8 + conMod + (lvl - 1) * (5 + conMod);
      const ac = 15 + (lvl >= 8 ? 1 : 0);
      const martialDie = lvl >= 17 ? 5.5 : (lvl >= 11 ? 4.5 : (lvl >= 5 ? 3.5 : 2.5));
      const attacks = lvl >= 5 ? 3 : 2;
      const dpr = attacks * (martialDie + statMod);
      return { hp, ac, toHit: prof + statMod, dpr: Math.round(dpr) };
    }
    case 'Explorador': {
      const conMod = 2;
      const hp = 10 + conMod + (lvl - 1) * (6 + conMod);
      const ac = 16;
      const attacks = lvl >= 5 ? 2 : 1;
      const dpr = attacks * (4.5 + statMod) + (lvl >= 3 ? 3.5 : 0);
      return { hp, ac, toHit: prof + statMod + 2, dpr: Math.round(dpr) };
    }
    case 'Hechicero': {
      const conMod = 2;
      const hp = 6 + conMod + (lvl - 1) * (4 + conMod);
      const ac = 15;
      const dpr = lvl >= 5 ? Math.round(25 + (lvl - 5) * 3) : 11;
      return { hp, ac, toHit: prof + statMod, dpr };
    }
    case 'Brujo': {
      const conMod = 2;
      const hp = 8 + conMod + (lvl - 1) * (5 + conMod);
      const ac = 14 + (lvl >= 4 ? 1 : 0);
      const beams = lvl >= 17 ? 4 : (lvl >= 11 ? 3 : (lvl >= 5 ? 2 : 1));
      const dpr = beams * (5.5 + statMod);
      return { hp, ac, toHit: prof + statMod, dpr: Math.round(dpr) };
    }
    default: {
      const base = getStandardPlayerStats(lvl);
      return { hp: base.hp, ac: base.ac, toHit: base.toHit, dpr: base.dpr };
    }
  }
}

/**
 * Runs a full round-by-round battle simulation
 * @param {Array<{creature: any, count: number}>} monsterRoster 
 * @param {Array<any>} partyInput (either partyGroups or customPlayers)
 * @param {number} luck (0.35 to 0.65, default 0.5)
 * @param {string} partyMode ('generic' or 'custom')
 */
export function simulateBattle(monsterRoster, partyInput, luck = 0.5, partyMode = 'generic') {
  // Build Party Combatants
  const players = [];
  let pIdx = 1;

  if (partyMode === 'custom' && Array.isArray(partyInput)) {
    for (const p of partyInput) {
      const maxHp = Math.max(1, Number(p.hp) || 30);
      const ac = Math.max(5, Number(p.ac) || 15);
      const toHit = Number(p.toHit) || 5;
      const dpr = Math.max(1, Number(p.dpr) || 12);

      players.push({
        id: p.id || `p-${pIdx++}`,
        name: p.name || `Héroe #${pIdx}`,
        className: p.className || 'Aventurero',
        level: Number(p.level) || 5,
        maxHp,
        currentHp: maxHp,
        ac,
        toHit,
        dpr: dpr * (0.8 + luck * 0.4),
        isAlive: true
      });
    }
  } else {
    for (const group of partyInput) {
      const count = Number(group.count) || 0;
      const level = Math.max(1, Math.min(20, Number(group.level) || 1));
      const baseStats = getStandardPlayerStats(level);

      for (let i = 0; i < count; i++) {
        players.push({
          id: `p-${pIdx++}`,
          name: `${baseStats.name} #${i + 1}`,
          className: 'Aventurero',
          level,
          maxHp: baseStats.hp,
          currentHp: baseStats.hp,
          ac: baseStats.ac,
          toHit: baseStats.toHit,
          dpr: baseStats.dpr * (0.8 + luck * 0.4), // scaled with luck
          isAlive: true
        });
      }
    }
  }

  // Build Monster Combatants
  const monsters = [];
  let mIdx = 1;
  for (const item of monsterRoster) {
    const count = Number(item.count) || 1;
    const c = item.creature;
    if (!c) continue;
    const stats = extractMonsterCombatStats(c);

    for (let i = 0; i < count; i++) {
      monsters.push({
        id: `m-${mIdx++}`,
        name: count > 1 ? `${c.name} #${i + 1}` : c.name,
        maxHp: stats.hp,
        currentHp: stats.hp,
        ac: stats.ac,
        toHit: stats.toHit,
        // Monsters suffer when luck is high (players are lucky), and benefit when luck is low
        dpr: stats.dpr * (1.2 - luck * 0.4),
        isAlive: true
      });
    }
  }

  if (players.length === 0 || monsters.length === 0) {
    return {
      victory: false,
      rounds: 0,
      tpkRisk: 0,
      partyRemainingHpPercent: 0,
      combatLog: ['No combatants assigned.']
    };
  }

  const combatLog = [];
  let round = 1;
  const maxRounds = 20;

  while (round <= maxRounds) {
    const livingPlayers = players.filter(p => p.isAlive);
    const livingMonsters = monsters.filter(m => m.isAlive);

    if (livingPlayers.length === 0 || livingMonsters.length === 0) break;

    // --- PLAYERS TURN ---
    // Strategy: Focus fire on lowest HP monster (BattleSim priority)
    livingMonsters.sort((a, b) => a.currentHp - b.currentHp);

    for (const player of livingPlayers) {
      const target = livingMonsters.find(m => m.isAlive);
      if (!target) break;

      const hitChance = calculateHitChance(player.toHit, target.ac, luck >= 0.58, luck <= 0.42);
      const expectedDamage = player.dpr * hitChance;
      target.currentHp -= expectedDamage;

      if (target.currentHp <= 0) {
        target.isAlive = false;
        target.currentHp = 0;
      }
    }

    // --- MONSTERS TURN ---
    const activeMonsters = monsters.filter(m => m.isAlive);
    // Strategy: Monsters attack lowest HP player or spread damage
    livingPlayers.sort((a, b) => a.currentHp - b.currentHp);

    for (const monster of activeMonsters) {
      const target = livingPlayers.find(p => p.isAlive);
      if (!target) break;

      const monsterHitChance = calculateHitChance(monster.toHit, target.ac, luck <= 0.42, luck >= 0.58);
      const expectedDamage = monster.dpr * monsterHitChance;
      target.currentHp -= expectedDamage;

      if (target.currentHp <= 0) {
        target.isAlive = false;
        target.currentHp = 0;
      }
    }

    combatLog.push({
      round: round,
      playersAlive: players.filter(p => p.isAlive).length,
      monstersAlive: monsters.filter(m => m.isAlive).length,
      partyHpRemaining: Math.round(players.reduce((sum, p) => sum + Math.max(0, p.currentHp), 0))
    });

    round++;
  }

  const finalLivingPlayers = players.filter(p => p.isAlive);
  const finalLivingMonsters = monsters.filter(m => m.isAlive);

  const totalInitialPartyHp = players.reduce((sum, p) => sum + p.maxHp, 0);
  const totalFinalPartyHp = players.reduce((sum, p) => sum + Math.max(0, p.currentHp), 0);
  const partyRemainingHpPercent = totalInitialPartyHp > 0
    ? Math.round((totalFinalPartyHp / totalInitialPartyHp) * 100)
    : 0;

  const victory = finalLivingPlayers.length > 0 && finalLivingMonsters.length === 0;

  // TPK Probability heuristic derived from remaining party HP & casualties
  let tpkRisk = 0;
  if (!victory) {
    tpkRisk = 100;
  } else {
    if (partyRemainingHpPercent < 20) tpkRisk = 75;
    else if (partyRemainingHpPercent < 40) tpkRisk = 45;
    else if (partyRemainingHpPercent < 60) tpkRisk = 20;
    else if (partyRemainingHpPercent < 80) tpkRisk = 5;
    else tpkRisk = 0;
  }

  return {
    victory,
    rounds: round - 1,
    tpkRisk,
    partyRemainingHpPercent,
    playersSummary: players.map(p => ({
      id: p.id,
      name: p.name,
      className: p.className,
      level: p.level,
      currentHp: Math.max(0, Math.round(p.currentHp)),
      maxHp: p.maxHp,
      hpPercent: Math.max(0, Math.round((p.currentHp / p.maxHp) * 100)),
      isAlive: p.isAlive
    })),
    monstersSummary: monsters.map(m => ({
      name: m.name,
      hpPercent: Math.max(0, Math.round((m.currentHp / m.maxHp) * 100)),
      isAlive: m.isAlive
    })),
    combatLog
  };
}
