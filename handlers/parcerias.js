const db=require("../lib/db");

module.exports=async function parcerias(ctx){
  if(!["parcerias","addparceria","delparceria"].includes(ctx.cmd))return false;
  if(!ctx.isGroup)return ctx.replyText("⚠️ Apenas em grupos."),true;
  const d=db.ler("parcerias",{});if(!Array.isArray(d[ctx.jid]))d[ctx.jid]=[];

  if(ctx.cmd==="addparceria"){
    if(!ctx.canAdmin(ctx.cmd))return ctx.replyText("❌ Sem permissão."),true;
    const t=ctx.args.join(" ").trim();if(!t)return ctx.replyText(`Use ${ctx.prefix}addparceria nome/link`),true;
    d[ctx.jid].push(t);db.salvar("parcerias",d);await ctx.replyText("🤝 Parceria adicionada.");return true;
  }

  if(ctx.cmd==="delparceria"){
    if(!ctx.canAdmin(ctx.cmd))return ctx.replyText("❌ Sem permissão."),true;
    const n=parseInt(ctx.args[0]);if(!n||!d[ctx.jid][n-1])return ctx.replyText(`Use ${ctx.prefix}delparceria número`),true;
    d[ctx.jid].splice(n-1,1);db.salvar("parcerias",d);await ctx.replyText("✅ Parceria removida.");return true;
  }

  await ctx.replyText(d[ctx.jid].length?`🤝 PARCERIAS\n\n${d[ctx.jid].map((x,i)=>`${i+1}. ${x}`).join("\n")}`:"📭 Nenhuma parceria cadastrada.");
  return true;
};
