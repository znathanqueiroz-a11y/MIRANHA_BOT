const db=require("../lib/db");
const {N,num}=require("../lib/utils");

module.exports=async function grupo(ctx){
  const {cmd,args,jid,isGroup,canAdmin,sock,metadata}=ctx;
  const cmds=["del","limpar","marcar","hidetag","sorteio","nomegp","descgrupo","linkgp","grupo","solicitacoes","aprovar","recusarsolic"];
  if(!cmds.includes(cmd))return false;
  if(!isGroup)return ctx.replyText("⚠️ Apenas em grupos."),true;

  if(cmd==="del"){
    if(!canAdmin(cmd))return ctx.replyText("❌ Sem permissão."),true;
    const c=ctx.context;
    if(!c?.stanzaId)return ctx.replyText("⚠️ Responda uma mensagem."),true;
    await sock.sendMessage(jid,{delete:{remoteJid:jid,fromMe:false,id:c.stanzaId,participant:c.participant}});
    return true;
  }

  if(cmd==="limpar"){
    if(!canAdmin(cmd))return ctx.replyText("❌ Sem permissão."),true;
    const n=Math.max(1,Math.min(50,parseInt(args[0])||5));
    const lista=(ctx.history.get(jid)||[]).slice(-n);
    let apagadas=0;
    for(const k of lista){
      try{await sock.sendMessage(jid,{delete:k});apagadas++;}catch{}
    }
    await ctx.replyText(`🧹 Tentei apagar ${apagadas} mensagem(ns) recentes.`);
    return true;
  }

  if(cmd==="marcar"||cmd==="hidetag"){
    if(!canAdmin(cmd))return ctx.replyText("❌ Sem permissão."),true;
    const ids=[...new Set((metadata?.participants||[]).map(p=>N(p.id||p.phoneNumber||p.lid)).filter(Boolean))];
    const texto=args.join(" ").trim()|| (cmd==="marcar"?"📢 Chamada geral":"📢 Aviso");
    const body=cmd==="marcar"?`${texto}\n\n${ids.map(x=>`@${num(x)}`).join(" ")}`:texto;
    await sock.sendMessage(jid,{text:body,mentions:ids});
    return true;
  }

  if(cmd==="sorteio"){
    const ids=[...new Set((metadata?.participants||[]).map(p=>N(p.id||p.phoneNumber||p.lid)).filter(Boolean))];
    if(!ids.length)return ctx.replyText("❌ Não encontrei participantes."),true;
    const a=ids[Math.floor(Math.random()*ids.length)];
    await sock.sendMessage(jid,{text:`🎉 SORTEIO\n\n🏆 @${num(a)}`,mentions:[a]});
    return true;
  }

  if(cmd==="nomegp"){
    if(!canAdmin(cmd))return ctx.replyText("❌ Sem permissão."),true;
    const nome=args.join(" ").trim();if(!nome)return ctx.replyText(`Use ${ctx.prefix}nomegp novo nome`),true;
    await sock.groupUpdateSubject(jid,nome);ctx.invalidateGroupCache(jid);await ctx.replyText("✅ Nome do grupo atualizado.");return true;
  }

  if(cmd==="descgrupo"){
    if(!canAdmin(cmd))return ctx.replyText("❌ Sem permissão."),true;
    const desc=args.join(" ").trim();if(!desc)return ctx.replyText(`Use ${ctx.prefix}descgrupo nova descrição`),true;
    await sock.groupUpdateDescription(jid,desc);ctx.invalidateGroupCache(jid);await ctx.replyText("✅ Descrição atualizada.");return true;
  }

  if(cmd==="linkgp"){
    if(!canAdmin(cmd))return ctx.replyText("❌ Sem permissão."),true;
    try{const code=await sock.groupInviteCode(jid);await ctx.replyText(`🔗 https://chat.whatsapp.com/${code}`);}catch(e){await ctx.replyText(`❌ Não consegui obter o link: ${e.message}`);}
    return true;
  }

  if(cmd==="grupo"){
    if(!canAdmin(cmd))return ctx.replyText("❌ Sem permissão."),true;
    const op=(args[0]||"").toLowerCase();
    if(!["on","off"].includes(op))return ctx.replyText(`Use ${ctx.prefix}grupo on/off`),true;
    await sock.groupSettingUpdate(jid,op==="on"?"not_announcement":"announcement");
    ctx.invalidateGroupCache(jid);
    await ctx.replyText(op==="on"?"🔓 Grupo aberto.":"🔒 Grupo fechado.");
    return true;
  }

  if(cmd==="solicitacoes"){
    if(!canAdmin(cmd))return ctx.replyText("❌ Sem permissão."),true;
    if(typeof sock.groupRequestParticipantsList!=="function")return ctx.replyText("⚠️ Sua versão do Baileys não suporta solicitações."),true;
    const l=await sock.groupRequestParticipantsList(jid);
    if(!l?.length)return ctx.replyText("✅ Nenhuma solicitação pendente."),true;
    const ids=l.map(x=>N(x.jid||x.id)).filter(Boolean);
    await sock.sendMessage(jid,{text:`📥 SOLICITAÇÕES\n\n${ids.map((u,i)=>`${i+1}. @${num(u)}`).join("\n")}`,mentions:ids});
    return true;
  }

  if(cmd==="aprovar"||cmd==="recusarsolic"){
    if(!canAdmin(cmd))return ctx.replyText("❌ Sem permissão."),true;
    if(typeof sock.groupRequestParticipantsUpdate!=="function")return ctx.replyText("⚠️ Sua versão do Baileys não suporta solicitações."),true;
    let ids=ctx.mentions;
    if((args[0]||"").toLowerCase()==="all" && typeof sock.groupRequestParticipantsList==="function"){
      ids=(await sock.groupRequestParticipantsList(jid)).map(x=>N(x.jid||x.id)).filter(Boolean);
    }
    if(!ids.length)return ctx.replyText(`⚠️ Marque alguém ou use ${ctx.prefix}${cmd==="aprovar"?"aprovar":"recusarsolic"} all`),true;
    await sock.groupRequestParticipantsUpdate(jid,ids,cmd==="aprovar"?"approve":"reject");
    await ctx.replyText(cmd==="aprovar"?"✅ Solicitação(ões) aprovada(s).":"✅ Solicitação(ões) recusada(s).");
    return true;
  }

  return true;
};
