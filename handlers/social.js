const {N,num,diaKey,dataBR,hash}=require("../lib/utils");

function score(_seed,min=0,max=100){
  min=Number(min);
  max=Number(max);

  return Math.floor(
    Math.random()*(max-min+1)
  )+min;
}

const pares={
casal:["💞 Casal Miranha",["Sintonia","Conversa","Humor","Parceria","Energia"]],
amor:["❤️ Amor",["Carinho","Confiança","Sintonia","Conversa","Potencial"]],
amizade:["🤝 Amizade",["Confiança","Lealdade","Resenha","Parceria","Apoio"]],
crush:["💘 Crush",["Interesse","Conversa","Sintonia","Coragem","Reciprocidade"]],
ship:["💞 Ship",["Sintonia","Conversa","Humor","Parceria","Caos"]],
compatibilidade:["🔗 Compatibilidade",["Comunicação","Confiança","Humor","Parceria","Personalidade"]],
quimica:["🔥 Química",["Conversa","Energia","Espontaneidade","Conexão","Sintonia"]],
afinidade:["🎯 Afinidade",["Conversa","Interesses","Ritmo","Confiança","Parceria"]]
};

const individuais={
personalidade:["🧠 Personalidade",["Sociabilidade","Confiança","Criatividade","Espontaneidade","Paciência","Energia","Humor"]],
humor:["😄 Humor",["Felicidade","Energia","Paciência","Sociabilidade","Tranquilidade","Zoeira"]],
popularidade:["⭐ Popularidade",["Carisma","Presença","Interação","Resenha","Influência","Simpatia"]],
sorte:["🍀 Sorte",["Oportunidades","Estudos","Amizades","Energia","Boas surpresas"]],
previsao:["🔮 Previsão",["Oportunidades","Social","Foco","Estudos","Energia","Surpresas"]],
destino:["🧭 Destino",["Oportunidades","Mudanças","Coragem","Conexões","Progresso","Surpresas"]],
energia:["⚡ Energia",["Disposição","Foco","Social","Criatividade","Calma","Intensidade"]],
zoeira:["🎭 Zoeira",["Resenha","Caos","Memes","Sumiço","Desculpas","Aleatoriedade"]],
fofo:["🥰 Fofo",["Gentileza","Simpatia","Carinho","Apoio","Bom humor","Energia boa"]],
estilo:["✨ Estilo",["Presença","Criatividade","Confiança","Atitude","Originalidade","Social"]]
};

function frasePar(c,v){
  if(c==="amizade"){
    if(v>=85)return "⭐ Uma amizade com sintonia excelente.";
    if(v>=70)return "✨ Uma amizade com boa sintonia.";
    if(v>=50)return "🤝 Boa conexão entre vocês.";
    return "🎯 Perfis diferentes, mas a resenha pode funcionar.";
  }

  if(c==="quimica"){
    if(v>=85)return "✨ A sintonia entre vocês está muito alta.";
    if(v>=70)return "⚡ A química está em alta.";
    if(v>=50)return "🔥 Há uma boa conexão.";
    return "🎯 Hoje a sintonia está mais baixa.";
  }

  if(c==="afinidade"){
    if(v>=85)return "⭐ Afinidade excelente.";
    if(v>=70)return "✨ Vocês têm bastante em comum.";
    if(v>=50)return "🎯 Boa afinidade.";
    return "🔎 Perfis bem diferentes hoje.";
  }

  if(v>=85)return "✨ Combinação excelente.";
  if(v>=70)return "⭐ Vocês têm uma ótima combinação.";
  if(v>=50)return "🤝 Boa combinação, com alguns contrastes.";
  return "🎯 Perfis bem diferentes hoje.";
}

function fraseIndividual(c,v){
  const altas={
    personalidade:"🎯 Perfil marcante hoje.",
    humor:"☀️ Humor em alta hoje.",
    popularidade:"⭐ Presença forte no grupo.",
    sorte:"✨ Um ótimo momento para você.",
    previsao:"✨ O dia pode trazer boas oportunidades.",
    destino:"🚀 Caminho favorável para avançar.",
    energia:"🚀 Disposição em alta hoje.",
    zoeira:"😂 Hoje você está impossível no grupo.",
    fofo:"✨ Energia leve e positiva.",
    estilo:"😎 Presença marcante hoje."
  };

  const medias={
    personalidade:"🧠 Perfil equilibrado hoje.",
    humor:"😄 Dia tranquilo e positivo.",
    popularidade:"📊 Boa presença no grupo.",
    sorte:"🍀 Um bom dia para você.",
    previsao:"🔮 O dia tende a ser equilibrado.",
    destino:"🧭 Boas possibilidades pelo caminho.",
    energia:"⚡ Energia em bom nível.",
    zoeira:"🎭 Resenha garantida hoje.",
    fofo:"🥰 Boa energia com a galera.",
    estilo:"✨ Estilo em bom nível hoje."
  };

  const baixas={
    personalidade:"🎯 Um dia mais reservado.",
    humor:"🌙 Um dia para ir com calma.",
    popularidade:"⭐ Mais discreto hoje.",
    sorte:"🍀 Vá no seu ritmo hoje.",
    previsao:"🔮 Um dia mais tranquilo.",
    destino:"🧭 Sem pressa: siga no seu ritmo.",
    energia:"⚡ Melhor economizar energia hoje.",
    zoeira:"🎭 Zoeira em modo econômico.",
    fofo:"✨ Mais na sua hoje.",
    estilo:"😎 Um dia mais discreto."
  };

  if(v>=80)return altas[c]||"✨ Resultado em alta.";
  if(v>=50)return medias[c]||"📊 Resultado equilibrado.";
  return baixas[c]||"🎯 Resultado mais tranquilo hoje.";
}

module.exports=async function social(ctx){
  const c=ctx.cmd;

  if(pares[c]){
    if(!ctx.isGroup)return ctx.replyText("⚠️ Apenas em grupos."),true;

    let a,b;

    if(ctx.mentions.length>=2)[a,b]=ctx.mentions;
    else if(ctx.mentions.length===1){
      a=ctx.sender;
      b=ctx.mentions[0];
    }else if(c==="casal"){
      const ids=[...new Set(
        (ctx.metadata?.participants||[])
          .map(p=>N(p.id||p.phoneNumber||p.lid))
          .filter(Boolean)
      )];

      if(ids.length<2)return ctx.replyText("⚠️ Poucos participantes."),true;

      const k=hash(ctx.jid+diaKey())%ids.length;
      a=ids[k];
      b=ids[(k+1)%ids.length];
    }else{
      return ctx.replyText(`Use ${ctx.prefix}${c} @pessoa`),true;
    }

    if(N(a)===N(b))return ctx.replyText("😂 Escolha pessoas diferentes."),true;

    const [title,metrics]=pares[c];
    const seed=[N(a),N(b)].sort().join("|");

    const vals=metrics.map(x=>[
      x,
      score(`${ctx.jid}|${c}|${seed}|${diaKey()}|${x}`,20,100)
    ]);

    const avg=Math.round(vals.reduce((s,x)=>s+x[1],0)/vals.length);
    const best=[...vals].sort((x,y)=>y[1]-x[1])[0];

    await ctx.sock.sendMessage(ctx.jid,{
      text:
`╭─ ${title}
│ 👤 @${num(a)} + 👤 @${num(b)}
│ 💯 Resultado: ${avg}%
│ ⭐ Destaque: ${best[0]} — ${best[1]}%
╰─ ${frasePar(c,avg)}`,
      mentions:[a,b]
    });

    return true;
  }

  if(c==="match"){
    if(!ctx.isGroup)return ctx.replyText("⚠️ Apenas em grupos."),true;

    const ids=[...new Set(
      (ctx.metadata?.participants||[])
        .map(p=>N(p.id||p.phoneNumber||p.lid))
        .filter(u=>u&&u!==N(ctx.sender)&&u!==N(ctx.sock.user?.id))
    )];

    if(!ids.length)return ctx.replyText("⚠️ Não encontrei participantes."),true;

    const z=ids
      .map(u=>[u,score(`${ctx.jid}|match|${ctx.sender}|${u}|${diaKey()}`,20,100)])
      .sort((a,b)=>b[1]-a[1])[0];

    await ctx.sock.sendMessage(ctx.jid,{
      text:
`╭─ 💘 Match do Dia
│ 👤 @${num(ctx.sender)} + 👤 @${num(z[0])}
│ 💯 Resultado: ${z[1]}%
╰─ ${frasePar("match",z[1])}`,
      mentions:[ctx.sender,z[0]]
    });

    return true;
  }

  if(c==="porcentagem"){
    const t=ctx.args.join(" ").trim();

    if(!t)return ctx.replyText(`Use ${ctx.prefix}porcentagem tema`),true;

    const v=score(`${ctx.jid}|${ctx.sender}|${t}|${diaKey()}`,0,100);

    await ctx.sock.sendMessage(ctx.jid,{
      text:
`╭─ 📊 Porcentagem
│ 👤 @${num(ctx.sender)}
│ 🎯 Tema: ${t}
╰─ 💯 Resultado: ${v}%`,
      mentions:[ctx.sender]
    });

    return true;
  }

  if(individuais[c]){
    const a=ctx.mentions[0]||ctx.reply||ctx.sender;
    const [title,metrics]=individuais[c];

    const vals=metrics.map(x=>[
      x,
      score(`${ctx.jid}|${c}|${a}|${diaKey()}|${x}`)
    ]);

    const avg=Math.round(vals.reduce((s,x)=>s+x[1],0)/vals.length);
    const best=[...vals].sort((x,y)=>y[1]-x[1])[0];

    await ctx.sock.sendMessage(ctx.jid,{
      text:
`╭─ ${title}
│ 👤 @${num(a)}
│ 📊 Resultado: ${avg}%
│ ⭐ Destaque: ${best[0]} — ${best[1]}%
╰─ ${fraseIndividual(c,avg)}`,
      mentions:[a]
    });

    return true;
  }

  if(c==="mensagem"){
    const a=ctx.mentions[0]||ctx.reply||ctx.sender;

    const l=[
      "🎯 Escolha uma prioridade e avance nela.",
      "🔥 Um pequeno primeiro passo pode mudar o restante do caminho.",
      "🌱 Continuar aprendendo já é progresso.",
      "🤝 Valorize quem está presente nos momentos importantes.",
      "🌙 Nem toda provocação precisa de resposta.",
      "🚀 Um pouco feito hoje vale mais que um plano que nunca começa."
    ];

    const msg=l[hash(`${ctx.jid}|${a}|${diaKey()}`)%l.length];

    await ctx.sock.sendMessage(ctx.jid,{
      text:
`╭─ 💌 Mensagem
│ 👤 @${num(a)}
╰─ ${msg}`,
      mentions:[a]
    });

    return true;
  }

  if(c==="detetive"){
    if(!ctx.isGroup)return ctx.replyText("⚠️ Apenas em grupos."),true;

    const ids=[...new Set(
      (ctx.metadata?.participants||[])
        .map(p=>N(p.id||p.phoneNumber||p.lid))
        .filter(Boolean)
    )];

    if(ids.length<2)return ctx.replyText("⚠️ Poucos participantes."),true;

    const casos=[
      ["📱 Mensagem ignorada","Quem lê e esquece de responder?"],
      ["👻 Sumiço","Quem some e volta como se nada tivesse acontecido?"],
      ["😂 Meme","Quem provavelmente salva mais memes?"],
      ["⏰ Atraso","Quem tem mais chance de perder o horário?"],
      ["🍕 Último pedaço","Quem pegaria o último pedaço de pizza?"],
      ["🔋 Bateria","Quem tem mais chance de ficar com 1% de bateria?"]
    ];

    const caso=casos[hash(ctx.jid+diaKey())%casos.length];

    const rank=ids
      .map(u=>[
        u,
        score(`${ctx.jid}|detetive|${caso[0]}|${u}|${diaKey()}`,1,100)
      ])
      .sort((a,b)=>b[1]-a[1])
      .slice(0,2);

    await ctx.sock.sendMessage(ctx.jid,{
      text:
`╭─ 🕵️ Detetive Miranha
│ ${caso[0]}
│ ${caso[1]}
│ 🥇 @${num(rank[0][0])} — ${rank[0][1]}%
╰─ 🥈 @${num(rank[1][0])} — ${rank[1][1]}%`,
      mentions:rank.map(x=>x[0])
    });

    return true;
  }

  return false;
};
