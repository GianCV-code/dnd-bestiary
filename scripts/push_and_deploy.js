import { execSync } from 'child_process';

try {
  console.log('📌 Añadiendo cambios y creando commit en main...');
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "feat: unify creature variants, add fractional CR filters, enrich Monster Hunter and MCDM tokens"', { stdio: 'inherit' });
  
  console.log('🚀 Empujando cambios a origin/main...');
  execSync('git push origin main', { stdio: 'inherit' });
} catch (err) {
  console.log('Nota: Si no hay cambios en main o commit ya existe, procediendo al deploy...');
}

console.log('\n🚀 Iniciando despliegue en GitHub Pages (gh-pages)...');
execSync('node scripts/deploy.js', { stdio: 'inherit' });
console.log('\n🎉 ¡Despliegue completado con éxito!');
