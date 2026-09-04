const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser
}=require("@whiskeysockets/baileys");
const P=require("pino");
const qrcode=require("qrcode-terminal");
const db=require("./lib/db");
const router=require("./router");
const {
  N,num,isOwnerJid,mencoesContexto,contexto,quotedParticipant,
  textoMensagem,idsParticipante,diaKey,semanaKey,conteudo,jidChatDaMensagem
}=require("./lib/utils");
const {PADRAO:WELCOME_PADRAO,SAIDA_PADRAO,lerImagem}=require("./handlers/configuracoes");
const {toxicas}=require("./handlers/seguranca");
const {tick:automsgTick}=require("./handlers/automsg");
const animador=require("./lib/animador");
const botLogger = require("./utils/logger");

let dono="";
let donoLid="";

try{
  const cfg=require("./config/config");
  dono=cfg.dono||"";
  donoLid=cfg.donoLid||"";
}catch{
  dono=process.env.BOT_DONO||"";
}

const logger=P({level:"silent"});
const CACHE_TTL=5*60*1000;
const cacheGrupo=new Map();
const history=new Map();
const flood=new Map();
let reconectando=false;

function getCache(jid){
  const x=cacheGrupo.get(jid);
  if(!x)return null;
  if(Date.now()-x.salvoEm>CACHE_TTL){cacheGrupo.delete(jid);return null;}
  return x.metadata;
}
function setCache(jid,metadata){if(jid&&metadata)cacheGrupo.set(jid,{metadata,salvoEm:Date.now()});}
function invalidateGroupCache(jid){if(jid)cacheGrupo.delete(jid);}

function prefixoAtual(){
  const d=db.ler("prefixo",{prefix:"!"});
  return typeof d.prefix==="string"&&d.prefix?d.prefix:"!";
}

function isAdminByMetadata(metadata,sender){
  const ids=idsParticipante(metadata,sender);
  return (metadata?.participants||[]).some(p=>{
    const pids=[p.id,p.phoneNumber,p.lid].filter(Boolean).map(N);
    return p.admin&&pids.some(x=>ids.includes(x));
  });
}

function isWhitelisted(jid,sender,metadata){
  const list=(db.ler("whitelist",{})[jid]||[]).map(N);
  const ids=idsParticipante(metadata,sender);
  return ids.some(x=>list.includes(x));
}

function modPerm(jid,sender,cmd,metadata){
  const d=db.ler("moderadores",{})[jid];
  if(!d)return false;
  const ids=idsParticipante(metadata,sender);
  const mod=(d.mods||[]).map(N).find(x=>ids.includes(x));
  if(!mod)return false;
  const p=d.perms?.[mod]||[];
  return p.includes(cmd);
}

function usuarioBloqueado(jid,sender,metadata){
  const g=db.ler("controle",{})[jid]||{};
  const ids=idsParticipante(metadata,sender);
  return (g.usuarios||[]).map(N).some(x=>ids.includes(x));
}

function blacklisted(sender){
  const l=(db.ler("controle_global",{blacklist:[],comandos:[]}).blacklist||[]).map(N);
  return l.includes(N(sender));
}

function cmdBloqueadoGlobal(cmd){
  return (db.ler("controle_global",{blacklist:[],comandos:[]}).comandos||[]).includes(cmd);
}
function cmdBloqueadoGrupo(jid,cmd){
  return (db.ler("controle",{})[jid]?.comandos||[]).includes(cmd);
}

function registrarAtividade(jid,sender){
  const cont=db.ler("contador",{});
  if(cont[jid]===false)return;
  const d=db.ler("atividade",{});
  if(!d[jid])d[jid]={};
  const u=N(sender);
  let v=d[jid][u];
  if(typeof v==="number")v={total:v,dia:0,semana:0,diaKey:"",semanaKey:""};
  if(!v)v={total:0,dia:0,semana:0,diaKey:"",semanaKey:""};
  const dk=diaKey(),wk=semanaKey();
  if(v.diaKey!==dk){v.dia=0;v.diaKey=dk;}
  if(v.semanaKey!==wk){v.semana=0;v.semanaKey=wk;}
  v.total=Number(v.total||0)+1;v.dia=Number(v.dia||0)+1;v.semana=Number(v.semana||0)+1;
  d[jid][u]=v;db.salvar("atividade",d);
}

async function iniciar(){
  const {state,saveCreds}=await useMultiFileAuthState("auth_info_baileys");

  const sock=makeWASocket({
    auth:state,
    logger,
    cachedGroupMetadata:async jid=>getCache(jid)
  });

  const automsgTimer=setInterval(()=>{
    automsgTick(sock).catch(e=>console.log("⚠️ AutoMsg:",e.message));
  },30000);
  if(typeof automsgTimer.unref==="function")automsgTimer.unref();

  const animadorTimer=setInterval(()=>{
    animador.tick(sock).catch(e=>console.log("⚠️ Animador:",e.message));
  },30000);
  if(typeof animadorTimer.unref==="function")animadorTimer.unref();

  async function getGroupMetadataCached(jid){
    const c=getCache(jid);if(c)return c;
    try{
      const m=await sock.groupMetadata(jid);setCache(jid,m);return m;
    }catch(e){
      if(e?.data===429||e?.output?.statusCode===429)console.log(`⚠️ Rate limit ao consultar grupo ${jid}.`);
      throw e;
    }
  }

  sock.ev.on("creds.update",saveCreds);

  sock.ev.on("groups.update",updates=>{
    for(const u of updates||[])invalidateGroupCache(u.id);
  });

  sock.ev.on("group-participants.update",async update=>{
    invalidateGroupCache(update.id);
    try{
      const jid=update.id;
      const midias=db.ler("midias_grupo",{})[jid]||{};
      if(update.action==="add"&&db.ler("welcome",{})[jid]===true){
        const l=db.ler("legendabv",{})[jid]||WELCOME_PADRAO;
        const img=midias.simples?null:(lerImagem(jid,"bannerbv")||lerImagem(jid,"fotobv"));
        for(const p of update.participants||[]){
          const u=N(p),texto=String(l).replace(/@user/g,`@${num(u)}`);
          if(img)await sock.sendMessage(jid,{image:img,caption:texto,mentions:[u]});
          else await sock.sendMessage(jid,{text:texto,mentions:[u]});
        }
      }
      if(update.action==="remove"&&db.ler("saida",{})[jid]===true){
        const l=db.ler("legendasaiu",{})[jid]||SAIDA_PADRAO;
        const img=midias.simples?null:lerImagem(jid,"fotosaiu");
        for(const p of update.participants||[]){
          const u=N(p),texto=String(l).replace(/@user/g,`@${num(u)}`);
          if(img)await sock.sendMessage(jid,{image:img,caption:texto,mentions:[u]});
          else await sock.sendMessage(jid,{text:texto,mentions:[u]});
        }
      }
    }catch(e){console.log("⚠️ Evento de grupo:",e.message);}
  });

  sock.ev.on("connection.update",async ({connection,lastDisconnect,qr})=>{
    if(qr){
botLogger.info("QR Code gerado para conexão");
console.log("📱 Escaneie o QR Code:");
      qrcode.generate(qr,{small:true});
    }

    if(connection==="open"){
      reconectando=false;
botLogger.info("🕷️ MIRANHA BOT ONLINE");    }

    if(connection==="close"){
      clearInterval(automsgTimer);
      clearInterval(animadorTimer);
      const motivo=lastDisconnect?.error?.output?.statusCode;
      if(motivo===DisconnectReason.loggedOut){
        console.log("Sessão encerrada.");
        return;
      }
      if(!reconectando){
        reconectando=true;
botLogger.warn("Reconectando WhatsApp...");
        setTimeout(()=>iniciar().catch(e=>{reconectando=false;console.log("Erro ao reconectar:",e.message);}),3000);
      }
    }
  });

  sock.ev.on("messages.upsert",async ({messages,type})=>{
    try{
      const msg=messages?.[0];
      if(!msg?.message||msg.key?.remoteJid==="status@broadcast")return;

      const jid=jidChatDaMensagem(msg);
      if(!jid)return;
      const isGroup=jid?.endsWith("@g.us");
      if(isGroup)animador.registrarGrupo(jid);
      const sender=N(msg.key.participantAlt||msg.key.participant||jid);
      const text=textoMensagem(msg);
      const prefix=prefixoAtual();
      const ctxInfo=contexto(msg);
      const mentions=mencoesContexto(msg);
      const reply=quotedParticipant(msg);
      const isOwner =
        msg.key.fromMe === true ||
        isOwnerJid(sender, dono) ||
        N(sender) === N(donoLid) ||
        N(msg.key.participant || "") === N(donoLid) ||
        N(msg.key.participantAlt || "") === N(donoLid);

      if(isGroup){
        const arr=history.get(jid)||[];
        arr.push(msg.key);while(arr.length>100)arr.shift();history.set(jid,arr);
      }

      let metadata=null,isAdmin=false;
      if(isGroup){
        try{
          metadata=await getGroupMetadataCached(jid);
          isAdmin=isAdminByMetadata(metadata,sender);
        }catch(e){
          console.log("⚠️ Falha de metadata:",e.message);
        }
      }

      const exempt=isOwner||isAdmin||isWhitelisted(jid,sender,metadata);

      if(isGroup&&!msg.key.fromMe){
        const mute=(db.ler("mute",{})[jid]||[]).map(N);
        const ids=idsParticipante(metadata,sender);
        if(ids.some(x=>mute.includes(x))){
          try{await sock.sendMessage(jid,{delete:msg.key});}catch{}
          return;
        }

        if(db.ler("antiflood",{})[jid]===true&&!exempt){
          const key=`${jid}|${sender}`,agora=Date.now(),l=(flood.get(key)||[]).filter(t=>agora-t<5000);
          l.push(agora);flood.set(key,l);
          if(l.length>=5){
            await sock.sendMessage(jid,{text:`⚠️ @${num(sender)}, evite muitas mensagens seguidas.`,mentions:[sender]});
            flood.set(key,[]);
            return;
          }
        }

        const t=text.toLowerCase();

        const mbody=conteudo(msg)||{};
        const bloqueios=[
          ["antiaudio",!!mbody.audioMessage],
          ["antifig",!!mbody.stickerMessage],
          ["antiloc",!!(mbody.locationMessage||mbody.liveLocationMessage)],
          ["anticlique",!!(mbody.buttonsResponseMessage||mbody.listResponseMessage||mbody.templateButtonReplyMessage||mbody.interactiveResponseMessage)]
        ];
        const bloqueado=bloqueios.find(([nome,tipo])=>tipo&&db.ler(nome,{})[jid]===true);
        if(bloqueado&&!exempt){
          try{await sock.sendMessage(jid,{delete:msg.key});}catch{}
          return;
        }

        const at=db.ler("antitoxic",{})[jid];
        if(at?.enabled&&!exempt){
          const lista=toxicas(at.sensibilidade);
          const achou=lista.some(p=>new RegExp(`(^|\\s|[^a-zA-ZÀ-ÿ])${String(p).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}($|\\s|[^a-zA-ZÀ-ÿ])`,`i`).test(t));
          if(achou){
            try{await sock.sendMessage(jid,{delete:msg.key});}catch{}
            await sock.sendMessage(jid,{text:`⚠️ @${num(sender)}, mantenha o respeito no grupo.`,mentions:[sender]});
            return;
          }
        }

        if(db.ler("antiinvite",{})[jid]===true&&!exempt&&/chat\.whatsapp\.com\//i.test(text)){
          try{await sock.sendMessage(jid,{delete:msg.key});}catch{}
          await sock.sendMessage(jid,{text:"🚫 Convites de grupos não são permitidos aqui."});
          return;
        }

        if(db.ler("antilink",{})[jid]===true&&!exempt&&/https?:\/\/|www\./i.test(text)){
          try{await sock.sendMessage(jid,{delete:msg.key});}catch{}
          return;
        }

        const ap=db.ler("antipalavra",{})[jid];
        if(ap?.enabled&&!exempt&&(ap.palavras||[]).some(p=>t.includes(String(p).toLowerCase()))){
          try{await sock.sendMessage(jid,{delete:msg.key});}catch{}
          return;
        }

        
registrarAtividade(jid,sender);

// AFK DETECTOR
try {
 const afk = require("./utils/afk");

 const voltou = afk.verificarRetorno(sender);

 if(voltou){
   await sock.sendMessage(jid,{
     text:
     "╭━━━━━━━━━━━━━━━━━━╮\n"+
     "🕷️ MIRANHA BOT\n"+
     "✅ RETORNO AFK\n"+
     "╰━━━━━━━━━━━━━━━━━━╯\n\n"+
     "👋 Bem-vindo de volta!\n\n"+
     "📅 Saiu em:\n"+
     voltou.data+"\n\n"+
     "🕒 Retornou em:\n"+
     new Date().toLocaleString("pt-BR")+"\n\n"+
     "⏳ Tempo ausente:\n"+
     Math.floor(voltou.tempo/60000)+" minuto(s)"
   });
 }

 const encontrado = afk.buscarAFK(text);

 if(encontrado && encontrado.id !== sender){
   await sock.sendMessage(jid,{
     text:
     "╭━━━━━━━━━━━━━━━━━━╮\n"+
     "🕷️ MIRANHA BOT\n"+
     "💤 USUÁRIO AUSENTE\n"+
     "╰━━━━━━━━━━━━━━━━━━╯\n\n"+
     "👤 @"+encontrado.id.split("@")[0]+"\n\n"+
     "📝 Motivo:\n"+
     encontrado.motivo+"\n\n"+
     "📅 Saiu em:\n"+
     encontrado.data,
     mentions:[encontrado.id]
   });
 }
}catch(e){
 console.log("AFK detector:",e.message);
}

      }

      if(isGroup){
        const respondeuEvento=await animador.responderMensagem({
          sock,msg,jid,sender,text,metadata,prefix
        });
        if(respondeuEvento)return;
      }

      if(!text.startsWith(prefix)){
        if(isGroup){
          const au=db.ler("autorespostas",{})[jid];
          if(au?.enabled!==false){
            const mapa=au?.respostas||{};
            const k=Object.keys(mapa).find(x=>x.toLowerCase()===text.trim().toLowerCase());
            if(k)await sock.sendMessage(jid,{text:String(mapa[k])});
          }
        }
        return;
      }

      const partes=text.slice(prefix.length).trim().split(/\s+/);
      const cmd=(partes.shift()||"").toLowerCase();
      const args=partes;
      if(!cmd)return;

      if(!isOwner&&blacklisted(sender))return;
      if(!isOwner&&cmdBloqueadoGlobal(cmd)){await sock.sendMessage(jid,{text:"🚫 Comando bloqueado globalmente."});return;}
      if(isGroup&&!isOwner&&usuarioBloqueado(jid,sender,metadata))return;
      if(isGroup&&!isOwner&&cmdBloqueadoGrupo(jid,cmd)){await sock.sendMessage(jid,{text:"🚫 Comando bloqueado neste grupo."});return;}

      const canAdmin=(c)=>isOwner||isAdmin||modPerm(jid,sender,c,metadata);
      const replyText=async(texto)=>{
        try{
          const sent=await sock.sendMessage(jid,{text:String(texto)});
          return sent;
        }catch(err){
          console.log(`❌ TX → ${jid}:`,err?.message||err);
          throw err;
        }
      };

      const ctx={
        sock,msg,jid,sender,text,prefix,cmd,args,isGroup,isAdmin,isOwner,
        dono,metadata,mentions,reply,context:ctxInfo,logger,history,
        getGroupMetadataCached,invalidateGroupCache,canAdmin,replyText,
        isOwnerJid:(j)=>isOwnerJid(j,dono)
      };

      const handled=await router(ctx);
      if(!handled)await replyText(`⚠️ Comando ${prefix}${cmd} não encontrado. Use ${prefix}menu.`);
    }catch(e){
      console.log("❌ Erro messages.upsert:",e);
    }
  });
}

process.on("uncaughtException",e=>console.log("uncaughtException:",e));
process.on("unhandledRejection",e=>console.log("unhandledRejection:",e));

iniciar().catch(e=>{
  console.error("Erro ao iniciar:",e);
  setTimeout(()=>iniciar().catch(console.error),5000);
});

// ===== SISTEMA AFK COMUNIDADE =====
const fsAFK = require("fs");
const caminhoAFK = "./data/afk.json";

function getAFK(){
 try{return JSON.parse(fsAFK.readFileSync(caminhoAFK))}
 catch(e){return {}}
}

function saveAFK(d){
 fsAFK.writeFileSync(caminhoAFK,JSON.stringify(d,null,2));
}

async function sistemaAFK(m){
 const texto = (m.body || "").trim();
 const id = m.sender;

 if(texto.startsWith("!afk")){
   let motivo = texto.replace("!afk","").trim() || "Ausente no momento";
   let dados=getAFK();

   dados[id]={
    motivo:motivo,
    hora:new Date().toLocaleString("pt-BR")
   };

   saveAFK(dados);

   await m.reply(
`💤 MODO AFK ATIVADO

👤 Usuário: @${id.split("@")[0]}

📌 Motivo:
${motivo}

⏰ Desde:
${dados[id].hora}

⚠️ A comunidade foi avisada.`
   );
   return true;
 }

 let dados=getAFK();

 if(dados[id]){
  let tempo=dados[id];

  delete dados[id];
  saveAFK(dados);

  await m.reply(
`✅ Bem-vindo de volta!

Seu status AFK foi encerrado.

⏱️ Você ficou ausente desde:
${tempo.hora}

A comunidade agradece sua presença novamente! 🚀`
  );
 }
}

module.exports={sistemaAFK};
// ===== FIM AFK =====
