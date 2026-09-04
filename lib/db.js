const fs = require("fs");
const path = require("path");

const DB_DIR = path.join(__dirname, "..", "database");
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

function arquivo(nome) {
  return path.join(DB_DIR, `${nome}.json`);
}

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

function ler(nome, padrao = {}) {
  const f = arquivo(nome);
  try {
    if (!fs.existsSync(f)) {
      fs.writeFileSync(f, JSON.stringify(padrao, null, 2));
      return clone(padrao);
    }
    const raw = fs.readFileSync(f, "utf8").trim();
    if (!raw) {
      fs.writeFileSync(f, JSON.stringify(padrao, null, 2));
      return clone(padrao);
    }
    return JSON.parse(raw);
  } catch (e) {
    console.log(`⚠️ Erro ao ler ${nome}.json:`, e.message);
    return clone(padrao);
  }
}

function salvar(nome, dados) {
  const f = arquivo(nome);
  const tmp = `${f}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(dados, null, 2));
  fs.renameSync(tmp, f);
}

module.exports = { ler, salvar, arquivo, DB_DIR };
