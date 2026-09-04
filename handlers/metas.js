const db=require("../lib/db");
const {N,num}=require("../lib/utils");

module.exports=async function metas(ctx){
  const {cmd,args,jid,sender,isGroup,canAdmin,sock}=ctx;
  if(!["setdiario","setsemanal","vermetas"].includes(cmd))return false;
  if(!isGroup)return ctx.replyText("⚠️ Apenas em grupos."),true;

  const d=db.ler("metas",{});
  if(!d[jid])d[jid]={diario:0,semanal:0};

  if(cmd==="setdiario"||cmd==="setsemanal"){
    if(!canAdmin(cmd))return ctx.replyText("❌ Sem permissão."),true;
    const n=parseInt(args[0]);
    if(!Number.isFinite(n)||n<0)return ctx.replyText(`Use ${ctx.prefix}${cmd} número`),true;
    d[jid][cmd==="setdiario"?"diario":"semanal"]=n;
    db.salvar("metas",d);
    await ctx.replyText(`🎯 Meta ${cmd==="setdiario"?"diária":"semanal"} definida em ${n} mensagens.`);
    return true;
  }

  const a=N(ctx.mentions[0]||ctx.reply||sender);
  const v=db.ler("atividade",{})[jid]?.[a];
  const hoje=typeof v==="object"?Number(v?.dia||0):0;
  const semana=typeof v==="object"?Number(v?.semana||0):0;
  const md=Number(d[jid].diario||0),ms=Number(d[jid].semanal||0);
  const p1=md?Math.min(100,Math.round(hoje/md*100)):0,p2=ms?Math.min(100,Math.round(semana/ms*100)):0;
  await sock.sendMessage(jid,{text:`🎯 METAS\n\n👤 @${num(a)}\n\n📅 Diária: ${hoje}/${md||"não definida"} ${md?`(${p1}%)`:""}\n🗓️ Semanal: ${semana}/${ms||"não definida"} ${ms?`(${p2}%)`:""}`,mentions:[a]});
  return true;
};
