const db=require("../lib/db");
const {N,num,dinheiro,idsParticipante}=require("../lib/utils");

function estado(){
  const d=db.ler("animador",{grupos:{}});
  d.grupos=d.grupos||{};
  return d;
}
function salvar(d){db.salvar("animador",d);}
function aleatorio(min,max){return min+Math.floor(Math.random()*(max-min+1));}
function premio(){return aleatorio(1000,100000);}

function aliases(metadata,id){
  const n=N(id);
  return [...new Set(idsParticipante(metadata,n).concat([n]).filter(Boolean).map(N))];
}
function mesmo(metadata,a,b){
  const A=aliases(metadata,a),B=aliases(metadata,b);
  return A.some(x=>B.includes(x));
}
function perfil(grupo,usuario,metadata){
  const d=db.ler("economia",{});
  if(!d[grupo])d[grupo]={};
  const poss=aliases(metadata,usuario);
  const u=poss.find(id=>d[grupo][id])||poss[0]||N(usuario);
  if(!d[grupo][u]){
    d[grupo][u]={saldo:0,xp:0,level:1,ultimoDiario:0,ultimoTrabalho:0,inventario:{},cooldowns:{}};
  }
  return {d,u,p:d[grupo][u]};
}
function darMoedas(grupo,usuario,valor,metadata){
  const x=perfil(grupo,usuario,metadata);
  x.p.saldo=Number(x.p.saldo||0)+Number(valor||0);
  db.salvar("economia",x.d);
  return x.u;
}
function letra(v){
  const t=String(v||"").trim().toUpperCase();
  if(["A","B","C","D"].includes(t))return t;
  if(t==="1")return "A";
  if(t==="2")return "B";
  if(t==="3")return "C";
  if(t==="4")return "D";
  return null;
}

module.exports=async function eventoresp(ctx){
  if(ctx.cmd!=="eventoresp")return false;

  if(!ctx.isGroup){
    await ctx.replyText("⚠️ Use este comando em um grupo.");
    return true;
  }

  const op=letra(ctx.args?.[0]);
  if(!op){
    await ctx.replyText("🎮 Use: !eventoresp A, B, C ou D.");
    return true;
  }

  const d=estado();
  const g=d.grupos[ctx.jid];
  const a=g?.ativo;

  if(!a){
    await ctx.replyText("📭 Não há evento esperando resposta agora.");
    return true;
  }

  if(Number(a.expira||0)<=Date.now()){
    delete g.ativo;
    salvar(d);
    await ctx.replyText("⌛ Esse evento já terminou.");
    return true;
  }

  if(a.tipo==="evento"){
    await ctx.replyText("🎉 Neste evento use !pegar.");
    return true;
  }

  if(a.tipo==="caixa"){
    await ctx.replyText("📦 Neste evento use !caixa.");
    return true;
  }

  if(a.tipo==="papo"){
    await ctx.replyText("💬 O Papo do Grupo não vale moedas. Responda normalmente.");
    return true;
  }

  a.respondidos=(a.respondidos||[]).map(N);

  if(a.tipo==="pergunta"){
    if(a.respondidos.some(x=>mesmo(ctx.metadata,x,ctx.sender))){
      await ctx.sock.sendMessage(ctx.jid,{
        text:`⏳ @${num(ctx.sender)}, você já respondeu esta pergunta.`,
        mentions:[N(ctx.sender)]
      });
      return true;
    }

    a.respondidos.push(N(ctx.sender));

    if(op!==String(a.correta||"").toUpperCase()){
      salvar(d);
      await ctx.sock.sendMessage(ctx.jid,{
        text:`❌ @${num(ctx.sender)}, resposta incorreta.`,
        mentions:[N(ctx.sender)]
      });
      return true;
    }

    const valor=premio();
    const vencedor=darMoedas(ctx.jid,ctx.sender,valor,ctx.metadata);
    salvar(d);

    await ctx.sock.sendMessage(ctx.jid,{
      text:`✅ @${num(vencedor)} acertou!\n\n💰 +${dinheiro(valor)} moedas`,
      mentions:[vencedor]
    });
    return true;
  }

  if(!a.alvo){
    await ctx.replyText("⚠️ Esse evento não possui participante sorteado.");
    return true;
  }

  if(!mesmo(ctx.metadata,a.alvo,ctx.sender)){
    await ctx.sock.sendMessage(ctx.jid,{
      text:`⏳ Esse evento foi sorteado para @${num(a.alvo)}.`,
      mentions:[a.alvo]
    });
    return true;
  }

  if(op==="B"){
    delete g.ativo;
    salvar(d);
    await ctx.sock.sendMessage(ctx.jid,{
      text:`↪️ @${num(ctx.sender)} decidiu passar este evento.`,
      mentions:[N(ctx.sender)]
    });
    return true;
  }

  if(op!=="A"){
    await ctx.replyText("⚠️ Use !eventoresp A para concluir/resgatar ou !eventoresp B para passar.");
    return true;
  }

  const valor=premio();
  const vencedor=darMoedas(ctx.jid,ctx.sender,valor,ctx.metadata);
  const tipo=a.tipo;

  delete g.ativo;
  salvar(d);

  const nomes={
    desafio:"🎯 Desafio concluído",
    roleta:"🎡 Roleta concluída",
    premio:"🎁 Prêmio resgatado",
    sorteio:"✨ Sorteio resgatado",
    missao:"⚡ Missão concluída"
  };

  await ctx.sock.sendMessage(ctx.jid,{
    text:`${nomes[tipo]||"✅ Evento concluído"}!\n\n@${num(vencedor)}\n💰 +${dinheiro(valor)} moedas`,
    mentions:[vencedor]
  });

  return true;
};

