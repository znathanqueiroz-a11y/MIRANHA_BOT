const db=require("../lib/db");
const {N,num}=require("../lib/utils");

module.exports=async function whitelist(ctx){
  if(!["wladd","wl.remove","wl.lista"].includes(ctx.cmd))return false;
  if(!ctx.isGroup)return ctx.replyText("⚠️ Apenas em grupos."),true;
  if(!ctx.canAdmin(ctx.cmd))return ctx.replyText("❌ Sem permissão."),true;
  const d=db.ler("whitelist",{});if(!Array.isArray(d[ctx.jid]))d[ctx.jid]=[];d[ctx.jid]=d[ctx.jid].map(N);

  if(ctx.cmd==="wladd"||ctx.cmd==="wl.remove"){
    const a=ctx.mentions[0]||ctx.reply;if(!a)return ctx.replyText("⚠️ Marque ou responda alguém."),true;
    const n=N(a);
    if(ctx.cmd==="wladd"&&!d[ctx.jid].includes(n))d[ctx.jid].push(n);
    if(ctx.cmd==="wl.remove")d[ctx.jid]=d[ctx.jid].filter(x=>x!==n);
    db.salvar("whitelist",d);
    await ctx.sock.sendMessage(ctx.jid,{text:ctx.cmd==="wladd"?`✅ @${num(n)} adicionado à whitelist.`:`✅ @${num(n)} removido da whitelist.`,mentions:[n]});
    return true;
  }

  const l=d[ctx.jid];
  await ctx.sock.sendMessage(ctx.jid,{text:l.length?`✅ WHITELIST\n\n${l.map((u,i)=>`${i+1}. @${num(u)}`).join("\n")}`:"📭 Whitelist vazia.",mentions:l});
  return true;
};
