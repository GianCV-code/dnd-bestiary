const fs = require('fs');
const path = require('path');

const BESTIARY_PATH = path.join(__dirname, '../public/data/bestiary.json');
const bestiary = JSON.parse(fs.readFileSync(BESTIARY_PATH, 'utf8'));

function parseAc(ac) {
  if (typeof ac === 'number') return { numeric: ac, text: `${ac}` };
  if (typeof ac === 'string') {
    const num = parseInt(ac, 10);
    return { numeric: isNaN(num) ? 10 : num, text: ac };
  }
  if (Array.isArray(ac)) {
    const first = ac[0];
    if (typeof first === 'number') return { numeric: first, text: `${first}` };
    if (typeof first === 'object' && first !== null) {
      const num = first.ac || (first.special ? parseInt(first.special, 10) : 10) || 10;
      const from = (first.from || []).join(', ');
      return { numeric: num, text: first.special || (from ? `${num} (${from})` : `${num}`) };
    }
    if (typeof first === 'string') {
      const num = parseInt(first, 10);
      return { numeric: isNaN(num) ? 10 : num, text: first };
    }
  }
  if (typeof ac === 'object' && ac !== null) {
    const num = ac.ac || (ac.special ? parseInt(ac.special, 10) : 10) || 10;
    return { numeric: num, text: ac.special || `${num}` };
  }
  return { numeric: 10, text: '10' };
}

function parseHp(hp) {
  if (typeof hp === 'number') return { average: hp, formula: `${hp}` };
  if (typeof hp === 'string') {
    const num = parseInt(hp, 10);
    return { average: isNaN(num) ? 10 : num, formula: hp };
  }
  if (typeof hp === 'object' && hp !== null) {
    const avg = hp.average || (hp.special ? parseInt(hp.special, 10) : 10) || 10;
    const formula = hp.formula || (hp.special ? String(hp.special) : `${avg}`);
    return { average: isNaN(avg) ? 10 : avg, formula };
  }
  return { average: 10, formula: '10' };
}

let acFixed = 0;
let hpFixed = 0;

bestiary.forEach(c => {
  const parsedAc = parseAc(c.ac);
  if (typeof c.ac !== 'number' || typeof c.acText !== 'string' || c.acText.includes('[object')) {
    c.ac = parsedAc.numeric;
    c.acText = parsedAc.text;
    acFixed++;
  }

  const parsedHp = parseHp(c.hp);
  if (typeof c.hp !== 'number' || typeof c.hpFormula !== 'string' || c.hpFormula.includes('[object')) {
    c.hp = parsedHp.average;
    c.hpFormula = parsedHp.formula;
    hpFixed++;
  }
});

fs.writeFileSync(BESTIARY_PATH, JSON.stringify(bestiary, null, 2), 'utf8');
console.log(`Sanitized: ${acFixed} AC entries, ${hpFixed} HP entries in bestiary.json.`);

