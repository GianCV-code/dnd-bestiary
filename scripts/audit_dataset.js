import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseModularAction } from '../src/engine/statblockParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BESTIARY_PATH = path.resolve(__dirname, '../public/data/bestiary.json');
const raw = JSON.parse(fs.readFileSync(BESTIARY_PATH, 'utf8'));

console.log(`Auditing ${raw.length} creatures in bestiary...\n`);

// 1. Audit unparsed tags
let unparsedTagsCount = 0;
const sampleTags = [];
const tagRegex = /\{@[a-zA-Z]+(?:\s+[^}]+)?\}/g;

// 2. Audit remaining shorthands in descriptions
let shorthandsCount = 0;
const sampleShorthands = [];
const shorthandRegex = /(?:^|[\"•\n])(mw,rw|ms,rs|m,r|mp,rp|mw,rs|mw|rw|ms|rs|mp|rp|m|r)\s+(?:\+|-|\d|reach|range|automatic|PB|one\b|each\b)/i;

// 3. Audit speed issues
let invalidSpeedCount = 0;
let zeroSpeedCount = 0;
let validSpeedCount = 0;
const sampleSpeeds = [];

// 4. Audit damage parsing issues
let totalActionsAudited = 0;
let actionsWithDamage = 0;
let actionsWithHitButNoDamage = 0;
let actionsWithMalformedDamage = 0;
const sampleHitNoDamage = [];
const sampleMalformedDamage = [];

// 5. Audit attack rolls without atkBonus
let actionsWithToHit = 0;
let actionsWithToHitNoBonus = 0;
const sampleToHitNoBonus = [];

// 6. Audit saving throw DCs
let actionsWithSavingThrow = 0;
let actionsWithSaveNoDC = 0;
const sampleSaveNoDC = [];

// Run audit
for (const c of raw) {
  const jsonStr = JSON.stringify(c);

  // Check tags
  const tags = jsonStr.match(tagRegex);
  if (tags) {
    unparsedTagsCount += tags.length;
    if (sampleTags.length < 5) sampleTags.push({ creature: c.name, tag: tags[0] });
  }

  // Check speed
  if (!c.speed) {
    invalidSpeedCount++;
  } else if (typeof c.speed === 'object') {
    const { walk, fly, swim, climb, burrow } = c.speed;
    if (walk === 0 && !fly && !swim && !climb && !burrow) {
      zeroSpeedCount++;
      if (sampleSpeeds.length < 5) sampleSpeeds.push({ creature: c.name, speed: c.speed });
    } else {
      validSpeedCount++;
    }
  }

  // Check actions
  const allActionProps = ['action', 'bonus', 'reaction', 'legendary', 'mythic'];
  for (const prop of allActionProps) {
    if (Array.isArray(c[prop])) {
      for (const item of c[prop]) {
        totalActionsAudited++;
        const text = Array.isArray(item.entries) ? item.entries.join(' ') : String(item.entries || '');

        // Check shorthands
        const shMatch = text.match(shorthandRegex);
        if (shMatch) {
          shorthandsCount++;
          if (sampleShorthands.length < 5) {
            sampleShorthands.push({ creature: c.name, action: item.name, text: text.substring(0, 80) });
          }
        }

        const parsed = parseModularAction(item);

        // Check damage
        if (parsed.avgDamage) {
          actionsWithDamage++;
          if (parsed.avgDamage === '0' || parsed.avgDamage === '1' && !/1\s*(?:\(1d|point)/i.test(text)) {
            // Verify if 1 is legitimate (e.g. 1 piercing damage or 1d4)
            if (/Hit:\s*(\d+d\d+)/i.test(text) && !/1d[1-4]\b/i.test(text)) {
              actionsWithMalformedDamage++;
              if (sampleMalformedDamage.length < 5) {
                sampleMalformedDamage.push({ creature: c.name, action: item.name, text: text.substring(0, 80), parsed });
              }
            }
          }
        } else {
          // If text has Hit: but no avgDamage
          if (/(?:Hit:|Impacto:)\s*\d+/i.test(text) || /(?:Hit:|Impacto:)\s*\d*d\d+/i.test(text)) {
            actionsWithHitButNoDamage++;
            if (sampleHitNoDamage.length < 5) {
              sampleHitNoDamage.push({ creature: c.name, action: item.name, text: text.substring(0, 80) });
            }
          }
        }

        // Check attack rolls
        if (/(?:to hit|para impactar|Attack Roll)/i.test(text)) {
          actionsWithToHit++;
          if (!parsed.atkBonus) {
            // Could be dynamic like PB or spell attack
            if (!/your spell attack modifier|PB/i.test(text)) {
              actionsWithToHitNoBonus++;
              if (sampleToHitNoBonus.length < 5) {
                sampleToHitNoBonus.push({ creature: c.name, action: item.name, text: text.substring(0, 80) });
              }
            }
          }
        }

        // Check saving throws
        if (/(?:saving throw|salvaci[oó]n)/i.test(text)) {
          actionsWithSavingThrow++;
          if (!parsed.saveDC) {
            if (!/your spell save DC|DC equals/i.test(text)) {
              actionsWithSaveNoDC++;
              if (sampleSaveNoDC.length < 5) {
                sampleSaveNoDC.push({ creature: c.name, action: item.name, text: text.substring(0, 80) });
              }
            }
          }
        }
      }
    }
  }
}

console.log('=== AUDIT RESULTS ===');
console.log(`1. Unparsed {@...} tags: ${unparsedTagsCount}`);
if (sampleTags.length > 0) console.log('   Samples:', sampleTags);

console.log(`2. Remaining raw shorthand prefixes: ${shorthandsCount}`);
if (sampleShorthands.length > 0) console.log('   Samples:', sampleShorthands);

console.log(`3. Speed analysis:`);
console.log(`   - Valid moving creatures: ${validSpeedCount}`);
console.log(`   - Immobile (0 ft) creatures: ${zeroSpeedCount}`);
console.log(`   - Missing speed: ${invalidSpeedCount}`);
if (sampleSpeeds.length > 0) console.log('   Samples of 0 speed:', sampleSpeeds.map(s => s.creature));

console.log(`4. Damage parsing analysis:`);
console.log(`   - Total actions audited: ${totalActionsAudited}`);
console.log(`   - Actions with parsed damage: ${actionsWithDamage}`);
console.log(`   - Actions with 'Hit:' but NO parsed damage: ${actionsWithHitButNoDamage}`);
if (sampleHitNoDamage.length > 0) console.log('   Samples:', sampleHitNoDamage);
console.log(`   - Actions with suspect/malformed damage: ${actionsWithMalformedDamage}`);
if (sampleMalformedDamage.length > 0) console.log('   Samples:', sampleMalformedDamage);

console.log(`5. Attack roll analysis:`);
console.log(`   - Actions with attack roll: ${actionsWithToHit}`);
console.log(`   - Actions with attack roll but NO atkBonus: ${actionsWithToHitNoBonus}`);
if (sampleToHitNoBonus.length > 0) console.log('   Samples:', sampleToHitNoBonus);

console.log(`6. Saving throw analysis:`);
console.log(`   - Actions with saving throws: ${actionsWithSavingThrow}`);
console.log(`   - Saving throws with NO detected DC: ${actionsWithSaveNoDC}`);
if (sampleSaveNoDC.length > 0) console.log('   Samples:', sampleSaveNoDC);
