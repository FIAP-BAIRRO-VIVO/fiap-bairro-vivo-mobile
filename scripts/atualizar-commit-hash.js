/**
 * Grava o hash curto do último commit em app.json > expo.extra.commitHash,
 * exibido na tela Sobre. Uso: npm run commit-hash
 */
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// npm run executa na raiz do projeto.
const arquivo = path.resolve(process.cwd(), 'app.json');
const hash = execSync('git rev-parse --short HEAD').toString().trim();
const config = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
config.expo.extra = { ...(config.expo.extra ?? {}), commitHash: hash };
fs.writeFileSync(arquivo, JSON.stringify(config, null, 2) + '\n');
console.log(`commitHash = ${hash}`);
