const fs = require('fs');
const path = require('path');

const BESTIARY_PATH = path.join(__dirname, '../public/data/bestiary.json');
const bestiary = JSON.parse(fs.readFileSync(BESTIARY_PATH, 'utf8'));

function formatList(val, fallback = '—') {
  if (!val) return fallback;
  if (Array.isArray(val)) {
    return val.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        return item.name || item.tag || item.special || '';
      }
      return String(item);
    }).filter(Boolean).join(', ') || fallback;
  }
  if (typeof val === 'string') return val;
  return fallback;
}

let fixed = 0;
bestiary.forEach(c => {
  if (Array.isArray(c.senses)) {
    c.senses = formatList(c.senses);
    fixed++;
  }
  if (Array.isArray(c.languages)) {
    c.languages = formatList(c.languages);
    fixed++;
  }
});

fs.writeFileSync(BESTIARY_PATH, JSON.stringify(bestiary, null, 2), 'utf8');
console.log(`Normalized senses & languages on ${fixed} entries in bestiary.json`);

