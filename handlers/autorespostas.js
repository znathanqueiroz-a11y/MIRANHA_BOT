const db=require("../lib/db");

module.exports=async function autorespostas(ctx){
  if(!["addautoadm","listautoadm","delautoadm","autorespostas"].includes(ctx.cmd))return false;
  if(!ctx.isGroup)return ctx.replyText("⚠️ Apenas em grupos."),true;
  if(!ctx.canAdmin(ctx.cmd))return ctx.replyText("❌ Sem permissão."),true;

  const d=db.ler("autorespostas",{});
  if(!d[ctx.jid])d[ctx.jid]={enabled:true,respostas:{}};
  d[ctx.jid].respostas=d[ctx.jid].respostas||{};

  if(ctx.cmd==="autorespostas"){
    const op=(ctx.args[0]||"").toLowerCase();
    if(!["on","off"].includes(op))return ctx.replyText(`Use ${ctx.prefix}autorespostas on/off`),true;
    d[ctx.jid].enabled=op==="on";db.salvar("autorespostas",d);await ctx.replyText(op==="on"?"💬 Auto-respostas ativadas.":"⏸️ Auto-respostas desativadas.");return true;
  }

  if(ctx.cmd==="addautoadm"){
    const raw=ctx.args.join(" ");const i=raw.indexOf("|");
    if(i<1)return ctx.replyText(`Use ${ctx.prefix}addautoadm pergunta | resposta`),true;
    const k=raw.slice(0,i).trim(),v=raw.slice(i+1).trim();if(!k||!v)return ctx.replyText("⚠️ Informe pergunta e resposta."),true;
    d[ctx.jid].respostas[k]=v;db.salvar("autorespostas",d);await ctx.replyText("✅ Auto-resposta adicionada.");return true;
  }

  if(ctx.cmd==="delautoadm"){
    const k=ctx.args.join(" ").trim();if(!k)return ctx.replyText(`Use ${ctx.prefix}delautoadm pergunta`),true;
    const real=Object.keys(d[ctx.jid].respostas).find(x=>x.toLowerCase()===k.toLowerCase());
    if(real)delete d[ctx.jid].respostas[real];db.salvar("autorespostas",d);await ctx.replyText(real?"✅ Auto-resposta removida.":"ℹ️ Não encontrei essa auto-resposta.");return true;
  }

  const r=d[ctx.jid].respostas,keys=Object.keys(r);
  await ctx.replyText(keys.length?`💬 AUTO-RESPOSTAS\n\n${keys.map((k,i)=>`${i+1}. ${k} → ${r[k]}`).join("\n")}`:"📭 Nenhuma auto-resposta cadastrada.");
  return true;
};
