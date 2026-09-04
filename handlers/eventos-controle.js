const db=require("../lib/db");

const relacionados=new Set([
  "evento",
  "desafiododia",
  "caixadogrupo",
  "roleta",
  "premiosurpresa",
  "pegar",
  "caixa",
  "eventoresp"
]);

function ler(){
  const d=db.ler("animador",{grupos:{}});
  d.grupos=d.grupos||{};
  return d;
}

function grupo(d,jid){
  return d.grupos[jid]||(d.grupos[jid]={});
}

function podeControlar(ctx){
  return ctx.isOwner===true ||
         ctx.isAdmin===true ||
         ctx.isGroupAdmin===true;
}

module.exports=async function eventosControle(ctx){
  if(!ctx.isGroup)return false;

  const d=ler();
  const g=grupo(d,ctx.jid);

  if(ctx.cmd==="eventos"){
    if(!podeControlar(ctx)){
      await ctx.replyText("🔒 Apenas administradores ou o dono podem alterar os eventos deste grupo.");
      return true;
    }

    const op=String(ctx.args?.[0]||"").toLowerCase();

    if(!op){
      await ctx.replyText(
`🎉 EVENTOS DO GRUPO

Status: ${g.desativado?"🔴 DESATIVADOS":"🟢 ATIVADOS"}

Use:
• !eventos off
• !eventos on`
      );
      return true;
    }

    if(["off","desligar","desativar","0"].includes(op)){
      g.desativado=true;
      delete g.ativo;
      g.desativadoEm=Date.now();
      db.salvar("animador",d);

      await ctx.replyText(
`🔴 Eventos desativados neste grupo.

• Eventos automáticos pausados
• Evento ativo cancelado
• Comandos de evento bloqueados

Para voltar:
!eventos on`
      );
      return true;
    }

    if(["on","ligar","ativar","1"].includes(op)){
      g.desativado=false;
      delete g.desativadoEm;

      // Força novo agendamento quando o animador checar o grupo.
      g.proximo=0;

      db.salvar("animador",d);

      await ctx.replyText(
`🟢 Eventos ativados novamente neste grupo.

O próximo evento será agendado automaticamente.`
      );
      return true;
    }

    await ctx.replyText("Use: !eventos off ou !eventos on");
    return true;
  }

  if(g.desativado && relacionados.has(ctx.cmd)){
    await ctx.replyText("🔴 Os eventos estão desativados neste grupo.");
    return true;
  }

  return false;
};

