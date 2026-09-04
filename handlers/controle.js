const db=require("../lib/db");
const {N,num,alvoDeTexto}=require("../lib/utils");

function alvo(ctx){return ctx.mentions[0]||ctx.reply||alvoDeTexto(ctx.args[0]);}

module.exports=async function controle(ctx){
  const {cmd,args,jid,isGroup,isOwner,canAdmin,sock}=ctx;
  const groupCmds=["blockuser","unblockuser","listblockuser","blockcmdgp","unblockcmdgp","listblocksgp"];
  const globalCmds=["addblacklist","delblacklist","listblacklist","blockcmd","unblockcmd"];
  if(!groupCmds.includes(cmd)&&!globalCmds.includes(cmd))return false;

  if(groupCmds.includes(cmd)){
    if(!isGroup)return ctx.replyText("⚠️ Apenas em grupos."),true;
    if(!canAdmin(cmd))return ctx.replyText("❌ Sem permissão."),true;
    const d=db.ler("controle",{});
    if(!d[jid])d[jid]={usuarios:[],comandos:[]};

    if(cmd==="blockuser"||cmd==="unblockuser"){
      const a=alvo(ctx);if(!a)return ctx.replyText("⚠️ Marque ou responda alguém."),true;
      const n=N(a);
      d[jid].usuarios=(d[jid].usuarios||[]).map(N);
      if(cmd==="blockuser"&&!d[jid].usuarios.includes(n))d[jid].usuarios.push(n);
      if(cmd==="unblockuser")d[jid].usuarios=d[jid].usuarios.filter(x=>x!==n);
      db.salvar("controle",d);
      await sock.sendMessage(jid,{text:cmd==="blockuser"?`🚫 @${num(n)} bloqueado nos comandos.`:`✅ @${num(n)} desbloqueado.`,mentions:[n]});
      return true;
    }

    if(cmd==="listblockuser"){
      const l=(d[jid].usuarios||[]).map(N);
      await sock.sendMessage(jid,{text:l.length?`🚫 USUÁRIOS BLOQUEADOS\n\n${l.map((u,i)=>`${i+1}. @${num(u)}`).join("\n")}`:"✅ Nenhum usuário bloqueado.",mentions:l});
      return true;
    }

    if(cmd==="blockcmdgp"||cmd==="unblockcmdgp"){
      const c=(args[0]||"").replace(ctx.prefix,"").toLowerCase();
      if(!c)return ctx.replyText(`Use ${ctx.prefix}${cmd} comando`),true;
      d[jid].comandos=(d[jid].comandos||[]).map(x=>String(x).toLowerCase());
      if(cmd==="blockcmdgp"&&!d[jid].comandos.includes(c))d[jid].comandos.push(c);
      if(cmd==="unblockcmdgp")d[jid].comandos=d[jid].comandos.filter(x=>x!==c);
      db.salvar("controle",d);
      await ctx.replyText(cmd==="blockcmdgp"?`🚫 ${ctx.prefix}${c} bloqueado neste grupo.`:`✅ ${ctx.prefix}${c} liberado neste grupo.`);
      return true;
    }

    if(cmd==="listblocksgp"){
      const u=d[jid].usuarios||[],c=d[jid].comandos||[];
      await sock.sendMessage(jid,{text:`🔒 BLOQUEIOS DO GRUPO\n\n👤 Usuários: ${u.length}\n${u.map(x=>`• @${num(x)}`).join("\n")||"Nenhum"}\n\n⌨️ Comandos: ${c.length}\n${c.map(x=>`• ${ctx.prefix}${x}`).join("\n")||"Nenhum"}`,mentions:u});
      return true;
    }
  }

  if(globalCmds.includes(cmd)){
    if(!isOwner)return ctx.replyText("👑 Apenas o dono pode usar."),true;
    const d=db.ler("controle_global",{blacklist:[],comandos:[]});

    if(cmd==="addblacklist"||cmd==="delblacklist"){
      const a=alvo(ctx);if(!a)return ctx.replyText("⚠️ Marque, responda ou informe um número."),true;
      const n=N(a);d.blacklist=(d.blacklist||[]).map(N);
      if(cmd==="addblacklist"&&!d.blacklist.includes(n))d.blacklist.push(n);
      if(cmd==="delblacklist")d.blacklist=d.blacklist.filter(x=>x!==n);
      db.salvar("controle_global",d);
      await sock.sendMessage(jid,{text:cmd==="addblacklist"?`🚫 @${num(n)} adicionado à blacklist.`:`✅ @${num(n)} removido da blacklist.`,mentions:[n]});
      return true;
    }

    if(cmd==="listblacklist"){
      const l=(d.blacklist||[]).map(N);
      await sock.sendMessage(jid,{text:l.length?`🚫 BLACKLIST\n\n${l.map((u,i)=>`${i+1}. @${num(u)}`).join("\n")}`:"✅ Blacklist vazia.",mentions:l});
      return true;
    }

    if(cmd==="blockcmd"||cmd==="unblockcmd"){
      const c=(args[0]||"").replace(ctx.prefix,"").toLowerCase();if(!c)return ctx.replyText(`Use ${ctx.prefix}${cmd} comando`),true;
      d.comandos=(d.comandos||[]).map(x=>String(x).toLowerCase());
      if(cmd==="blockcmd"&&!d.comandos.includes(c))d.comandos.push(c);
      if(cmd==="unblockcmd")d.comandos=d.comandos.filter(x=>x!==c);
      db.salvar("controle_global",d);
      await ctx.replyText(cmd==="blockcmd"?`🚫 ${ctx.prefix}${c} bloqueado globalmente.`:`✅ ${ctx.prefix}${c} liberado globalmente.`);
      return true;
    }
  }
  return true;
};
