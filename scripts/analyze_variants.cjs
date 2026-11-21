/**
 * analyze_variants.cjs
 * Scans public/data/bestiary.json to identify:
 * 1. Explicit variants (e.g., "(Variant)" in name or "Variant" trait).
 * 2. Morphological variants within the same source/author:
 *    - Prefixed variants: e.g. "Fungal Acid Ant" -> "Acid Ant"
 *    - Suffix variants: e.g. "Companion", "Mount", "Minion", "Familiar", "Juvenile", "Spawn"
 *    - True thematic variants (e.g. Shadow, Spore, Skeletal, Vampiric, Corrupted)
 * 3. Cross-source variants where a third-party book provides a variant of an official creature.
 */

const fs = require('fs');
const path = require('path');

const BESTIARY_PATH = path.join(__dirname, '../public/data/bestiary.json');
const bestiaryData = JSON.parse(fs.readFileSync(BESTIARY_PATH, 'utf8'));
const monsters = Array.isArray(bestiaryData) ? bestiaryData : (bestiaryData.monster || []);

console.log(`Analyzing ${monsters.length} creatures...`);

// 1. Explicit '(Variant)' in Name
const explicitNameVariants = monsters.filter(m => /\(variant\)/i.test(m.name) || /variant\s*\)/i.test(m.name));

// 2. Explicit Variant Trait
const explicitTraitVariants = monsters.filter(m => {
  const traits = m.trait || [];
  return traits.some(t => /^variant[:\s]/i.test(t.name) || t.name.toLowerCase().includes('variant'));
});

// 3. Companions, Mounts, Familiars, Minions
const companionVariants = monsters.filter(m => /\b(companion|mount|familiar|minion)\b/i.test(m.name));

// 4. Paired Variants within the Same Source (e.g. Acid Ant & Fungal Acid Ant)
// We index by sourceGroup and look for creatures where:
// creature B's name is "[Adjective] + [Base Creature A]" or "[Base Creature A] + [Variant Label]"
const bySource = new Map();
for (const m of monsters) {
  const src = m.sourceGroup || m.source || 'Other';
  if (!bySource.has(src)) bySource.set(src, []);
  bySource.get(src).push(m);
}

// Prefixes that typically indicate a true variant/sub-type rather than an entirely distinct monster class
const VARIANT_PREFIXES = [
  'fungal', 'spore', 'shadow', 'corrupted', 'mutated', 'skeletal', 'zombie', 
  'vampiric', 'infernal', 'celestial', 'fey', 'dire', 'spectral', 'crystal',
  'blood', 'frost', 'fire', 'void', 'abyssal', 'elder', 'greater', 'lesser',
  'cinder', 'toxic', 'albino', 'dread', 'plated', 'armored', 'venomous'
];

const pairedVariants = [];

for (const [src, list] of bySource.entries()) {
  const nameMap = new Map();
  for (const m of list) {
    nameMap.set(m.name.toLowerCase().trim(), m);
  }

  for (const m of list) {
    const norm = m.name.toLowerCase().trim();

    // Check prefix pattern
    for (const prefix of VARIANT_PREFIXES) {
      if (norm.startsWith(prefix + ' ')) {
        const potentialBase = norm.slice(prefix.length + 1).trim();
        if (nameMap.has(potentialBase)) {
          const baseMonster = nameMap.get(potentialBase);
          pairedVariants.push({
            source: src,
            baseName: baseMonster.name,
            baseId: baseMonster.id,
            variantName: m.name,
            variantId: m.id,
            type: `Prefix Variant (${prefix})`,
            crBase: baseMonster.cr,
            crVariant: m.cr
          });
        }
      }
    }

    // Check suffix pattern e.g. "Slime Servant", "Companion"
    if (/\s+(slime servant|companion|minion|mount|familiar|\(variant\))$/i.test(norm)) {
      const baseClean = norm.replace(/\s+(slime servant|companion|minion|mount|familiar|\(variant\))$/i.test(norm) ? /\s+(slime servant|companion|minion|mount|familiar|\(variant\))$/i : '', '').trim();
      if (nameMap.has(baseClean) && baseClean !== norm) {
        const baseMonster = nameMap.get(baseClean);
        pairedVariants.push({
          source: src,
          baseName: baseMonster.name,
          baseId: baseMonster.id,
          variantName: m.name,
          variantId: m.id,
          type: 'Suffix / Minion / Servant',
          crBase: baseMonster.cr,
          crVariant: m.cr
        });
      }
    }
  }
}

// Output summary
const report = {
  totalCreatures: monsters.length,
  explicitNameVariantsCount: explicitNameVariants.length,
  explicitTraitVariantsCount: explicitTraitVariants.length,
  companionVariantsCount: companionVariants.length,
  pairedVariantsSameSourceCount: pairedVariants.length,
  explicitNameVariants: explicitNameVariants.map(m => ({ id: m.id, name: m.name, source: m.sourceGroup || m.source, cr: m.cr })),
  pairedVariants: pairedVariants
};

fs.writeFileSync(path.join(__dirname, 'variants_report.json'), JSON.stringify(report, null, 2), 'utf8');
console.log('Done! Summary:');
console.log('- Explicit (Variant) in name:', explicitNameVariants.length);
console.log('- Explicit Variant in traits:', explicitTraitVariants.length);
console.log('- Companions/Mounts/Minions:', companionVariants.length);
console.log('- Paired Variants in same source:', pairedVariants.length);
