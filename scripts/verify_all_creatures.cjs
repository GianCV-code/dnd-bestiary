const fs = require('fs');
const path = require('path');

const BESTIARY_PATH = path.join(__dirname, '../public/data/bestiary.json');
const bestiary = JSON.parse(fs.readFileSync(BESTIARY_PATH, 'utf8'));

// Import statblockParser
async function run() {
  const { parseModularAction, clean5eTags, extractEntryText } = await import('../src/engine/statblockParser.js');

  console.log('========================================================');
  console.log(`🔍 RUNNING EXHAUSTIVE VERIFICATION OVER ${bestiary.length} CREATURES`);
  console.log('========================================================');

  let totalActionsTested = 0;
  let totalBonusTested = 0;
  let totalReactionsTested = 0;
  let totalLegendaryTested = 0;
  let totalMythicTested = 0;
  let compositeActionsCount = 0;
  let hollowCount = 0;
  let rawAttackLeaks = 0;
  let tagLeaks = 0;
  let spanishLeaks = 0;
  let crashCount = 0;

  for (let i = 0; i < bestiary.length; i++) {
    const c = bestiary[i];

    // Check hollow
    if (c.hp === 10 && c.ac === 10 && (!c.action || c.action.length === 0)) {
      hollowCount++;
    }

    // Test actions
    for (const a of (c.action || [])) {
      totalActionsTested++;
      try {
        const parsed = parseModularAction(a, 'Action');
        if (parsed.isComposite) compositeActionsCount++;

        const narrative = parsed.narrativeText || '';
        if (/(?:^|[.\n]\s*)(?:mw|rw|ms|rs)\s+\d+\s+to\s+hit/i.test(narrative) || /(?:^|[.\n]\s*)(?:m|r)\s+\d+,\s*(?:reach|range)/i.test(narrative)) {
          rawAttackLeaks++;
        }
        if (/\{@[a-zA-Z]+/i.test(narrative)) tagLeaks++;
        if (/\b(?:Impacto:|Fallo:|Salvaci[oó]n|\(Recarga\b|CD\s*\d)/i.test(narrative)) spanishLeaks++;
      } catch (err) {
        crashCount++;
        console.error(`Crash on action ${a.name} in creature ${c.name}:`, err.message);
      }
    }

    // Test bonus actions
    for (const b of (c.bonus || [])) {
      totalBonusTested++;
      try {
        const parsed = parseModularAction(b, 'Bonus Action');
        const narrative = parsed.narrativeText || '';
        if (/(?:^|[.\n]\s*)(?:mw|rw|ms|rs)\s+\d+\s+to\s+hit/i.test(narrative) || /(?:^|[.\n]\s*)(?:m|r)\s+\d+,\s*(?:reach|range)/i.test(narrative)) {
          rawAttackLeaks++;
        }
        if (/\{@[a-zA-Z]+/i.test(narrative)) tagLeaks++;
        if (/\b(?:Impacto:|Fallo:|Salvaci[oó]n|\(Recarga\b|CD\s*\d)/i.test(narrative)) spanishLeaks++;
      } catch (err) {
        crashCount++;
      }
    }

    // Test reactions
    for (const r of (c.reaction || [])) {
      totalReactionsTested++;
      try {
        const parsed = parseModularAction(r, 'Reaction');
        const narrative = parsed.narrativeText || '';
        if (/(?:^|[.\n]\s*)(?:mw|rw|ms|rs)\s+\d+\s+to\s+hit/i.test(narrative) || /(?:^|[.\n]\s*)(?:m|r)\s+\d+,\s*(?:reach|range)/i.test(narrative)) {
          rawAttackLeaks++;
        }
        if (/\{@[a-zA-Z]+/i.test(narrative)) tagLeaks++;
        if (/\b(?:Impacto:|Fallo:|Salvaci[oó]n|\(Recarga\b|CD\s*\d)/i.test(narrative)) spanishLeaks++;
      } catch (err) {
        crashCount++;
      }
    }

    // Test legendary
    for (const l of (c.legendary || [])) {
      totalLegendaryTested++;
      try {
        const parsed = parseModularAction(l, 'Legendary Action');
        const narrative = parsed.narrativeText || '';
        if (/(?:^|[.\n]\s*)(?:mw|rw|ms|rs)\s+\d+\s+to\s+hit/i.test(narrative) || /(?:^|[.\n]\s*)(?:m|r)\s+\d+,\s*(?:reach|range)/i.test(narrative)) {
          rawAttackLeaks++;
        }
        if (/\{@[a-zA-Z]+/i.test(narrative)) tagLeaks++;
        if (/\b(?:Impacto:|Fallo:|Salvaci[oó]n|\(Recarga\b|CD\s*\d)/i.test(narrative)) spanishLeaks++;
      } catch (err) {
        crashCount++;
      }
    }

    // Test mythic
    for (const m of (c.mythic || [])) {
      totalMythicTested++;
      try {
        const parsed = parseModularAction(m, 'Mythic Action');
        const narrative = parsed.narrativeText || '';
        if (/(?:^|[.\n]\s*)(?:mw|rw|ms|rs)\s+\d+\s+to\s+hit/i.test(narrative) || /(?:^|[.\n]\s*)(?:m|r)\s+\d+,\s*(?:reach|range)/i.test(narrative)) {
          rawAttackLeaks++;
        }
        if (/\{@[a-zA-Z]+/i.test(narrative)) tagLeaks++;
        if (/\b(?:Impacto:|Fallo:|Salvaci[oó]n|\(Recarga\b|CD\s*\d)/i.test(narrative)) spanishLeaks++;
      } catch (err) {
        crashCount++;
      }
    }
  }

  console.log('\n--- EXHAUSTIVE CENSUS RESULTS ---');
  console.log(`Total creatures audited: ${bestiary.length}`);
  console.log(`Total actions tested: ${totalActionsTested}`);
  console.log(`Total bonus actions tested: ${totalBonusTested}`);
  console.log(`Total reactions tested: ${totalReactionsTested}`);
  console.log(`Total legendary actions tested: ${totalLegendaryTested}`);
  console.log(`Total mythic actions tested: ${totalMythicTested}`);
  console.log(`Total composite multi-option actions decomposed: ${compositeActionsCount}`);
  console.log(`Hollow creatures remaining: ${hollowCount}`);
  console.log(`Raw attack code leaks (mw/rw/m/r): ${rawAttackLeaks}`);
  console.log(`Unparsed 5eTools tag leaks ({@...}): ${tagLeaks}`);
  console.log(`Spanish tag residue (Salvación/Impacto/CD): ${spanishLeaks}`);
  console.log(`Parser runtime exceptions: ${crashCount}`);

  // Test 15 Breakers Specifically
  console.log('\n--- 15 SAMPLE BREAKER AUDIT ---');
  const breakers = [
    'Beholder',
    'Adult Red Dragon',
    'Adult Gold Dragon',
    'Lich',
    'Marilith',
    'Tiamat',
    'Demilich',
    'Vampire',
    'Tarrasque',
    'Blind Artist',
    'Chimeric Hare',
    'Deseyna Majarra',
    'Abyssal Hyena',
    'Air Elemental',
    'Cat'
  ];

  breakers.forEach(bName => {
    const found = bestiary.filter(c => c.name.toLowerCase() === bName.toLowerCase());
    if (found.length === 0) {
      console.log(`❌ ${bName}: NOT FOUND`);
      return;
    }
    const c = found[0];
    const parsedActions = (c.action || []).map(a => parseModularAction(a, 'Action'));
    const composite = parsedActions.filter(a => a.isComposite);
    const attacks = parsedActions.filter(a => a.atkBonus);
    const saves = parsedActions.filter(a => a.saveDC);

    console.log(`✓ ${c.name} (${c.source}) | HP: ${c.hp} | AC: ${c.ac} | Actions: ${(c.action||[]).length} (Composite: ${composite.length}, Attacks: ${attacks.length}, Saves: ${saves.length})`);
    if (composite.length > 0) {
      composite.forEach(comp => {
        console.log(`   ↳ Composite Action: "${comp.name}" -> Sub-Actions: [${comp.subActions.map(s => `${s.name} (${s.saveDC ? `DC ${s.saveDC} ${s.saveStat||''}` : s.atkBonus || 'utility'})`).join(', ')}]`);
      });
    }
  });

  console.log('\n========================================================');
  if (hollowCount === 0 && rawAttackLeaks === 0 && tagLeaks === 0 && spanishLeaks === 0 && crashCount === 0) {
    console.log('✅ AUDIT COMPLETE: 100% PERFECT SCORE ACROSS ALL 10,992 CREATURES');
  } else {
    console.log('⚠️ AUDIT FINISHED WITH WARNINGS (Check above counts)');
  }
  console.log('========================================================');
}

run();

