const db = require("../lib/db");
const { N, num, dataBR, alvoDeTexto, idsParticipante } = require("../lib/utils");

function alvo(ctx) {
  return ctx.mentions[0] || ctx.reply || alvoDeTexto(ctx.args[0]);
}

module.exports = async function admin(ctx) {
  const { cmd, args, sock, jid, sender, isGroup, isOwner, canAdmin, metadata, getGroupMetadataCached } = ctx;

  if (["promover","rebaixar","ban"].includes(cmd)) {
    if (!isGroup) return ctx.replyText("⚠️ Este comando funciona apenas em grupos."), true;
    if (!canAdmin(cmd)) return ctx.replyText("❌ Sem permissão para este comando."), true;
    const a = alvo(ctx);
    if (!a) return ctx.replyText("⚠️ Marque ou responda a pessoa."), true;
    if (cmd === "ban" && ctx.isOwnerJid(a)) return ctx.replyText("❌ Não posso remover o dono do bot."), true;
    const acao = cmd === "promover" ? "promote" : cmd === "rebaixar" ? "demote" : "remove";
    await sock.groupParticipantsUpdate(jid, [a], acao);
    ctx.invalidateGroupCache(jid);
    await ctx.replyText(cmd === "promover" ? "👑 Usuário promovido." : cmd === "rebaixar" ? "⬇️ Usuário rebaixado." : "🚫 Usuário removido.");
    return true;
  }

  if (cmd === "mute" || cmd === "desmute") {
    if (!isGroup) return ctx.replyText("⚠️ Apenas em grupos."), true;
    if (!canAdmin(cmd)) return ctx.replyText("❌ Sem permissão."), true;
    const a = alvo(ctx);
    if (!a) return ctx.replyText(`⚠️ Use ${ctx.prefix}${cmd} @pessoa ou responda uma mensagem.`), true;
    const d = db.ler("mute", {});
    if (!Array.isArray(d[jid])) d[jid] = [];
    d[jid] = d[jid].map(N);
    const n = N(a);
    const aliases=idsParticipante(metadata,n);
    if (cmd === "mute") {
      for(const id of aliases) if (!d[jid].includes(id)) d[jid].push(id);
    } else {
      d[jid] = d[jid].filter(x => !aliases.includes(x));
    }
    db.salvar("mute", d);
    await sock.sendMessage(jid, { text: cmd === "mute" ? `🔇 @${num(n)} foi mutado.` : `🔊 @${num(n)} foi desmutado.`, mentions:[n] });
    return true;
  }

  if (cmd === "mutados") {
    if (!isGroup) return ctx.replyText("⚠️ Apenas em grupos."), true;
    const l = (db.ler("mute", {})[jid] || []).map(N);
    await sock.sendMessage(jid, { text: l.length ? `🔇 MUTADOS\n\n${l.map((u,i)=>`${i+1}. @${num(u)}`).join("\n")}` : "✅ Nenhum usuário mutado.", mentions:l });
    return true;
  }

  if (cmd === "adv") {
    if (!isGroup) return ctx.replyText("⚠️ Apenas em grupos."), true;
    if (!canAdmin(cmd)) return ctx.replyText("❌ Sem permissão."), true;
    const a = alvo(ctx);
    if (!a) return ctx.replyText(`⚠️ Use ${ctx.prefix}adv @pessoa motivo`), true;
    const motivo = args.filter(x=>!x.startsWith("@") && !/^\d+$/.test(x)).join(" ").trim() || "Motivo não informado";
    const d = db.ler("advertencias", {});
    if (!d[jid]) d[jid] = {};
    const n = N(a);
    if (!Array.isArray(d[jid][n])) d[jid][n] = [];
    d[jid][n].push({ motivo, data: new Date().toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"}), por:N(sender) });
    db.salvar("advertencias", d);
    await sock.sendMessage(jid,{text:`⚠️ ADVERTÊNCIA\n\n👤 @${num(n)}\n📌 ${motivo}\n📊 Total: ${d[jid][n].length}`,mentions:[n]});
    return true;
  }

  if (cmd === "rmadv") {
    if (!isGroup) return ctx.replyText("⚠️ Apenas em grupos."), true;
    if (!canAdmin(cmd)) return ctx.replyText("❌ Sem permissão."), true;
    const a=alvo(ctx); if(!a) return ctx.replyText("⚠️ Marque ou responda alguém."),true;
    const n=N(a),d=db.ler("advertencias",{}),l=d[jid]?.[n]||[];
    if(!l.length) return ctx.replyText("ℹ️ Esse usuário não possui advertências."),true;
    l.pop();
    if(!l.length) delete d[jid][n];
    db.salvar("advertencias",d);
    await sock.sendMessage(jid,{text:`✅ Advertência removida de @${num(n)}.\n📊 Restantes: ${l.length}`,mentions:[n]});
    return true;
  }

  if (cmd === "listadv") {
    if(!isGroup) return ctx.replyText("⚠️ Apenas em grupos."),true;
    const a=alvo(ctx); if(!a) return ctx.replyText("⚠️ Marque ou responda alguém."),true;
    const n=N(a),l=db.ler("advertencias",{})[jid]?.[n]||[];
    if(!l.length) return ctx.replyText("ℹ️ Esse usuário não possui advertências."),true;
    await sock.sendMessage(jid,{text:`⚠️ HISTÓRICO\n\n👤 @${num(n)}\n\n${l.map((x,i)=>`${i+1}. ${x.motivo}\n📅 ${x.data}`).join("\n\n")}`,mentions:[n]});
    return true;
  }

  if (cmd === "limparrank") {
    if(!isGroup) return ctx.replyText("⚠️ Apenas em grupos."),true;
    if(!canAdmin(cmd)) return ctx.replyText("❌ Sem permissão."),true;
    const d=db.ler("atividade",{}); d[jid]={}; db.salvar("atividade",d);
    await ctx.replyText("🧹 Ranking de atividade zerado.");
    return true;
  }

  if (cmd === "mantercontador") {
    if(!isGroup) return ctx.replyText("⚠️ Apenas em grupos."),true;
    if(!canAdmin(cmd)) return ctx.replyText("❌ Sem permissão."),true;
    const op=(args[0]||"").toLowerCase();
    if(!["on","off"].includes(op)) return ctx.replyText(`Use ${ctx.prefix}mantercontador on/off`),true;
    const d=db.ler("contador",{}); d[jid]=op==="on"; db.salvar("contador",d);
    await ctx.replyText(op==="on"?"📊 Contador ativado.":"⏸️ Contador desativado.");
    return true;
  }

  if (cmd === "atividade") {
    if(!isGroup) return ctx.replyText("⚠️ Apenas em grupos."),true;
    const g=db.ler("atividade",{})[jid]||{};
    const rank=Object.entries(g).map(([u,v])=>[u,typeof v==="number"?v:Number(v.total||0)]).sort((a,b)=>b[1]-a[1]).slice(0,10);
    if(!rank.length) return ctx.replyText("📭 Ainda não há atividade registrada."),true;

    const medalhas=["🥇","🥈","🥉"];
    const posicoes=["4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];
    const linhas=rank.map(([u,v],i)=>{
      if(i<3) return `${medalhas[i]} @${num(u)}\n💬 ${Number(v||0).toLocaleString("pt-BR")} mensagens`;
      return `${posicoes[i-3]||`${i+1}º`} @${num(u)} — ${Number(v||0).toLocaleString("pt-BR")} mensagens`;
    }).join("\n\n");

    await sock.sendMessage(jid,{
      text:`╭━━━━━━━━━━━━━━━━━━╮\n┃ 📊 MAIS ATIVOS\n╰━━━━━━━━━━━━━━━━━━╯\n\n${linhas}\n\n━━━━━━━━━━━━━━━━━━\n👥 Top ${rank.length} do grupo`,
      mentions:rank.map(x=>x[0])
    });
    return true;
  }

  if (cmd === "checkativo") {
    if(!isGroup) return ctx.replyText("⚠️ Apenas em grupos."),true;
    const a=N(alvo(ctx)||sender),v=db.ler("atividade",{})[jid]?.[a];
    const total=typeof v==="number"?v:Number(v?.total||0),hoje=typeof v==="object"?Number(v?.dia||0):0,sem=typeof v==="object"?Number(v?.semana||0):0;
    await sock.sendMessage(jid,{text:`📊 ATIVIDADE\n\n👤 @${num(a)}\n💬 Total: ${total}\n📅 Hoje: ${hoje}\n🗓️ Semana: ${sem}`,mentions:[a]});
    return true;
  }

  if (cmd === "getpp") {
    const a=N(alvo(ctx)||sender);
    try {
      const url=await sock.profilePictureUrl(a,"image");
      await sock.sendMessage(jid,{image:{url},caption:`🖼️ Foto de @${num(a)}`,mentions:[a]});
    } catch {
      await ctx.replyText("❌ Não consegui obter a foto de perfil.");
    }
    return true;
  }

  return false;
};
