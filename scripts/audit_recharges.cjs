const fs = require('fs');
const path = require('path');

const bestiaryPath = path.join(__dirname, '..', 'public', 'data', 'bestiary.json');
const bestiary = JSON.parse(fs.readFileSync(bestiaryPath, 'utf8'));

let totalMonsters = bestiary.length;
let monstersWithRecharge = 0;
let affectedMonsters = new Set();

const counts = {
  recarga5: 0,
  recharge5: 0,
  recarga4: 0,
  recharge4: 0,
  recarga3: 0,
  recharge3: 0,
  recarga2: 0,
  recarga6Ok: 0,
  recharge6Ok: 0,
  alreadyRange: 0,
  restBased: 0
};

const affectedExamples = [];

const singleRegex = /\b(Recarga|Recharge|Recharges)\s*([2-5])(?!\s*[-–\d])\b/i;

bestiary.forEach(m => {
  let hasRecharge = false;
  let hasFaulty = false;

  const check = (str, loc) => {
    if (!str || typeof str !== 'string') return;
    
    // Check general recharge presence
    if (/recarga|recharge/i.test(str)) {
      hasRecharge = true;
    }

    // Check specific faulty single-numbers
    const match = str.match(singleRegex);
    if (match) {
      hasFaulty = true;
      const word = match[1].toLowerCase();
      const num = match[2];
      const key = (word.startsWith('recarga') ? 'recarga' : 'recharge') + num;
      counts[key] = (counts[key] || 0) + 1;

      if (affectedExamples.length < 25) {
        affectedExamples.push({
          monster: m.name,
          source: m.source,
          cr: m.cr,
          location: loc,
          found: match[0],
          shouldBe: match[1] + ' ' + num + '-6'
        });
      }
    } else if (/\b(Recarga|Recharge|Recharges)\s*6(?!\s*[-–\d])\b/i.test(str)) {
      counts.recarga6Ok++;
    } else if (/\b(Recarga|Recharge|Recharges)\s*\d\s*[-–]\s*6\b/i.test(str)) {
      counts.alreadyRange++;
    } else if (/short|long\s*rest/i.test(str)) {
      counts.restBased++;
    }
  };

  ['trait', 'action', 'bonus', 'reaction', 'legendary', 'mythic'].forEach(cat => {
    if (m[cat]) {
      m[cat].forEach(item => {
        check(item.name, cat + '.name');
        if (item.entries) {
          const text = JSON.stringify(item.entries);
          check(text, cat + '.entries');
        }
      });
    }
  });

  if (hasRecharge) monstersWithRecharge++;
  if (hasFaulty) affectedMonsters.add(m.id);
});

console.log('=== AUDITORÍA COMPLETA DE RECARGAS EN EL BESTIARIO ===');
console.log('Total de criaturas en base de datos:', totalMonsters);
console.log('Criaturas con alguna mecánica de recarga:', monstersWithRecharge);
console.log('Criaturas AFECTADAS por el error de número único:', affectedMonsters.size);
console.log('\nDesglose de habilidades erróneas detectadas:');
console.log('- "Recarga 5" / "Recharge 5" (Debe ser 5-6):', counts.recarga5 + counts.recharge5);
console.log('- "Recarga 4" / "Recharge 4" (Debe ser 4-6):', counts.recarga4 + counts.recharge4);
console.log('- "Recarga 3" / "Recharge 3" (Debe ser 3-6):', counts.recarga3 + counts.recharge3);
console.log('- "Recarga 2" / "Recharge 2" (Debe ser 2-6):', counts.recarga2 || 0);
console.log('TOTAL DE HABILIDADES A CORREGIR:', counts.recarga5 + counts.recharge5 + counts.recarga4 + counts.recharge4 + counts.recarga3 + counts.recharge3);
console.log('\nHabilidades que están correctas:');
console.log('- Recarga 6 (Correcto por ser solo un 6):', counts.recarga6Ok);
console.log('- Rangos que ya tenían formato correcto (ej: 5-6):', counts.alreadyRange);
console.log('- Recargas basadas en descanso (Short/Long Rest):', counts.restBased);

console.log('\nEjemplos representativos de criaturas afectadas:');
affectedExamples.slice(0, 15).forEach(ex => {
  console.log(` • [${ex.source}] ${ex.monster} (CR ${ex.cr}) -> En ${ex.location}: "${ex.found}" -> Debe ser "${ex.shouldBe}"`);
});

