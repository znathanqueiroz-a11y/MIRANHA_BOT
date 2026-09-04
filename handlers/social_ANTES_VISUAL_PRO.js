const {N,num,score,barra,diaKey,dataBR,hash}=require("../lib/utils");

const pares={
casal:["💞 CASAL MIRANHA",["Sintonia","Conversa","Humor","Parceria","Energia"],"❤️"],
amor:["💗 RADAR DO AMOR",["Carinho","Confiança","Sintonia","Conversa","Potencial"],"💗"],
amizade:["🤝 RADAR DE AMIZADE",["Confiança","Lealdade","Resenha","Parceria","Apoio"],"💚"],
crush:["💘 RADAR DE CRUSH",["Interesse","Conversa","Sintonia","Coragem","Reciprocidade"],"💖"],
ship:["🚢 SHIP MIRANHA",["Sintonia","Conversa","Humor","Parceria","Caos"],"💜"],
compatibilidade:["📊 COMPATIBILIDADE",["Comunicação","Confiança","Humor","Parceria","Personalidade"],"💙"],
quimica:["🧪 QUÍMICA MIRANHA",["Conversa","Energia","Espontaneidade","Conexão","Sintonia"],"⚡"],
afinidade:["🔗 RADAR DE AFINIDADE",["Conversa","Interesses","Ritmo","Confiança","Parceria"],"🔵"]
};

const individuais={
personalidade:["🧠 PERFIL MIRANHA",["Sociabilidade","Confiança","Criatividade","Espontaneidade","Paciência","Energia","Humor"]],
humor:["😄 RADAR DE HUMOR",["Felicidade","Energia","Paciência","Sociabilidade","Tranquilidade","Zoeira"]],
popularidade:["⭐ RADAR DE PRESENÇA",["Carisma","Presença","Interação","Resenha","Influência","Simpatia"]],
sorte:["🍀 RADAR DA SORTE",["Oportunidades","Estudos","Amizades","Energia","Boas surpresas"]],
previsao:["🔮 PREVISÃO MIRANHA",["Oportunidades","Social","Foco","Estudos","Energia","Surpresas"]],
destino:["🧭 DESTINO MIRANHA",["Oportunidades","Mudanças","Coragem","Conexões","Progresso","Surpresas"]],
energia:["⚡ RADAR DE ENERGIA",["Disposição","Foco","Social","Criatividade","Calma","Intensidade"]],
zoeira:["😂 RADAR DA ZOEIRA",["Resenha","Caos","Memes","Sumiço","Desculpas","Aleatoriedade"]],
fofo:["🥰 RADAR FOFO",["Gentileza","Simpatia","Carinho","Apoio","Bom humor","Energia boa"]],
estilo:["😎 RADAR DE ESTILO",["Presença","Criatividade","Confiança","Atitude","Originalidade","Social"]]
};

module.exports=async function social(ctx){
  const c=ctx.cmd;

  if(pares[c]){
    if(!ctx.isGroup)return ctx.replyText("⚠️ Apenas em grupos."),true;
    let a,b;
    if(ctx.mentions.length>=2)[a,b]=ctx.mentions;
    else if(ctx.mentions.length===1){a=ctx.sender;b=ctx.mentions[0];}
    else if(c==="casal"){
      const ids=[...new Set((ctx.metadata?.participants||[]).map(p=>N(p.id||p.phoneNumber||p.lid)).filter(Boolean))];
      if(ids.length<2)return ctx.replyText("⚠️ Poucos participantes."),true;
      const k=hash(ctx.jid+diaKey())%ids.length;a=ids[k];b=ids[(k+1)%ids.length];
    }else return ctx.replyText(`Use ${ctx.prefix}${c} @pessoa`),true;
    if(N(a)===N(b))return ctx.replyText("😂 Escolha pessoas diferentes."),true;

    const [title,metrics,em]=pares[c],seed=[N(a),N(b)].sort().join("|");
    const vals=metrics.map(x=>[x,score(`${ctx.jid}|${c}|${seed}|${diaKey()}|${x}`,20,100)]);
    const avg=Math.round(vals.reduce((s,x)=>s+x[1],0)/vals.length);
    const best=[...vals].sort((x,y)=>y[1]-x[1])[0];
    await ctx.sock.sendMessage(ctx.jid,{text:`${title}\n\n@${num(a)} 🔗 @${num(b)}\n\n${vals.map(x=>`${x[0]}\n${barra(x[1],em,"▫️")} ${x[1]}%`).join("\n\n")}\n\n📊 Média: ${avg}%\n🏆 ${best[0]} — ${best[1]}%\n📅 ${dataBR()}\n🕷️ Resultado recreativo.`,mentions:[a,b]});
    return true;
  }

  if(c==="match"){
    if(!ctx.isGroup)return ctx.replyText("⚠️ Apenas em grupos."),true;
    const ids=[...new Set((ctx.metadata?.participants||[]).map(p=>N(p.id||p.phoneNumber||p.lid)).filter(u=>u&&u!==N(ctx.sender)&&u!==N(ctx.sock.user?.id)))];
    if(!ids.length)return ctx.replyText("⚠️ Não encontrei participantes."),true;
    const z=ids.map(u=>[u,score(`${ctx.jid}|match|${ctx.sender}|${u}|${diaKey()}`,20,100)]).sort((a,b)=>b[1]-a[1])[0];
    await ctx.sock.sendMessage(ctx.jid,{text:`💘 MATCH DO DIA\n\n@${num(ctx.sender)} ❤️ @${num(z[0])}\n📊 ${z[1]}%\n${barra(z[1],"❤️","▫️")}\n🕷️ Resultado recreativo.`,mentions:[ctx.sender,z[0]]});
    return true;
  }

  if(c==="porcentagem"){
    const t=ctx.args.join(" ").trim();if(!t)return ctx.replyText(`Use ${ctx.prefix}porcentagem tema`),true;
    const v=score(`${ctx.jid}|${ctx.sender}|${t}|${diaKey()}`,0,100);
    await ctx.sock.sendMessage(ctx.jid,{text:`📊 ${t}\n@${num(ctx.sender)}\n${barra(v,"🟩","⬜")} ${v}%`,mentions:[ctx.sender]});
    return true;
  }

  if(individuais[c]){
    const a=ctx.mentions[0]||ctx.reply||ctx.sender,[title,metrics]=individuais[c];
    const vals=metrics.map(x=>[x,score(`${ctx.jid}|${c}|${a}|${diaKey()}|${x}`)]);
    const avg=Math.round(vals.reduce((s,x)=>s+x[1],0)/vals.length),best=[...vals].sort((x,y)=>y[1]-x[1])[0];
    await ctx.sock.sendMessage(ctx.jid,{text:`${title}\n\n@${num(a)}\n\n${vals.map(x=>`${x[0]}\n${barra(x[1],"🟣","▫️")} ${x[1]}%`).join("\n\n")}\n\n📊 ${avg}%\n🏆 ${best[0]} — ${best[1]}%\n📅 ${dataBR()}\n🕷️ Resultado recreativo.`,mentions:[a]});
    return true;
  }

  if(c==="mensagem"){
    const a=ctx.mentions[0]||ctx.reply||ctx.sender;
    const l=["🎯 Escolha uma prioridade e avance nela.","🔥 Um pequeno primeiro passo pode mudar o restante do caminho.","🌱 Continuar aprendendo já é progresso.","🤝 Valorize quem está presente nos momentos importantes.","🌙 Nem toda provocação precisa de resposta.","🚀 Um pouco feito hoje vale mais que um plano que nunca começa."];
    await ctx.sock.sendMessage(ctx.jid,{text:`💌 @${num(a)}\n\n${l[hash(`${ctx.jid}|${a}|${diaKey()}`)%l.length]}`,mentions:[a]});
    return true;
  }

  if(c==="detetive"){
    if(!ctx.isGroup)return ctx.replyText("⚠️ Apenas em grupos."),true;
    const ids=[...new Set((ctx.metadata?.participants||[]).map(p=>N(p.id||p.phoneNumber||p.lid)).filter(Boolean))];
    if(ids.length<2)return ctx.replyText("⚠️ Poucos participantes."),true;
    const casos=[["📱 MENSAGEM IGNORADA","Quem lê e esquece de responder?"],["👻 SUMIÇO","Quem some e volta como se nada tivesse acontecido?"],["😂 MEME","Quem provavelmente salva mais memes?"],["⏰ ATRASO","Quem tem mais chance de perder o horário?"],["🍕 ÚLTIMO PEDAÇO","Quem pegaria o último pedaço de pizza?"],["🔋 BATERIA","Quem tem mais chance de ficar com 1% de bateria?"]];
    const caso=casos[hash(ctx.jid+diaKey())%casos.length];
    const rank=ids.map(u=>[u,score(`${ctx.jid}|detetive|${caso[0]}|${u}|${diaKey()}`,1,100)]).sort((a,b)=>b[1]-a[1]).slice(0,2);
    await ctx.sock.sendMessage(ctx.jid,{text:`🕵️ DETETIVE MIRANHA\n\n${caso[0]}\n${caso[1]}\n\n🥇 @${num(rank[0][0])} — ${rank[0][1]}%\n🥈 @${num(rank[1][0])} — ${rank[1][1]}%\n\n🕷️ Brincadeira recreativa.`,mentions:rank.map(x=>x[0])});
    return true;
  }

  return false;
};
