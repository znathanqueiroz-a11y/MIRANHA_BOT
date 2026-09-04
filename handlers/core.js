const { gerarMenu } = require("../menu");
const { dataBR, isOwnerJid } = require("../lib/utils");

module.exports = async function core(ctx) {
  const { cmd, sock, jid, prefix, dono, replyText } = ctx;

  if (cmd === "ping") {
    await replyText("🕷️ MIRANHA BOT\n\n🏓 Pong!\n🟢 Sistema online");
    return true;
  }

  if (cmd === "statusbot") {
    await replyText(`╭━━━━━━━━━━━━━━╮
┃ 🕷️ MIRANHA BOT
╰━━━━━━━━━━━━━━╯

🟢 Online
⚡ Sistema ativo
📡 WhatsApp conectado`);
    return true;
  }

  if (cmd === "uptime") {
    const s = Math.floor(process.uptime());
    await replyText(`⏱️ ${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m ${s%60}s`);
    return true;
  }

  if (cmd === "info") {
    await replyText(`🕷️ MIRANHA BOT
⚡ Prefixo: ${prefix}
🟢 Online
📅 ${dataBR()}
🧩 Estrutura modular e cache anti-429 ativo`);
    return true;
  }

  if (cmd === "dono") {
    const n = String(dono || "").replace(/\D/g, "");
    await replyText(n ? `👑 Dono do bot:\nwa.me/${n}` : "👑 Número do dono ainda não configurado.");
    return true;
  }

  if (cmd === "menu") {
    await replyText(gerarMenu(prefix));
    return true;
  }

  return false;
};
