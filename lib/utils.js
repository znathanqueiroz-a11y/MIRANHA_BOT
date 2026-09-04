const { jidNormalizedUser } = require("@whiskeysockets/baileys");

function N(jid) {
  try { return jidNormalizedUser(jid || ""); }
  catch { return jid || ""; }
}
function num(jid) { return String(jid || "").split("@")[0]; }
function soNumero(v) { return String(v || "").replace(/\D/g, ""); }
function isOwnerJid(jid, dono) {
  const a = soNumero(num(N(jid)));
  const b = soNumero(dono);
  return !!a && !!b && (a === b || a.endsWith(b) || b.endsWith(a));
}
function dataBR() { return new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }); }
function diaKey() { return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }); }
function semanaKey(date = new Date()) {
  const d = new Date(date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
function hash(texto) {
  let h = 0;
  for (const c of String(texto)) { h = ((h << 5) - h) + c.charCodeAt(0); h |= 0; }
  return Math.abs(h);
}
function score(seed, min = 10, max = 100) { return (hash(seed) % (max - min + 1)) + min; }
function barra(v, cheio = "█", vazio = "░") {
  const n = Math.max(0, Math.min(10, Math.round(Number(v || 0) / 10)));
  return cheio.repeat(n) + vazio.repeat(10 - n);
}
function dinheiro(v) { return Number(v || 0).toLocaleString("pt-BR"); }
function restante(ms) {
  ms = Math.max(0, Number(ms || 0));
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
  return `${h ? h + "h " : ""}${m ? m + "m " : ""}${s}s`;
}

function desempacotarMensagem(message) {
  let m = message || {};
  for (let i = 0; i < 12; i++) {
    const next =
      m.ephemeralMessage?.message ||
      m.viewOnceMessage?.message ||
      m.viewOnceMessageV2?.message ||
      m.viewOnceMessageV2Extension?.message ||
      m.documentWithCaptionMessage?.message ||
      m.editedMessage?.message ||
      m.protocolMessage?.editedMessage?.message;
    if (!next) break;
    m = next;
  }
  return m;
}
function conteudo(msg) { return desempacotarMensagem(msg?.message); }
function contexto(msg) {
  const m = conteudo(msg);
  return (
    m.extendedTextMessage?.contextInfo || m.imageMessage?.contextInfo || m.videoMessage?.contextInfo ||
    m.documentMessage?.contextInfo || m.buttonsResponseMessage?.contextInfo || m.listResponseMessage?.contextInfo ||
    m.templateButtonReplyMessage?.contextInfo || {}
  );
}
function mencoesContexto(msg) {
  const ids = contexto(msg)?.mentionedJid;
  return Array.isArray(ids) ? ids.map(N) : [];
}
function quotedParticipant(msg) {
  const c = contexto(msg);
  return c.participant ? N(c.participant) : null;
}
function textoMensagem(msg) {
  const m = conteudo(msg);
  return String(
    m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || m.videoMessage?.caption ||
    m.documentMessage?.caption || m.buttonsResponseMessage?.selectedDisplayText || m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.title || m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m.templateButtonReplyMessage?.selectedDisplayText || m.templateButtonReplyMessage?.selectedId || ""
  );
}
function idsParticipante(metadata, jid) {
  const normal = N(jid);
  const p = metadata?.participants?.find(x => {
    const ids = [x.id, x.phoneNumber, x.lid].filter(Boolean).map(N);
    return ids.includes(normal);
  });
  return [...new Set([normal, p?.id, p?.phoneNumber, p?.lid].filter(Boolean).map(N))];
}
function alvoDeTexto(v) {
  const n = soNumero(v);
  return n ? N(`${n}@s.whatsapp.net`) : null;
}
function jidChatDaMensagem(msg) {
  const raw = msg?.key?.remoteJid || "";
  const alt = msg?.key?.remoteJidAlt || "";
  if (raw.endsWith("@lid") && alt.endsWith("@s.whatsapp.net")) return N(alt);
  return raw || alt;
}

module.exports = {
  N,num,soNumero,isOwnerJid,dataBR,diaKey,semanaKey,hash,score,barra,dinheiro,restante,
  desempacotarMensagem,conteudo,mencoesContexto,contexto,quotedParticipant,textoMensagem,
  idsParticipante,alvoDeTexto,jidChatDaMensagem
};
