const fs = require('fs');
const path = require('path');

const bestiaryPath = path.join(__dirname, '..', 'public', 'data', 'bestiary.json');
const bestiary = JSON.parse(fs.readFileSync(bestiaryPath, 'utf8'));

const singleRegex = /\b(Recarga|Recharge|Recharges)\s*([2-5])(?!\s*[-–\d])\b/gi;

function fixString(str) {
  if (!str || typeof str !== 'string') return str;
  return str.replace(singleRegex, (m, word, num) => `${word} ${num}-6`);
}

function fixEntries(entries) {
  if (!entries) return entries;
  if (typeof entries === 'string') return fixString(entries);
  if (Array.isArray(entries)) return entries.map(fixEntries);
  if (typeof entries === 'object') {
    const copy = { ...entries };
    if (copy.name) copy.name = fixString(copy.name);
    if (copy.entry) copy.entry = fixString(copy.entry);
    if (copy.entries) copy.entries = fixEntries(copy.entries);
    if (copy.items) copy.items = fixEntries(copy.items);
    return copy;
  }
  return entries;
}

let modifiedMonsters = 0;
let modifiedAbilities = 0;

bestiary.forEach(m => {
  let monsterChanged = false;
  ['trait', 'action', 'bonus', 'reaction', 'legendary', 'mythic'].forEach(cat => {
    if (m[cat]) {
      m[cat].forEach(item => {
        const oldName = item.name;
        item.name = fixString(item.name);
        if (oldName !== item.name) {
          monsterChanged = true;
          modifiedAbilities++;
        }
        if (item.entries) {
          const oldEntries = JSON.stringify(item.entries);
          item.entries = fixEntries(item.entries);
          if (oldEntries !== JSON.stringify(item.entries)) {
            monsterChanged = true;
            modifiedAbilities++;
          }
        }
      });
    }
  });
  if (monsterChanged) modifiedMonsters++;
});

console.log('DRY RUN / SIMULACIÓN:');
console.log('Criaturas a modificar:', modifiedMonsters);
console.log('Habilidades / textos a corregir:', modifiedAbilities);

