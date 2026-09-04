const db=require("./db");
const {N,num,dinheiro,idsParticipante}=require("./utils");

let PERGUNTAS_PAPO=[];
try{PERGUNTAS_PAPO=require("../data/perguntas-papo");}catch{}

const PERGUNTAS_PREMIADAS=[{"p": "Qual planeta é conhecido como Planeta Vermelho?", "o": ["Vênus", "Marte", "Júpiter", "Mercúrio"], "r": "B"}, {"p": "Quantos dias tem uma semana?", "o": ["5", "6", "7", "8"], "r": "C"}, {"p": "Qual animal produz mel?", "o": ["Abelha", "Borboleta", "Formiga", "Joaninha"], "r": "A"}, {"p": "Qual é a capital do Brasil?", "o": ["Rio de Janeiro", "São Paulo", "Brasília", "Salvador"], "r": "C"}, {"p": "Quantos meses tem um ano?", "o": ["10", "11", "12", "13"], "r": "C"}, {"p": "Qual destes é um oceano?", "o": ["Saara", "Atlântico", "Everest", "Nilo"], "r": "B"}, {"p": "Qual cor resulta da mistura de azul e amarelo?", "o": ["Verde", "Roxo", "Laranja", "Rosa"], "r": "A"}, {"p": "Qual instrumento tem teclas brancas e pretas?", "o": ["Violão", "Piano", "Tambor", "Flauta"], "r": "B"}, {"p": "Qual é o maior planeta do Sistema Solar?", "o": ["Terra", "Marte", "Júpiter", "Saturno"], "r": "C"}, {"p": "Quantas horas tem um dia?", "o": ["12", "18", "24", "36"], "r": "C"}, {"p": "Qual destes mede temperatura?", "o": ["Termômetro", "Régua", "Bússola", "Cronômetro"], "r": "A"}, {"p": "Quantos lados tem um triângulo?", "o": ["2", "3", "4", "5"], "r": "B"}, {"p": "Quantos lados tem um quadrado?", "o": ["3", "4", "5", "6"], "r": "B"}, {"p": "Quanto é 5 + 5?", "o": ["8", "9", "10", "11"], "r": "C"}, {"p": "Quanto é 9 - 4?", "o": ["3", "4", "5", "6"], "r": "C"}, {"p": "Quanto é 3 × 4?", "o": ["7", "10", "12", "14"], "r": "C"}, {"p": "Quanto é 20 ÷ 4?", "o": ["4", "5", "6", "8"], "r": "B"}, {"p": "Qual destes é uma fruta?", "o": ["Cenoura", "Batata", "Manga", "Alface"], "r": "C"}, {"p": "Qual destes é um meio de transporte aéreo?", "o": ["Trem", "Avião", "Navio", "Ônibus"], "r": "B"}, {"p": "Qual destes números é par?", "o": ["7", "9", "12", "15"], "r": "C"}, {"p": "Qual destes é um navegador de internet?", "o": ["Chrome", "Excel", "Photoshop", "Spotify"], "r": "A"}, {"p": "Qual destes é um sistema operacional de celular?", "o": ["Android", "YouTube", "Netflix", "Discord"], "r": "A"}, {"p": "Qual destes é um aplicativo de mensagens?", "o": ["WhatsApp", "Calculadora", "Câmera", "Relógio"], "r": "A"}, {"p": "Qual destes formatos costuma ser de imagem?", "o": ["JPG", "MP3", "TXT", "ZIP"], "r": "A"}, {"p": "Qual destes formatos costuma ser de áudio?", "o": ["PNG", "MP3", "PDF", "DOCX"], "r": "B"}, {"p": "Qual destes formatos costuma ser de vídeo?", "o": ["MP4", "CSV", "XLSX", "SVG"], "r": "A"}, {"p": "Qual destes é um animal que pode voar?", "o": ["Águia", "Tartaruga", "Cavalo", "Golfinho"], "r": "A"}, {"p": "Qual destes animais possui casco?", "o": ["Tartaruga", "Gato", "Pato", "Macaco"], "r": "A"}, {"p": "Qual destes é um metal?", "o": ["Ouro", "Vidro", "Madeira", "Plástico"], "r": "A"}, {"p": "Qual destes é uma fonte natural de luz?", "o": ["Sol", "Espelho", "Livro", "Mesa"], "r": "A"}, {"p": "Em qual direção o Sol nasce aproximadamente?", "o": ["Norte", "Sul", "Leste", "Oeste"], "r": "C"}, {"p": "Qual destes é um satélite natural da Terra?", "o": ["Lua", "Sol", "Marte", "Vênus"], "r": "A"}, {"p": "Quantos minutos tem uma hora?", "o": ["30", "45", "60", "90"], "r": "C"}, {"p": "Quantos segundos tem um minuto?", "o": ["30", "50", "60", "100"], "r": "C"}, {"p": "Qual destes é um país?", "o": ["Brasil", "Europa", "Saara", "Pacífico"], "r": "A"}];

const DESAFIOS=[
"mande o meme mais engraçado que você tem",
"conte uma história engraçada que já aconteceu com você",
"mande o último meme que você salvou",
"fale uma música que você não enjoa de ouvir",
"mande um GIF que combine com seu humor agora",
"diga uma comida que você poderia comer toda semana",
"conte uma curiosidade aleatória sobre você",
"mande uma figurinha que represente seu dia",
"fale um filme ou série que você recomenda",
"diga uma coisa que sempre te faz rir",
"mande um emoji que resuma sua semana",
"fale uma habilidade que você gostaria de aprender",
"diga qual lugar você gostaria de conhecer",
"conte qual foi a melhor parte do seu dia",
"fale um jogo que você gosta",
"mande seu meme favorito do momento",
"diga uma coisa simples que melhora seu dia",
"fale uma comida que você nunca recusaria",
"mande uma figurinha aleatória sem explicar",
"diga qual app você mais usou hoje",
"mande um GIF de comemoração",
"diga uma palavra que descreva o grupo",
"fale uma coisa nova que você aprendeu recentemente",
"mande uma reação que combine com o momento do grupo",
"indique uma música para alguém do grupo",
"conte uma curiosidade divertida",
"mande um emoji e deixe o grupo adivinhar o motivo",
"diga um filme que você veria novamente",
"escolha uma comida que representa seu humor",
"mande uma figurinha que combine com o grupo"
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
  return {quando:Date.now()+(minutos===0?30000:minutos*60000),minutos};
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
  return [...new Set((metadata?.participants||[])
    .map(p=>N(p.id||p.phoneNumber||p.lid))
    .filter(Boolean)
    .filter(x=>x!==bot))];
}
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
function conteudoReal(msg){
  let m=msg?.message||{};
  for(let i=0;i<5;i++){
    if(m.ephemeralMessage?.message){m=m.ephemeralMessage.message;continue;}
    if(m.viewOnceMessage?.message){m=m.viewOnceMessage.message;continue;}
    if(m.viewOnceMessageV2?.message){m=m.viewOnceMessageV2.message;continue;}
    break;
  }
  return m;
}
function contextoResposta(msg){
  const m=conteudoReal(msg);
  return m.extendedTextMessage?.contextInfo||
         m.imageMessage?.contextInfo||
         m.videoMessage?.contextInfo||
         m.documentMessage?.contextInfo||
         m.audioMessage?.contextInfo||
         m.stickerMessage?.contextInfo||
         {};
}
function opcao(text){
  const t=String(text||"").trim().toUpperCase();
  if(t==="A"||t==="1"||t==="1️⃣"||t.startsWith("A)"))return "A";
  if(t==="B"||t==="2"||t==="2️⃣"||t.startsWith("B)"))return "B";
  if(t==="C"||t==="3"||t==="3️⃣"||t.startsWith("C)"))return "C";
  if(t==="D"||t==="4"||t==="4️⃣"||t.startsWith("D)"))return "D";
  return null;
}
async function mandarTodos(sock,jid,text,metadata){
  return sock.sendMessage(jid,{text,mentions:participantes(metadata,sock.user?.id)});
}
function preparar(g,tipo,extra={}){
  g.ativo={tipo,expira:Date.now()+5*60000,respondidos:[],...extra};
}
async function abrirEvento(sock,jid,metadata,d){
  const valor=premio();
  preparar(d.grupos[jid],"evento",{premio:valor});
  salvar(d);
  const sent=await mandarTodos(sock,jid,
`🎉 EVENTO RELÂMPAGO

💰 Prêmio: ${dinheiro(valor)} moedas

Primeiro que mandar !pegar leva o prêmio.`,metadata);
  d.grupos[jid].ativo.messageId=sent?.key?.id||null;
  salvar(d);
  return true;
}
async function abrirCaixa(sock,jid,metadata,d){
  preparar(d.grupos[jid],"caixa",{vagas:3,ganhadores:[]});
  salvar(d);
  const sent=await mandarTodos(sock,jid,
`📦 CAIXA DO GRUPO

Os 3 primeiros que mandarem !caixa ganham.

💰 Cada prêmio: 1.000 a 100.000 moedas.`,metadata);
  d.grupos[jid].ativo.messageId=sent?.key?.id||null;
  salvar(d);
  return true;
}
async function perguntaPremiada(sock,jid,metadata,d){
  const q=escolha(PERGUNTAS_PREMIADAS);
  preparar(d.grupos[jid],"pergunta",{correta:q.r});
  salvar(d);
  const letras=["A","B","C","D"];
  const lista=q.o.map((x,i)=>`${letras[i]}) ${x}`).join("\n");
  const sent=await mandarTodos(sock,jid,
`🧠 PERGUNTA PREMIADA

${q.p}

${lista}

⌨️ Responda com: !eventoresp A, B, C ou D.
💰 Acertou: ganha de 1.000 a 100.000 moedas.`,metadata);
  d.grupos[jid].ativo.messageId=sent?.key?.id||null;
  salvar(d);
  return true;
}
async function desafio(sock,jid,metadata,d,titulo="🎯 DESAFIO DO DIA",tipo="desafio"){
  const ids=participantes(metadata,sock.user?.id);
  if(!ids.length)return false;
  const alvo=escolha(ids),tarefa=escolha(DESAFIOS);
  preparar(d.grupos[jid],tipo,{alvo,tarefa});
  salvar(d);
  const sent=await sock.sendMessage(jid,{
    text:`${titulo}

@${num(alvo)} foi escolhido(a)!

Desafio:
${tarefa}

A) Concluí
B) Passar

⌨️ Use !eventoresp A para concluir/resgatar ou !eventoresp B para passar.
💰 A opção A paga de 1.000 a 100.000 moedas.`,
    mentions:[alvo]
  });
  d.grupos[jid].ativo.messageId=sent?.key?.id||null;
  salvar(d);
  return true;
}
async function alvoResgate(sock,jid,metadata,d,tipo,titulo){
  const ids=participantes(metadata,sock.user?.id);
  if(!ids.length)return false;
  const alvo=escolha(ids);
  preparar(d.grupos[jid],tipo,{alvo});
  salvar(d);
  const sent=await mandarTodos(sock,jid,
`${titulo}

@${num(alvo)} foi sorteado(a)!

A) Resgatar prêmio
B) Deixar passar

⌨️ Use !eventoresp A para concluir/resgatar ou !eventoresp B para passar.
💰 Resgate: 1.000 a 100.000 moedas.`,metadata);
  d.grupos[jid].ativo.messageId=sent?.key?.id||null;
  salvar(d);
  return true;
}
async function papoGrupo(sock,jid,metadata){
  const fallback=["Qual música vocês mais ouviram essa semana?","Qual comida nunca pode faltar?","Qual foi a melhor parte do dia?"];
  const pergunta=escolha(PERGUNTAS_PAPO.length?PERGUNTAS_PAPO:fallback);
  await mandarTodos(sock,jid,
`💬 PAPO DO GRUPO

${pergunta}

Responde aí 👀

ℹ️ Só para conversar — não vale moedas.`,metadata);
  return true;
}
async function disparar(sock,jid,tipo=null,metadata=null){
  const d=estado(),g=d.grupos[jid]||(d.grupos[jid]={});
  if(g.ativo&&Number(g.ativo.expira||0)>Date.now())return false;
  if(g.ativo)delete g.ativo;
  metadata=metadata||await sock.groupMetadata(jid);
  tipo=tipo||escolha(["evento","desafio","caixa","roleta","premio","pergunta","sorteio","missao","papo"]);
  if(tipo==="evento")return abrirEvento(sock,jid,metadata,d);
  if(tipo==="caixa")return abrirCaixa(sock,jid,metadata,d);
  if(tipo==="desafio")return desafio(sock,jid,metadata,d);
  if(tipo==="roleta")return desafio(sock,jid,metadata,d,"🎡 ROLETA","roleta");
  if(tipo==="premio")return alvoResgate(sock,jid,metadata,d,"premio","🎁 PRÊMIO SURPRESA");
  if(tipo==="pergunta")return perguntaPremiada(sock,jid,metadata,d);
  if(tipo==="sorteio")return alvoResgate(sock,jid,metadata,d,"sorteio","✨ SORTEIO INSTANTÂNEO");
  if(tipo==="missao")return desafio(sock,jid,metadata,d,"⚡ MISSÃO RELÂMPAGO","missao");
  if(tipo==="papo")return papoGrupo(sock,jid,metadata);
  return false;
}


const ANIMADOR_LISTENER=Symbol.for("miranhabot.animador.respostas");

function textoDaMensagem(msg){
  const m=conteudoReal(msg);

  return String(
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.buttonsResponseMessage?.selectedDisplayText ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.title ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m.templateButtonReplyMessage?.selectedDisplayText ||
    m.templateButtonReplyMessage?.selectedId ||
    ""
  ).trim();
}

function garantirListener(sock){
  if(!sock?.ev?.on)return;
  if(sock[ANIMADOR_LISTENER])return;

  sock[ANIMADOR_LISTENER]=true;

  sock.ev.on("messages.upsert",async ({messages})=>{
    for(const msg of messages||[]){
      try{
        if(!msg?.message||msg.key?.fromMe)continue;

        const jid=msg.key?.remoteJid;
        if(!jid?.endsWith("@g.us"))continue;

        const d=estado();
        const ativo=d.grupos?.[jid]?.ativo;
        if(!ativo)continue;

        const texto=textoDaMensagem(msg);
        if(!texto||texto.startsWith("!"))continue;

        const replyId=contextoResposta(msg)?.stanzaId||null;
        if(!replyId||!ativo.messageId||replyId!==ativo.messageId)continue;

        const sender=N(
          msg.key?.participant ||
          msg.key?.participantAlt ||
          contextoResposta(msg)?.participant ||
          ""
        );
        if(!sender)continue;

        const metadata=await sock.groupMetadata(jid);

        await responderMensagem({
          sock,
          msg,
          jid,
          sender,
          text:texto,
          metadata,
          prefix:"!"
        });
      }catch(e){
        console.log("⚠️ Resposta de evento:",e.message);
      }
    }
  });
}


async function tick(sock){
  garantirListener(sock);
  const d=estado(),agora=Date.now();
  let mudou=false;
  for(const [jid,g] of Object.entries(d.grupos)){
    if(!jid.endsWith("@g.us"))continue;
    if(g.ativo&&Number(g.ativo.expira||0)<=agora){delete g.ativo;mudou=true;}
    if(!Number(g.proximo||0)){
      const p=proximoHorario();
      g.proximo=p.quando;g.ultimoIntervalo=p.minutos;mudou=true;continue;
    }
    if(agora<Number(g.proximo)||g.ativo)continue;
    try{await disparar(sock,jid);}catch(e){console.log(`⚠️ Animador ${jid}:`,e.message);}
    const p=proximoHorario();
    g.proximo=p.quando;g.ultimoIntervalo=p.minutos;mudou=true;
  }
  if(mudou)salvar(d);
}
async function pegar(ctx){
  const d=estado(),g=d.grupos[ctx.jid],a=g?.ativo;
  if(!a||a.tipo!=="evento"||Number(a.expira||0)<=Date.now()){
    await ctx.replyText("📭 Não há evento relâmpago aberto agora.");return true;
  }
  const valor=Number(a.premio||premio());
  const vencedor=darMoedas(ctx.jid,ctx.sender,valor,ctx.metadata);
  delete g.ativo;salvar(d);
  await ctx.sock.sendMessage(ctx.jid,{text:`🏆 @${num(vencedor)} pegou primeiro!\n💰 +${dinheiro(valor)} moedas`,mentions:[vencedor]});
  return true;
}
async function pegarCaixa(ctx){
  const d=estado(),g=d.grupos[ctx.jid],a=g?.ativo;
  if(!a||a.tipo!=="caixa"||Number(a.expira||0)<=Date.now()){
    await ctx.replyText("📭 Não há caixa do grupo aberta agora.");return true;
  }
  a.ganhadores=(a.ganhadores||[]).map(N);
  if(a.ganhadores.some(x=>mesmo(ctx.metadata,x,ctx.sender))){
    await ctx.replyText("📦 Você já pegou sua parte dessa caixa.");return true;
  }
  const valor=premio();
  const vencedor=darMoedas(ctx.jid,ctx.sender,valor,ctx.metadata);
  a.ganhadores.push(N(ctx.sender));
  a.vagas=Math.max(0,Number(a.vagas||3)-1);
  if(a.vagas<=0)delete g.ativo;
  salvar(d);
  await ctx.sock.sendMessage(ctx.jid,{text:`📦 @${num(vencedor)} ganhou +${dinheiro(valor)} moedas${a.vagas>0?`\nRestam ${a.vagas} vaga(s).`:"\n✅ Caixa encerrada!"}`,mentions:[vencedor]});
  return true;
}
async function responderMensagem({sock,msg,jid,sender,text,metadata,prefix}){
  if(!jid?.endsWith("@g.us")||!text||String(text).startsWith(prefix))return false;
  const d=estado(),g=d.grupos[jid],a=g?.ativo;
  if(!a)return false;
  if(Number(a.expira||0)<=Date.now()){delete g.ativo;salvar(d);return false;}
  if(["evento","caixa"].includes(a.tipo))return false;

  const replyId=contextoResposta(msg)?.stanzaId||null;
  if(!replyId||!a.messageId||replyId!==a.messageId)return false;

  const op=opcao(text);
  if(!op){
    await sock.sendMessage(jid,{text:"⚠️ Responda usando uma das opções mostradas no evento."});
    return true;
  }

  a.respondidos=(a.respondidos||[]).map(N);

  if(a.tipo==="pergunta"){
    if(a.respondidos.some(x=>mesmo(metadata,x,sender))){
      await sock.sendMessage(jid,{text:`@${num(sender)}, você já respondeu esta pergunta.`,mentions:[sender]});
      return true;
    }
    a.respondidos.push(N(sender));
    if(op!==a.correta){
      salvar(d);
      await sock.sendMessage(jid,{text:`❌ @${num(sender)}, resposta incorreta.`,mentions:[sender]});
      return true;
    }
    const valor=premio();
    const vencedor=darMoedas(jid,sender,valor,metadata);
    salvar(d);
    await sock.sendMessage(jid,{text:`✅ @${num(vencedor)} acertou!\n💰 +${dinheiro(valor)} moedas`,mentions:[vencedor]});
    return true;
  }

  if(!a.alvo||!mesmo(metadata,a.alvo,sender)){
    await sock.sendMessage(jid,{text:`⏳ Esse evento foi sorteado para @${num(a.alvo)}.`,mentions:[a.alvo]});
    return true;
  }

  if(op==="B"){
    delete g.ativo;salvar(d);
    await sock.sendMessage(jid,{text:`↪️ @${num(sender)} decidiu passar este evento.`,mentions:[sender]});
    return true;
  }

  if(op!=="A"){
    await sock.sendMessage(jid,{text:"⚠️ Use A para concluir/resgatar ou B para passar."});
    return true;
  }

  const valor=premio();
  const vencedor=darMoedas(jid,sender,valor,metadata);
  delete g.ativo;salvar(d);
  const nomes={desafio:"🎯 Desafio concluído",roleta:"🎡 Roleta concluída",premio:"🎁 Prêmio resgatado",sorteio:"✨ Sorteio resgatado",missao:"⚡ Missão concluída"};
  await sock.sendMessage(jid,{text:`${nomes[a.tipo]||"✅ Evento concluído"}!\n\n@${num(vencedor)}\n💰 +${dinheiro(valor)} moedas`,mentions:[vencedor]});
  return true;
}
module.exports={registrarGrupo,tick,disparar,pegar,pegarCaixa,responderMensagem,DESAFIOS,PERGUNTAS_PREMIADAS};

