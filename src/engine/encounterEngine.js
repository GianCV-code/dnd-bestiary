/**
 * Encounter Engine based on Kobold+ Fight Club (KFC) math models:
 * 1. D&D 5e (2014 DMG Rules) with Action Economy Multipliers & Party Size Shift
 * 2. D&D 5e (2024 Revised Rules) with flat 1.0 multiplier & revised XP Goals
 * 3. MCDM Flee, Mortals! CR Budget System
 */

export const XP_THRESHOLDS_2014 = {
  1: { easy: 25, medium: 50, hard: 75, deadly: 100, daily: 300 },
  2: { easy: 50, medium: 100, hard: 150, deadly: 200, daily: 600 },
  3: { easy: 75, medium: 150, hard: 225, deadly: 400, daily: 1200 },
  4: { easy: 125, medium: 250, hard: 375, deadly: 500, daily: 1700 },
  5: { easy: 250, medium: 500, hard: 750, deadly: 1100, daily: 3500 },
  6: { easy: 300, medium: 600, hard: 900, deadly: 1400, daily: 4000 },
  7: { easy: 350, medium: 750, hard: 1100, deadly: 1700, daily: 5000 },
  8: { easy: 450, medium: 900, hard: 1400, deadly: 2100, daily: 6000 },
  9: { easy: 550, medium: 1100, hard: 1600, deadly: 2400, daily: 7500 },
  10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800, daily: 9000 },
  11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600, daily: 10500 },
  12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500, daily: 11500 },
  13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100, daily: 13500 },
  14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700, daily: 15000 },
  15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400, daily: 18000 },
  16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200, daily: 20000 },
  17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800, daily: 25000 },
  18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500, daily: 27000 },
  19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900, daily: 30000 },
  20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700, daily: 40000 },
};

export const XP_THRESHOLDS_2024 = {
  1: { low: 50, moderate: 75, high: 100 },
  2: { low: 100, moderate: 150, high: 200 },
  3: { low: 150, moderate: 225, high: 400 },
  4: { low: 250, moderate: 375, high: 500 },
  5: { low: 500, moderate: 750, high: 1100 },
  6: { low: 600, moderate: 1000, high: 1400 },
  7: { low: 750, moderate: 1300, high: 1700 },
  8: { low: 1000, moderate: 1700, high: 2100 },
  9: { low: 1300, moderate: 2000, high: 2600 },
  10: { low: 1600, moderate: 2300, high: 3100 },
  11: { low: 1900, moderate: 2900, high: 4100 },
  12: { low: 2200, moderate: 3700, high: 4700 },
  13: { low: 2600, moderate: 4200, high: 5400 },
  14: { low: 2900, moderate: 4900, high: 6200 },
  15: { low: 3300, moderate: 5400, high: 7800 },
  16: { low: 3800, moderate: 6100, high: 9800 },
  17: { low: 4500, moderate: 7200, high: 11700 },
  18: { low: 5000, moderate: 8700, high: 14200 },
  19: { low: 5500, moderate: 10700, high: 17200 },
  20: { low: 6400, moderate: 13200, high: 22000 },
};

/**
 * Calculates the action economy multiplier from Kobold+ Fight Club
 * @param {number} monsterCount 
 * @param {number} playerCount 
 * @returns {number}
 */
export function getEncounterMultiplier(monsterCount, playerCount) {
  if (monsterCount <= 0) return 1.0;

  const multipliers = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];
  let category = 1;

  if (monsterCount === 1) category = 1;
  else if (monsterCount === 2) category = 2;
  else if (monsterCount >= 3 && monsterCount <= 6) category = 3;
  else if (monsterCount >= 7 && monsterCount <= 10) category = 4;
  else if (monsterCount >= 11 && monsterCount <= 14) category = 5;
  else category = 6;

  // Party size adjustments
  if (playerCount < 3) {
    category = Math.min(multipliers.length - 1, category + 1);
  } else if (playerCount > 5) {
    category = Math.max(0, category - 1);
  }

  return multipliers[category];
}

/**
 * Calculates party budget thresholds
 * @param {Array<{level: number, count: number}>} partyGroups 
 * @param {string} system ('2014' or '2024')
 */
export function calculatePartyBudget(partyGroups, system = '2014') {
  const budget = {
    totalPlayers: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    deadly: 0,
    daily: 0,
    low: 0,
    moderate: 0,
    high: 0
  };

  for (const group of partyGroups) {
    const count = group.count !== undefined ? (Number(group.count) || 0) : 1;
    const level = Math.max(1, Math.min(20, Number(group.level) || 1));
    budget.totalPlayers += count;

    if (system === '2014') {
      const thresholds = XP_THRESHOLDS_2014[level];
      budget.easy += thresholds.easy * count;
      budget.medium += thresholds.medium * count;
      budget.hard += thresholds.hard * count;
      budget.deadly += thresholds.deadly * count;
      budget.daily += thresholds.daily * count;
    } else {
      const thresholds = XP_THRESHOLDS_2024[level];
      budget.low += thresholds.low * count;
      budget.moderate += thresholds.moderate * count;
      budget.high += thresholds.high * count;
    }
  }

  return budget;
}

/**
 * Calculates encounter difficulty details based on monsters and party
 * @param {Array<{creature: any, count: number}>} monsters 
 * @param {Array<{level: number, count: number}>} partyGroups 
 * @param {string} system 
 */
export function evaluateEncounter(monsters, partyGroups, system = '2014') {
  const partyBudget = calculatePartyBudget(partyGroups, system);
  const totalMonsters = monsters.reduce((sum, m) => sum + (Number(m.count) || 1), 0);
  const rawXp = monsters.reduce((sum, m) => sum + ((m.creature?.xp || 0) * (Number(m.count) || 1)), 0);

  let multiplier = 1.0;
  let adjustedXp = rawXp;

  if (system === '2014') {
    multiplier = getEncounterMultiplier(totalMonsters, partyBudget.totalPlayers);
    adjustedXp = Math.floor(rawXp * multiplier);
  }

  const perPlayerXp = partyBudget.totalPlayers > 0 ? Math.floor(rawXp / partyBudget.totalPlayers) : 0;
  const perPlayerAdjustedXp = partyBudget.totalPlayers > 0 ? Math.floor(adjustedXp / partyBudget.totalPlayers) : 0;

  let difficulty = 'Trivial';
  let difficultyColor = '#94a3b8'; // slate-400
  let intensity = 0; // 0 to 1 scale relative to deadly

  if (system === '2014') {
    if (adjustedXp === 0 || totalMonsters === 0) {
      difficulty = 'None';
    } else if (adjustedXp < partyBudget.easy) {
      difficulty = 'Trivial';
      difficultyColor = '#818cf8'; // indigo-400
      intensity = 0.15;
    } else if (adjustedXp < partyBudget.medium) {
      difficulty = 'Easy';
      difficultyColor = '#34d399'; // emerald-400
      intensity = 0.35;
    } else if (adjustedXp < partyBudget.hard) {
      difficulty = 'Medium';
      difficultyColor = '#fbbf24'; // amber-400
      intensity = 0.6;
    } else if (adjustedXp < partyBudget.deadly) {
      difficulty = 'Hard';
      difficultyColor = '#f97316'; // orange-500
      intensity = 0.85;
    } else {
      const deadlyRatio = partyBudget.deadly > 0 ? adjustedXp / partyBudget.deadly : 1;
      if (deadlyRatio >= 2.0) {
        difficulty = 'TPK Risk (Extreme)';
        difficultyColor = '#ef4444'; // red-500
        intensity = 1.5;
      } else if (deadlyRatio >= 1.4) {
        difficulty = 'Very Deadly';
        difficultyColor = '#f43f5e'; // rose-500
        intensity = 1.2;
      } else {
        difficulty = 'Deadly';
        difficultyColor = '#e11d48'; // rose-600
        intensity = 1.0;
      }
    }
  } else {
    // 2024 rules
    if (rawXp === 0 || totalMonsters === 0) {
      difficulty = 'None';
    } else if (rawXp < partyBudget.low) {
      difficulty = 'Trivial';
      difficultyColor = '#818cf8';
    } else if (rawXp < partyBudget.moderate) {
      difficulty = 'Low';
      difficultyColor = '#34d399';
    } else if (rawXp < partyBudget.high) {
      difficulty = 'Moderate';
      difficultyColor = '#fbbf24';
    } else if (rawXp < partyBudget.high * 1.5) {
      difficulty = 'High';
      difficultyColor = '#f97316';
    } else {
      difficulty = 'Deadly';
      difficultyColor = '#e11d48';
    }
  }

  return {
    rawXp,
    adjustedXp,
    multiplier,
    totalMonsters,
    totalPlayers: partyBudget.totalPlayers,
    perPlayerXp,
    perPlayerAdjustedXp,
    partyBudget,
    difficulty,
    difficultyColor,
    intensity
  };
}
