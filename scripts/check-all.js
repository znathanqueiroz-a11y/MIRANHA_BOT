const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const ignore = new Set(['node_modules', 'auth_info_baileys', 'media']);
const files = [];
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignore.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.isFile() && p.endsWith('.js')) files.push(p);
  }
}
walk(root);
let ok = true;
for (const file of files) {
  const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (r.status !== 0) {
    ok = false;
    console.error(`❌ ${path.relative(root,file)}`);
    console.error(r.stderr || r.stdout);
  }
}
if (!ok) process.exit(1);
console.log(`✅ ${files.length} arquivos JavaScript validados.`);
