const animador=require("../lib/animador");
const MAPA={
  evento:"evento",
  desafiododia:"desafio",
  caixadogrupo:"caixa",
  roleta:"roleta",
  premiosurpresa:"premio"
};
module.exports=async function handlerAnimador(ctx){
  if(ctx.cmd==="pegar"){
    if(!ctx.isGroup)return ctx.replyText("⚠️ Apenas em grupos."),true;
    return animador.pegar(ctx);
  }
  if(ctx.cmd==="caixa"){
    if(!ctx.isGroup)return ctx.replyText("⚠️ Apenas em grupos."),true;
    return animador.pegarCaixa(ctx);
  }
  if(MAPA[ctx.cmd]){
    if(!ctx.isGroup)return ctx.replyText("⚠️ Apenas em grupos."),true;
    if(!(ctx.isOwner||ctx.isAdmin))return ctx.replyText("🛡️ Apenas admin ou dono pode iniciar manualmente."),true;
    await animador.disparar(ctx.sock,ctx.jid,MAPA[ctx.cmd],ctx.metadata);
    return true;
  }
  return false;
};

