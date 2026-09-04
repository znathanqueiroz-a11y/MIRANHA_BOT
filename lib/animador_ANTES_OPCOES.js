const db=require("./db");
const {N,num,dinheiro,idsParticipante,contexto}=require("./utils");
const PERGUNTAS_PAPO=require("../data/perguntas-papo");

const DESAFIOS=[
  "mande o meme mais engraçado que você tem",
  "conte uma história engraçada que já aconteceu com você",
  "escolha alguém do grupo e faça uma pergunta",
  "mande o último meme que você salvou",
  "fale uma música que você não enjoa de ouvir",
  "mande um GIF que combine com seu humor agora",
  "diga uma comida que você poderia comer toda semana",
  "conte uma curiosidade aleatória sobre você",
  "escolha uma pessoa do grupo para responder uma pergunta sua",
  "mande uma figurinha que represente seu dia",
  "fale um filme ou série que você recomenda",
  "diga uma coisa que sempre te faz rir",
  "mande um emoji que resuma sua semana",
  "fale uma habilidade que você gostaria de aprender",
  "diga qual lugar você gostaria de conhecer",
  "escolha uma música para representar o grupo hoje",
  "conte qual foi a melhor parte do seu dia",
  "fale um jogo que você gosta",
  "mande seu meme favorito do momento",
  "diga uma coisa simples que melhora seu dia",
  "escolha alguém e faça uma pergunta engraçada",
  "fale uma comida que você nunca recusaria",
  "mande uma figurinha aleatória sem explicar o motivo",
  "diga qual app você mais usou hoje",
  "fale uma coisa que você faria se tivesse o dia livre",
  "mande um GIF de comemoração",
  "diga uma palavra que descreva o grupo",
  "fale uma coisa nova que você aprendeu recentemente",
  "escolha alguém do grupo para indicar uma música",
  "mande uma reação que combine com o momento do grupo"
];

const PERGUNTAS=[
  "Qual música vocês mais ouviram essa semana?",
  "Qual comida nunca pode faltar?",
  "Se pudessem viajar hoje, para onde iriam?",
  "Qual filme ou série vocês indicam?",
  "Qual foi a coisa mais engraçada que aconteceu hoje?",
  "Qual jogo vocês mais gostam?",
  "O que deixa um grupo realmente divertido?",
  "Qual emoji vocês mais usam?",
  "Qual aplicativo vocês mais abriram hoje?",
  "Se ganhassem um dia totalmente livre, o que fariam?",
  "Qual comida todo mundo deveria provar pelo menos uma vez?",
  "Qual música combina com o grupo?",
  "Qual lugar vocês têm vontade de conhecer?",
  "Que talento vocês gostariam de ter?",
  "Qual foi a melhor coisa dessa semana?"
];

function estado(){
  const d=db.ler("animador",{grupos:{}});
  d.grupos=d.grupos||{};
  return d;
}
function salvar(d){db.salvar("animador",d);}
function aleatorio(min,max){return min+Math.floor(Math.random()*(max-min+1));}
function escolha(a){return a[Math.floor(Math.random()*a.length)];}
function premio(){return aleatorio(1000,100000);}

function proximoHorario(){
  const minutos=aleatorio(0,30);
  const atraso=minutos===0?30*1000:minutos*60*1000;
  return {quando:Date.now()+atraso,minutos};
}

function registrarGrupo(jid){
  if(!jid?.endsWith("@g.us"))return;
  const d=estado();
  const g=d.grupos[jid]||(d.grupos[jid]={});
  if(!Number(g.proximo||0)){
    const p=proximoHorario();
    g.proximo=p.quando;
    g.ultimoIntervalo=p.minutos;
    salvar(d);
  }
}

function participantes(metadata,botJid){
  const bot=N(botJid||"");
  return [...new Set(
    (metadata?.participants||[])
      .map(p=>N(p.id||p.phoneNumber||p.lid))
      .filter(Boolean)
      .filter(x=>x!==bot)
  )];
}

function perfil(grupo,usuario,metadata){
  const d=db.ler("economia",{});
  if(!d[grupo])d[grupo]={};

  const normal=N(usuario);
  const aliases=[...new Set(
    idsParticipante(metadata,normal)
      .concat([normal])
      .filter(Boolean)
      .map(N)
  )];

  const existentes=aliases.filter(id=>d[grupo][id]);
  let u=existentes[0]||aliases[0]||normal;

  if(!d[grupo][u]){
    d[grupo][u]={
      saldo:0,xp:0,level:1,
      ultimoDiario:0,ultimoTrabalho:0,
      inventario:{},cooldowns:{}
    };
  }

  return {d,u,p:d[grupo][u]};
}

function darMoedas(grupo,usuario,valor,metadata){
  const x=perfil(grupo,usuario,metadata);
  x.p.saldo=Number(x.p.saldo||0)+Number(valor||0);
  db.salvar("economia",x.d);
  return x.u;
}

function mesmoParticipante(metadata,a,b){
  const aa=idsParticipante(metadata,N(a)).map(N);
  const bb=idsParticipante(metadata,N(b)).map(N);
  return aa.some(x=>bb.includes(x));
}

async function metadataGrupo(sock,jid){
  return await sock.groupMetadata(jid);
}

async function mandarTodos(sock,jid,text,metadata){
  const ids=participantes(metadata,sock.user?.id);
  return await sock.sendMessage(jid,{text,mentions:ids});
}

function prepararAtivo(g,tipo,extra={}){
  g.ativo={
    tipo,
    expira:Date.now()+5*60*1000,
    respondidos:[],
    ...extra
  };
}

async function desafio(sock,jid,metadata,d,titulo="🎯 DESAFIO DO DIA",tipo="desafio"){
  const ids=participantes(metadata,sock.user?.id);
  if(!ids.length)return false;

  const alvo=escolha(ids);
  const tarefa=escolha(DESAFIOS);

  prepararAtivo(d.grupos[jid],tipo,{alvo,tarefa});
  salvar(d);

  const sent=await sock.sendMessage(jid,{
    text:
`${titulo}

@${num(alvo)} foi escolhido(a)!

Desafio:
${tarefa}

↩️ Responda esta mensagem quando terminar.
💰 Recompensa aleatória: 1.000 a 100.000 moedas.`,
    mentions:[alvo]
  });

  d.grupos[jid].ativo.messageId=sent?.key?.id||null;
  salvar(d);
  return true;
}

async function roleta(sock,jid,metadata,d){
  const ids=participantes(metadata,sock.user?.id);
  if(!ids.length)return false;

  const alvo=escolha(ids);
  const tarefa=escolha(DESAFIOS);

  prepararAtivo(d.grupos[jid],"roleta",{alvo,tarefa});
  salvar(d);

  const sent=await sock.sendMessage(jid,{
    text:
`🎡 ROLETA

@${num(alvo)} foi sorteado(a)!

Desafio:
${tarefa}

↩️ Responda esta mensagem quando terminar.
💰 Recompensa aleatória: 1.000 a 100.000 moedas.`,
    mentions:[alvo]
  });

  d.grupos[jid].ativo.messageId=sent?.key?.id||null;
  salvar(d);
  return true;
}

async function premioSurpresa(sock,jid,metadata,d){
  const ids=participantes(metadata,sock.user?.id);
  if(!ids.length)return false;

  const alvo=escolha(ids);
  prepararAtivo(d.grupos[jid],"premio",{alvo});
  salvar(d);

  const sent=await mandarTodos(
    sock,jid,
    `🎁 PRÊMIO SURPRESA

@${num(alvo)} foi sorteado(a)!

↩️ @${num(alvo)}, responda esta mensagem para resgatar.
💰 Prêmio aleatório: 1.000 a 100.000 moedas.`,
    metadata
  );

  d.grupos[jid].ativo.messageId=sent?.key?.id||null;
  salvar(d);
  return true;
}

async function sorteioInstantaneo(sock,jid,metadata,d){
  const ids=participantes(metadata,sock.user?.id);
  if(!ids.length)return false;

  const alvo=escolha(ids);
  prepararAtivo(d.grupos[jid],"sorteio",{alvo});
  salvar(d);

  const sent=await mandarTodos(
    sock,jid,
    `✨ SORTEIO INSTANTÂNEO

@${num(alvo)} foi sorteado(a)!

↩️ Responda esta mensagem para resgatar seu prêmio.
💰 Valor aleatório: 1.000 a 100.000 moedas.`,
    metadata
  );

  d.grupos[jid].ativo.messageId=sent?.key?.id||null;
  salvar(d);
  return true;
}

async function perguntaGrupo(sock,jid,metadata,d){
  prepararAtivo(d.grupos[jid],"pergunta",{});
  salvar(d);

  const sent=await mandarTodos(
    sock,jid,
    `💬 PERGUNTA DO GRUPO

${escolha(PERGUNTAS)}

↩️ Responda esta mensagem para participar.
💰 Cada pessoa pode ganhar uma vez: 1.000 a 100.000 moedas.`,
    metadata
  );

  d.grupos[jid].ativo.messageId=sent?.key?.id||null;
  salvar(d);
  return true;
}

async function abrirEvento(sock,jid,metadata,d){
  const valor=premio();

  prepararAtivo(d.grupos[jid],"evento",{premio:valor});
  salvar(d);

  const sent=await mandarTodos(
    sock,jid,
    `🎉 EVENTO RELÂMPAGO

💰 Prêmio: ${dinheiro(valor)} moedas

Primeiro que mandar !pegar leva o prêmio.`,
    metadata
  );

  d.grupos[jid].ativo.messageId=sent?.key?.id||null;
  salvar(d);
  return true;
}

async function abrirCaixa(sock,jid,metadata,d){
  prepararAtivo(d.grupos[jid],"caixa",{
    vagas:3,
    ganhadores:[]
  });
  salvar(d);

  const sent=await mandarTodos(
    sock,jid,
    `📦 CAIXA DO GRUPO

Os 3 primeiros que mandarem !caixa ganham.

💰 Cada prêmio é aleatório entre 1.000 e 100.000 moedas.`,
    metadata
  );

  d.grupos[jid].ativo.messageId=sent?.key?.id||null;
  salvar(d);
  return true;
}


async function papoGrupo(sock,jid,metadata){
  const pergunta=escolha(PERGUNTAS_PAPO);

  await mandarTodos(
    sock,
    jid,
    `💬 PAPO DO GRUPO

${pergunta}

Responde aí 👀`,
    metadata
  );

  return true;
}

async function disparar(sock,jid,tipo=null,metadata=null){
  const d=estado();
  const g=d.grupos[jid]||(d.grupos[jid]={});

  if(g.ativo&&Number(g.ativo.expira||0)>Date.now()){
    return false;
  }

  if(g.ativo)delete g.ativo;

  metadata=metadata||await metadataGrupo(sock,jid);

  const tipos=[
    "evento","desafio","caixa","roleta",
    "premio","pergunta","sorteio","missao","papo"
  ];

  tipo=tipo||escolha(tipos);

  if(tipo==="evento")return await abrirEvento(sock,jid,metadata,d);
  if(tipo==="caixa")return await abrirCaixa(sock,jid,metadata,d);
  if(tipo==="desafio")return await desafio(sock,jid,metadata,d);
  if(tipo==="roleta")return await roleta(sock,jid,metadata,d);
  if(tipo==="premio")return await premioSurpresa(sock,jid,metadata,d);
  if(tipo==="pergunta")return await perguntaGrupo(sock,jid,metadata,d);
  if(tipo==="sorteio")return await sorteioInstantaneo(sock,jid,metadata,d);
  if(tipo==="missao")return await desafio(sock,jid,metadata,d,"⚡ MISSÃO RELÂMPAGO","missao");
  if(tipo==="papo")return await papoGrupo(sock,jid,metadata);

  return false;
}

async function tick(sock){
  const d=estado();
  const agora=Date.now();
  let mudou=false;

  for(const [jid,g] of Object.entries(d.grupos)){
    if(!jid.endsWith("@g.us"))continue;

    if(g.ativo&&Number(g.ativo.expira||0)<=agora){
      delete g.ativo;
      mudou=true;
    }

    if(!Number(g.proximo||0)){
      const p=proximoHorario();
      g.proximo=p.quando;
      g.ultimoIntervalo=p.minutos;
      mudou=true;
      continue;
    }

    if(agora<Number(g.proximo))continue;
    if(g.ativo)continue;

    try{
      await disparar(sock,jid,null,null);
    }catch(e){
      console.log(`⚠️ Animador ${jid}:`,e.message);
    }

    const p=proximoHorario();
    g.proximo=p.quando;
    g.ultimoIntervalo=p.minutos;
    mudou=true;
  }

  if(mudou)salvar(d);
}

async function pegar(ctx){
  const d=estado();
  const g=d.grupos[ctx.jid];
  const a=g?.ativo;

  if(!a||a.tipo!=="evento"||Number(a.expira||0)<=Date.now()){
    if(g?.ativo&&Number(g.ativo.expira||0)<=Date.now()){
      delete g.ativo;
      salvar(d);
    }
    await ctx.replyText("📭 Não há evento relâmpago aberto agora.");
    return true;
  }

  const valor=Number(a.premio||premio());
  const vencedor=darMoedas(ctx.jid,ctx.sender,valor,ctx.metadata);

  delete g.ativo;
  salvar(d);

  await ctx.sock.sendMessage(ctx.jid,{
    text:`🏆 @${num(vencedor)} pegou primeiro!\n💰 +${dinheiro(valor)} moedas`,
    mentions:[vencedor]
  });

  return true;
}

async function pegarCaixa(ctx){
  const d=estado();
  const g=d.grupos[ctx.jid];
  const a=g?.ativo;

  if(!a||a.tipo!=="caixa"||Number(a.expira||0)<=Date.now()){
    if(g?.ativo&&Number(g.ativo.expira||0)<=Date.now()){
      delete g.ativo;
      salvar(d);
    }
    await ctx.replyText("📭 Não há caixa do grupo aberta agora.");
    return true;
  }

  a.ganhadores=(a.ganhadores||[]).map(N);
  const autor=N(ctx.sender);

  if(a.ganhadores.some(x=>mesmoParticipante(ctx.metadata,x,autor))){
    await ctx.replyText("📦 Você já pegou sua parte dessa caixa.");
    return true;
  }

  const valor=premio();
  const vencedor=darMoedas(ctx.jid,autor,valor,ctx.metadata);

  a.ganhadores.push(autor);
  a.vagas=Math.max(0,Number(a.vagas||3)-1);

  if(a.vagas<=0)delete g.ativo;
  salvar(d);

  await ctx.sock.sendMessage(ctx.jid,{
    text:
`📦 @${num(vencedor)} abriu uma parte da caixa!
💰 +${dinheiro(valor)} moedas${a.vagas>0?`\nRestam ${a.vagas} vaga(s).`:"\n✅ Caixa encerrada!"}`,
    mentions:[vencedor]
  });

  return true;
}

async function responderMensagem({sock,msg,jid,sender,text,metadata,prefix}){
  if(!jid?.endsWith("@g.us"))return false;
  if(!text||text.startsWith(prefix))return false;

  const d=estado();
  const g=d.grupos[jid];
  const a=g?.ativo;

  if(!a)return false;

  if(Number(a.expira||0)<=Date.now()){
    delete g.ativo;
    salvar(d);
    return false;
  }

  if(["evento","caixa"].includes(a.tipo))return false;

  const replyId=contexto(msg)?.stanzaId||null;

  // A pessoa precisa responder exatamente a mensagem do evento.
  if(!replyId||!a.messageId||replyId!==a.messageId)return false;

  a.respondidos=(a.respondidos||[]).map(N);

  if(a.tipo==="pergunta"){
    if(a.respondidos.some(x=>mesmoParticipante(metadata,x,sender))){
      await sock.sendMessage(jid,{
        text:`@${num(sender)}, você já recebeu por esta pergunta.`,
        mentions:[sender]
      });
      return true;
    }

    const valor=premio();
    const vencedor=darMoedas(jid,sender,valor,metadata);

    a.respondidos.push(N(sender));
    salvar(d);

    await sock.sendMessage(jid,{
      text:
`✅ @${num(vencedor)} respondeu a pergunta do grupo!
💰 +${dinheiro(valor)} moedas`,
      mentions:[vencedor]
    });

    return true;
  }

  if(!a.alvo||!mesmoParticipante(metadata,a.alvo,sender)){
    await sock.sendMessage(jid,{
      text:`⏳ Esse evento foi sorteado para @${num(a.alvo)}.`,
      mentions:[a.alvo]
    });
    return true;
  }

  if(a.respondidos.some(x=>mesmoParticipante(metadata,x,sender))){
    return true;
  }

  const valor=premio();
  const vencedor=darMoedas(jid,sender,valor,metadata);

  a.respondidos.push(N(sender));
  delete g.ativo;
  salvar(d);

  const nomes={
    desafio:"🎯 Desafio concluído",
    roleta:"🎡 Roleta concluída",
    premio:"🎁 Prêmio resgatado",
    sorteio:"✨ Sorteio resgatado",
    missao:"⚡ Missão concluída"
  };

  await sock.sendMessage(jid,{
    text:
`${nomes[a.tipo]||"✅ Evento concluído"}!

@${num(vencedor)}
💰 +${dinheiro(valor)} moedas`,
    mentions:[vencedor]
  });

  return true;
}

module.exports={
  registrarGrupo,tick,disparar,pegar,pegarCaixa,responderMensagem,
  DESAFIOS,PERGUNTAS
};

