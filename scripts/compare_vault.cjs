const fs = require('fs');
const vaultNote = fs.readFileSync('C:/Obsidian Remote/DnD - DM (Remote)/04. Custom Bestiary/00. Criaturas Varias/Adult Suneater Owlbear.md', 'utf8');

const start = vaultNote.indexOf('```statblock');
const end = vaultNote.indexOf('```', start + 12);
const jsonStr = vaultNote.slice(start + 12, end).trim();
const vaultJson = JSON.parse(jsonStr);

console.log('=== VAULT NOTE KEYS ===');
console.log(Object.keys(vaultJson));
console.log('Vault traits count:', vaultJson.traits?.length);
console.log('Vault actions count:', vaultJson.actions?.length);
console.log('Vault legendary count:', vaultJson.legendary_actions?.length);
console.log('Vault mythic count:', vaultJson.mythic_actions?.length);
console.log('Vault mythic actions:', vaultJson.mythic_actions.map(m => m.name));

