const db=require("./db");
const {N,num,dinheiro,idsParticipante}=require("./utils");

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

function proximoHorario(){
  const minutos=aleatorio(0,30);
  // Se cair 0, sai quase imediatamente, mas nunca entra em loop instantâneo.
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

async function metadataGrupo(sock,jid){
  return await sock.groupMetadata(jid);
}

async function mandarTodos(sock,jid,text,metadata){
  const ids=participantes(metadata,sock.user?.id);
  await sock.sendMessage(jid,{text,mentions:ids});
}

async function desafio(sock,jid,metadata,titulo="🎯 DESAFIO DO DIA"){
  const ids=participantes(metadata,sock.user?.id);
  if(!ids.length)return;
  const alvo=escolha(ids);
  const d=escolha(DESAFIOS);
  await sock.sendMessage(jid,{
    text:`${titulo}\n\n@${num(alvo)} foi escolhido(a)!\n\nDesafio:\n${d}`,
    mentions:[alvo]
  });
}

async function roleta(sock,jid,metadata){
  const ids=participantes(metadata,sock.user?.id);
  if(!ids.length)return;
  const alvo=escolha(ids);

  if(Math.random()<0.5){
    const premio=aleatorio(1000,100000);
    darMoedas(jid,alvo,premio,metadata);
    await sock.sendMessage(jid,{
      text:`🎡 ROLETA\n\n@${num(alvo)} foi sorteado(a)!\n\n💰 Prêmio: ${dinheiro(premio)} moedas`,
      mentions:[alvo]
    });
  }else{
    await sock.sendMessage(jid,{
      text:`🎡 ROLETA\n\n@${num(alvo)} foi sorteado(a)!\n\nDesafio:\n${escolha(DESAFIOS)}`,
      mentions:[alvo]
    });
  }
}

async function premioSurpresa(sock,jid,metadata){
  const ids=participantes(metadata,sock.user?.id);
  if(!ids.length)return;
  const alvo=escolha(ids);
  const premio=aleatorio(1000,100000);
  darMoedas(jid,alvo,premio,metadata);
  await mandarTodos(
    sock,jid,
    `🎁 PRÊMIO SURPRESA\n\n@${num(alvo)} foi sorteado(a)!\n💰 +${dinheiro(premio)} moedas`,
    metadata
  );
}

async function sorteioInstantaneo(sock,jid,metadata){
  const ids=participantes(metadata,sock.user?.id);
  if(!ids.length)return;
  const alvo=escolha(ids);
  const premio=aleatorio(1000,50000);
  darMoedas(jid,alvo,premio,metadata);
  await mandarTodos(
    sock,jid,
    `✨ SORTEIO INSTANTÂNEO\n\n@${num(alvo)} ganhou ${dinheiro(premio)} moedas!`,
    metadata
  );
}

async function perguntaGrupo(sock,jid,metadata){
  await mandarTodos(
    sock,jid,
    `💬 PERGUNTA DO GRUPO\n\n${escolha(PERGUNTAS)}`,
    metadata
  );
}

async function abrirEvento(sock,jid,metadata,d){
  const premio=aleatorio(1000,100000);
  d.grupos[jid].ativo={
    tipo:"evento",
    premio,
    expira:Date.now()+5*60*1000
  };
  salvar(d);

  await mandarTodos(
    sock,jid,
    `🎉 EVENTO RELÂMPAGO\n\n💰 Prêmio: ${dinheiro(premio)} moedas\n\nPrimeiro que mandar !pegar leva o prêmio.`,
    metadata
  );
}

async function abrirCaixa(sock,jid,metadata,d){
  d.grupos[jid].ativo={
    tipo:"caixa",
    vagas:3,
    ganhadores:[],
    expira:Date.now()+5*60*1000
  };
  salvar(d);

  await mandarTodos(
    sock,jid,
    "📦 CAIXA DO GRUPO\n\nOs 3 primeiros que mandarem !caixa ganham uma quantidade aleatória de moedas.",
    metadata
  );
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
    "premio","pergunta","sorteio","missao"
  ];
  tipo=tipo||escolha(tipos);

  if(tipo==="evento")await abrirEvento(sock,jid,metadata,d);
  else if(tipo==="caixa")await abrirCaixa(sock,jid,metadata,d);
  else if(tipo==="desafio")await desafio(sock,jid,metadata);
  else if(tipo==="roleta")await roleta(sock,jid,metadata);
  else if(tipo==="premio")await premioSurpresa(sock,jid,metadata);
  else if(tipo==="pergunta")await perguntaGrupo(sock,jid,metadata);
  else if(tipo==="sorteio")await sorteioInstantaneo(sock,jid,metadata);
  else if(tipo==="missao")await desafio(sock,jid,metadata,"⚡ MISSÃO RELÂMPAGO");

  return true;
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

  const premio=Number(a.premio||0);
  const vencedor=darMoedas(ctx.jid,ctx.sender,premio,ctx.metadata);
  delete g.ativo;
  salvar(d);

  await ctx.sock.sendMessage(ctx.jid,{
    text:`🏆 @${num(vencedor)} pegou primeiro!\n💰 +${dinheiro(premio)} moedas`,
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

  if(a.ganhadores.includes(autor)){
    await ctx.replyText("📦 Você já pegou sua parte dessa caixa.");
    return true;
  }

  const premio=aleatorio(1000,50000);
  const vencedor=darMoedas(ctx.jid,autor,premio,ctx.metadata);
  a.ganhadores.push(autor);
  a.vagas=Math.max(0,Number(a.vagas||3)-1);

  if(a.vagas<=0)delete g.ativo;
  salvar(d);

  await ctx.sock.sendMessage(ctx.jid,{
    text:`📦 @${num(vencedor)} abriu uma parte da caixa!\n💰 +${dinheiro(premio)} moedas${a.vagas>0?`\nRestam ${a.vagas} vaga(s).`:"\n✅ Caixa encerrada!"}`,
    mentions:[vencedor]
  });
  return true;
}

module.exports={
  registrarGrupo,tick,disparar,pegar,pegarCaixa,
  DESAFIOS,PERGUNTAS
};

