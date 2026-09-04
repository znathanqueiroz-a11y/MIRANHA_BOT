const comandos = require("./comandos");

const nomes = {
  bn: "🎉 MODO BRINCADEIRA",
  administracao: "🛡️ ADMINISTRAÇÃO",
  metas: "🎯 METAS",
  controle: "🔒 CONTROLE",
  grupo: "👥 GRUPO",
  moderadores: "👑 MODERADORES",
  whitelist: "✅ WHITELIST",
  parcerias: "🤝 PARCERIAS",
  seguranca: "🛡️ SEGURANÇA",
  configuracoes: "🎨 CONFIGURAÇÕES",
  auto_respostas: "💬 AUTO-RESPOSTAS",
  modos: "⚡ MODOS",
  assistente: "🤖 ASSISTENTE",
  social: "❤️ SOCIAL",
  sticker: "🖼️ STICKER",
  arena: "🎮 ARENA",
  eventos: "🎉 EVENTOS",
  economia: "💰 ECONOMIA",
  core: "⚙️ SISTEMA"
};

function gerarMenu(prefix = "!") {
  let menu =
`╭━━━━━━━━━━━━━━━━━━━━━━╮
┃ 🕷️ MIRANHA BOT
╰━━━━━━━━━━━━━━━━━━━━━━╯

`;

  for (const [categoria, lista] of Object.entries(comandos)) {
    menu += `╭──〔 ${nomes[categoria] || categoria} 〕──╮\n`;
    for (const cmd of lista) menu += `│ 🕷️ ${prefix}${cmd}\n`;
    menu += "╰────────────────────╯\n\n";
  }

  menu += "🕷️ Use os comandos com responsabilidade.";
  return menu;
}

module.exports = { gerarMenu };
