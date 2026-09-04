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

let dono="";
try{dono=require("./config/config").dono||"";}catch{dono=process.env.BOT_DONO||"";}

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
      console.log("📱 Escaneie o QR Code:");
      qrcode.generate(qr,{small:true});
    }

    if(connection==="open"){
      reconectando=false;
      console.log("🕷️ MIRANHA BOT ONLINE");
    }

    if(connection==="close"){
      clearInterval(automsgTimer);
      const motivo=lastDisconnect?.error?.output?.statusCode;
      if(motivo===DisconnectReason.loggedOut){
        console.log("Sessão encerrada.");
        return;
      }
      if(!reconectando){
        reconectando=true;
        console.log("Reconectando...");
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
      const sender=N(msg.key.participantAlt||msg.key.participant||jid);
      const text=textoMensagem(msg);
      const prefix=prefixoAtual();
      const ctxInfo=contexto(msg);
      const mentions=mencoesContexto(msg);
      const reply=quotedParticipant(msg);
      const isOwner=msg.key.fromMe===true || isOwnerJid(sender,dono);

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
      console.log(`📩 ${prefix}${cmd} ← ${jid}`);
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
          console.log(`📤 OK → ${jid}`);
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
