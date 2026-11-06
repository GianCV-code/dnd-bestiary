const fs = require('fs');
const path = require('path');

const bestiary = JSON.parse(fs.readFileSync('public/data/bestiary.json', 'utf8'));

// Criaturas a incluir: las 3 estándar + las 5 rompe-statblocks
const candidateIds = [
  // Estándar
  'goblin-mm',
  'mind-flayer-mm',
  'ancient-red-dragon-mm',
  // Rompe-Statblocks
  'beholder-mm',
  'lich-mm',
  'aspect-of-tiamat-ftd',
  'adult-suneater-owlbear-helianasguidetomonsterhunting',
  'marilith-mm'
];

const found = candidateIds.map(id => {
  const m = bestiary.find(c => c.id === id);
  if (!m) console.error('FALTA:', id);
  return m;
}).filter(Boolean);

console.log('Criaturas encontradas:', found.length, 'de', candidateIds.length);
found.forEach(m => console.log('✓', m.id, '->', m.name, '(CR ' + m.cr + ')'));

