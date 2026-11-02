import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('📦 Compilando aplicación con Vite...');
execSync('npm run build', { stdio: 'inherit' });

// Add .nojekyll to prevent GitHub Pages from ignoring files
fs.writeFileSync(path.join('dist', '.nojekyll'), '');

console.log('🚀 Publicando en GitHub Pages (rama gh-pages)...');
const distPath = path.resolve('dist');

const commands = [
  'git init',
  'git checkout -B gh-pages',
  'git add -A',
  'git commit -m "deploy: update github pages site"',
  'git remote add origin https://github.com/GianCV-code/dnd-bestiary.git',
  'git push -f origin gh-pages'
];

try {
  execSync(commands.join(' && '), { cwd: distPath, stdio: 'inherit' });
  console.log('✅ ¡Despliegue completado con éxito!');
  console.log('🌐 Web en vivo: https://giancv-code.github.io/dnd-bestiary/');
} finally {
  const gitFolder = path.join(distPath, '.git');
  if (fs.existsSync(gitFolder)) {
    fs.rmSync(gitFolder, { recursive: true, force: true });
  }
}
