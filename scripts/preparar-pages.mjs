/**
 * Prepara o diretório dist/ exportado pelo Expo para publicação no GitHub Pages:
 * 1. Cria dist/404.html copiando dist/index.html (para o roteamento SPA funcionar ao recarregar a página).
 * 2. Cria dist/.nojekyll (para o GitHub Pages não ignorar pastas que começam com underline, como _expo/).
 */
import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve(process.cwd(), 'dist');

if (!fs.existsSync(distDir)) {
  console.error('Erro: pasta dist/ não encontrada. Execute expo export primeiro.');
  process.exit(1);
}

const indexPath = path.join(distDir, 'index.html');
const fallbackPath = path.join(distDir, '404.html');
const nojekyllPath = path.join(distDir, '.nojekyll');

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, fallbackPath);
  console.log('✓ dist/404.html criado a partir de dist/index.html');
} else {
  console.warn('Aviso: dist/index.html não encontrado.');
}

fs.writeFileSync(nojekyllPath, '');
console.log('✓ dist/.nojekyll criado');
console.log('Build pronto para GitHub Pages!');
