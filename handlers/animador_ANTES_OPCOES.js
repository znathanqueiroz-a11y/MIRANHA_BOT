const animador=require("../lib/animador");

const MAPA={
  evento:"evento",
  desafiododia:"desafio",
  caixadogrupo:"caixa",
  roleta:"roleta",
  premiosurpresa:"premio"
};

module.exports=async function handlerAnimador(ctx){
  const c=ctx.cmd;

  if(c==="pegar"){
    if(!ctx.isGroup)return ctx.replyText("⚠️ Apenas em grupos."),true;
    return animador.pegar(ctx);
  }

  if(c==="caixa"){
    if(!ctx.isGroup)return ctx.replyText("⚠️ Apenas em grupos."),true;
    return animador.pegarCaixa(ctx);
  }

  if(MAPA[c]){
    if(!ctx.isGroup)return ctx.replyText("⚠️ Apenas em grupos."),true;

    // Os eventos automáticos ficam sempre ligados.
    // Os comandos abaixo são apenas disparos manuais para admin/dono.
    if(!(ctx.isOwner||ctx.isAdmin)){
      return ctx.replyText("🛡️ Apenas admin ou dono pode iniciar manualmente."),true;
    }

    await animador.disparar(ctx.sock,ctx.jid,MAPA[c],ctx.metadata);
    return true;
  }

  return false;
};

