const db=require("../lib/db");
const {perguntas,verdades,desafios,eununca,quiz}=require("../data/arena");
const {num}=require("../lib/utils");

function pick(a){return a[Math.floor(Math.random()*a.length)];}

function perfil(grupo,usuario){
  const d=db.ler("economia",{});
  if(!d[grupo])d[grupo]={};
  if(!d[grupo][usuario])d[grupo][usuario]={saldo:0,xp:0,level:1,ultimoDiario:0,ultimoTrabalho:0,inventario:{},cooldowns:{}};
  return {d,p:d[grupo][usuario]};
}
function level(xp){return Math.floor(Math.sqrt(Number(xp||0)/100))+1;}
function save(g){db.salvar("economia",g);}

module.exports=async function arena(ctx){
  const c=ctx.cmd;

  if(c==="dado"){await ctx.replyText(`🎲 Você tirou: ${1+Math.floor(Math.random()*6)}`);return true;}
  if(c==="moeda"){await ctx.replyText(Math.random()<.5?"🪙 Cara!":"🪙 Coroa!");return true;}

  if(c==="jokenpo"){
    const op=(ctx.args[0]||"").toLowerCase();
    const valid=["pedra","papel","tesoura"];
    if(!valid.includes(op))return ctx.replyText(`Use ${ctx.prefix}jokenpo pedra/papel/tesoura`),true;
    const bot=pick(valid);
    let r="Empate!";
    if((op==="pedra"&&bot==="tesoura")||(op==="papel"&&bot==="pedra")||(op==="tesoura"&&bot==="papel"))r="Você venceu! 🎉";
    else if(op!==bot)r="Miranha venceu! 🕷️";
    await ctx.replyText(`✊ JOKENPÔ\n\nVocê: ${op}\nMiranha: ${bot}\n\n${r}`);return true;
  }

  if(c==="8ball"){
    const q=ctx.args.join(" ").trim();if(!q)return ctx.replyText(`Use ${ctx.prefix}8ball sua pergunta`),true;
    const r=["Sim 👍","Provavelmente sim.","Pode ser.","Ainda não dá para saber.","Melhor pensar mais um pouco.","Provavelmente não.","Não parece.","As chances são boas.","Tente de novo depois.","Depende das suas escolhas."];
    await ctx.replyText(`🎱 ${pick(r)}\n\n🕷️ Resposta recreativa.`);return true;
  }

  if(c==="pergunta"){await ctx.replyText(`❓ PERGUNTA\n\n${pick(perguntas)}`);return true;}
  if(c==="desafio"){await ctx.replyText(`🎯 DESAFIO\n\n${pick(desafios)}`);return true;}
  if(c==="eununca"){await ctx.replyText(`🙋 EU NUNCA\n\n${pick(eununca)}`);return true;}
  if(c==="verdade"){await ctx.replyText(`💬 VERDADE\n\n${pick(verdades)}`);return true;}

  if(c==="quiz"){
    if(!ctx.isGroup)return ctx.replyText("⚠️ O quiz funciona em grupos."),true;
    const q=pick(quiz), letras=["A","B","C","D"];
    global.quizAtual=global.quizAtual||{};
    global.quizAtual[ctx.jid]={correta:q[2],pergunta:q[0],opcoes:q[1],criadoEm:Date.now()};
    await ctx.replyText(`🧠 QUIZ\n\n${q[0]}\n\n${q[1].map((x,i)=>`${letras[i]}) ${x}`).join("\n")}\n\nResponda com ${ctx.prefix}quizresp A/B/C/D\n⏱️ Validade: 10 minutos.`);
    return true;
  }

  if(c==="quizresp"){
    if(!ctx.isGroup)return ctx.replyText("⚠️ O quiz funciona em grupos."),true;
    global.quizAtual=global.quizAtual||{};
    const q=global.quizAtual[ctx.jid];
    if(!q)return ctx.replyText(`📭 Não há quiz ativo. Use ${ctx.prefix}quiz`),true;
    if(Date.now()-q.criadoEm>10*60*1000){delete global.quizAtual[ctx.jid];return ctx.replyText("⏱️ Esse quiz expirou."),true;}
    const letras=["A","B","C","D"],i=letras.indexOf((ctx.args[0]||"").toUpperCase());
    if(i<0)return ctx.replyText(`Use ${ctx.prefix}quizresp A/B/C/D`),true;
    if(i!==q.correta)return ctx.replyText("❌ Resposta incorreta. Você pode tentar novamente."),true;
    const x=perfil(ctx.jid,ctx.sender),moedas=200+Math.floor(Math.random()*301),xp=20+Math.floor(Math.random()*31),old=x.p.level||1;
    x.p.saldo=Number(x.p.saldo||0)+moedas;x.p.xp=Number(x.p.xp||0)+xp;x.p.level=level(x.p.xp);
    save(x.d);delete global.quizAtual[ctx.jid];
    await ctx.replyText(`✅ Correto!\n🪙 +${moedas}\n✨ +${xp} XP${x.p.level>old?`\n🎉 Level ${x.p.level}!`:""}`);
    return true;
  }

  return false;
};
