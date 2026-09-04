const db=require("../lib/db");
const {N,num}=require("../lib/utils");

function alvo(ctx){return ctx.mentions[0]||ctx.reply;}

module.exports=async function mods(ctx){
  const cmds=["addmod","delmod","listmods","grantmodcmd","revokemodcmd","listmodcmds"];
  if(!cmds.includes(ctx.cmd))return false;
  if(!ctx.isGroup)return ctx.replyText("⚠️ Apenas em grupos."),true;
  if(!(ctx.isAdmin||ctx.isOwner))return ctx.replyText("❌ Apenas administradores ou o dono."),true;

  const d=db.ler("moderadores",{});
  if(!d[ctx.jid])d[ctx.jid]={mods:[],perms:{}};
  d[ctx.jid].mods=(d[ctx.jid].mods||[]).map(N);
  d[ctx.jid].perms=d[ctx.jid].perms||{};

  if(ctx.cmd==="addmod"||ctx.cmd==="delmod"){
    const a=alvo(ctx);if(!a)return ctx.replyText("⚠️ Marque ou responda alguém."),true;
    const n=N(a);
    if(ctx.cmd==="addmod"&&!d[ctx.jid].mods.includes(n))d[ctx.jid].mods.push(n);
    if(ctx.cmd==="delmod"){d[ctx.jid].mods=d[ctx.jid].mods.filter(x=>x!==n);delete d[ctx.jid].perms[n];}
    db.salvar("moderadores",d);
    await ctx.sock.sendMessage(ctx.jid,{text:ctx.cmd==="addmod"?`👑 @${num(n)} virou moderador do bot.`:`✅ @${num(n)} removido dos moderadores.`,mentions:[n]});
    return true;
  }

  if(ctx.cmd==="listmods"){
    const l=d[ctx.jid].mods;
    await ctx.sock.sendMessage(ctx.jid,{text:l.length?`👑 MODERADORES\n\n${l.map((u,i)=>`${i+1}. @${num(u)}`).join("\n")}`:"✅ Nenhum moderador do bot.",mentions:l});
    return true;
  }

  if(ctx.cmd==="grantmodcmd"||ctx.cmd==="revokemodcmd"){
    const a=alvo(ctx),c=(ctx.args.find(x=>!x.startsWith("@"))||"").replace(ctx.prefix,"").toLowerCase();
    if(!a||!c)return ctx.replyText(`Use ${ctx.prefix}${ctx.cmd} @pessoa comando`),true;
    const n=N(a);if(!d[ctx.jid].mods.includes(n))return ctx.replyText("⚠️ Essa pessoa não é moderadora do bot."),true;
    if(!Array.isArray(d[ctx.jid].perms[n]))d[ctx.jid].perms[n]=[];
    if(ctx.cmd==="grantmodcmd"&&!d[ctx.jid].perms[n].includes(c))d[ctx.jid].perms[n].push(c);
    if(ctx.cmd==="revokemodcmd")d[ctx.jid].perms[n]=d[ctx.jid].perms[n].filter(x=>x!==c);
    db.salvar("moderadores",d);
    await ctx.replyText(ctx.cmd==="grantmodcmd"?`✅ ${ctx.prefix}${c} liberado para o moderador.`:`✅ ${ctx.prefix}${c} removido do moderador.`);
    return true;
  }

  if(ctx.cmd==="listmodcmds"){
    const a=alvo(ctx);if(!a)return ctx.replyText("⚠️ Marque um moderador."),true;
    const n=N(a),l=d[ctx.jid].perms[n]||[];
    await ctx.sock.sendMessage(ctx.jid,{text:`👑 @${num(n)}\n\n${l.length?l.map(x=>`• ${ctx.prefix}${x}`).join("\n"):"Nenhum comando extra liberado."}`,mentions:[n]});
    return true;
  }

  return true;
};
