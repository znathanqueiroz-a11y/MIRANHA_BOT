const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const db = require("../lib/db");
const { N, num, mencoesContexto, quotedParticipant } = require("../lib/utils");
const execFileAsync = promisify(execFile);

const ACOES = {
  abraco:{api:"hug",emoji:"🤗",alvo:true,texto:(a,b)=>`${a} abraçou ${b}!`},
  cafune:{api:"pat",emoji:"🫳",alvo:true,texto:(a,b)=>`${a} fez cafuné em ${b}!`},
  highfive:{api:"highfive",emoji:"🙌",alvo:true,texto:(a,b)=>`${a} bateu aqui com ${b}!`},
  acenar:{api:"wave",emoji:"👋",alvo:false,texto:a=>`${a} começou a acenar!`},
  dancar:{api:"dance",emoji:"💃",alvo:false,texto:a=>`${a} começou a dançar!`},
  sorrir:{api:"smile",emoji:"😁",alvo:false,texto:a=>`${a} abriu um sorrisão!`},
  rir:{api:"laugh",emoji:"😂",alvo:false,texto:a=>`${a} caiu na risada!`},
  feliz:{api:"happy",emoji:"🥳",alvo:false,texto:a=>`${a} está muito feliz!`},
  chorar:{api:"cry",emoji:"😢",alvo:false,texto:a=>`${a} ficou emotivo!`},
  joinha:{api:"thumbsup",emoji:"👍",alvo:false,texto:a=>`${a} mandou um joinha!`},
  tapa:{api:"slap",emoji:"🖐️",alvo:true,texto:(a,b)=>`${a} deu um tapa de desenho animado em ${b}!`},
  soco:{api:"punch",emoji:"🥊",alvo:true,texto:(a,b)=>`${a} mandou um soco cartunesco em ${b}!`},
  chute:{api:"kick",emoji:"🦶",alvo:true,texto:(a,b)=>`${a} deu um chute de brincadeira em ${b}!`},
  bonk:{api:"bonk",emoji:"🔨",alvo:true,texto:(a,b)=>`${a} deu um BONK em ${b}!`},
  cutucar:{api:"poke",emoji:"👉",alvo:true,texto:(a,b)=>`${a} cutucou ${b}!`},
  morder:{api:"bite",emoji:"😬",alvo:true,texto:(a,b)=>`${a} deu uma mordidinha de brincadeira em ${b}!`},
  cocegas:{api:"tickle",emoji:"🤣",alvo:true,texto:(a,b)=>`${a} fez cócegas em ${b}!`},
  duelo:{api:"shake",emoji:"⚔️",alvo:true,texto:(a,b)=>`${a} desafiou ${b} para um duelo cartunesco!`},
  nocaute:{api:"bonk",emoji:"💫",alvo:true,texto:(a,b)=>`${a} deu um nocaute de desenho animado em ${b}!`},
  jogar:{api:"yeet",emoji:"💨",alvo:true,texto:(a,b)=>`${a} lançou ${b} longe no modo desenho animado!`},
  assustar:{api:"shocked",emoji:"👻",alvo:true,texto:(a,b)=>`${a} assustou ${b}!`},
  fugir:{api:"run",emoji:"🏃",alvo:false,texto:a=>`${a} fugiu da confusão!`},
  carregar:{api:"carry",emoji:"🏋️",alvo:true,texto:(a,b)=>`${a} carregou ${b}!`},
  apertodemao:{api:"highfive",emoji:"🤝",alvo:true,texto:(a,b)=>`${a} apertou a mão de ${b}!`},
  cumprimentar:{api:"wave",emoji:"👋",alvo:true,texto:(a,b)=>`${a} cumprimentou ${b}!`},
  comemorar:{api:"happy",emoji:"🎉",alvo:false,texto:a=>`${a} começou a comemorar!`},
  provocar:{api:"smug",emoji:"😏",alvo:true,texto:(a,b)=>`${a} provocou ${b}!`},
  vergonha:{api:"blush",emoji:"😳",alvo:false,texto:a=>`${a} ficou com vergonha!`},
  constrangido:{api:"facepalm",emoji:"😬",alvo:false,texto:a=>`${a} ficou constrangido!`},
  animar:{api:"happy",emoji:"🎊",alvo:true,texto:(a,b)=>`${a} tentou animar ${b}!`},
  apoiar:{api:"hug",emoji:"💪",alvo:true,texto:(a,b)=>`${a} deu apoio para ${b}!`},
  consolar:{api:"pat",emoji:"🫂",alvo:true,texto:(a,b)=>`${a} consolou ${b}!`}
};

const WAIFU_FALLBACK = {
  hug:"hug",pat:"pat",highfive:"highfive",wave:"wave",dance:"dance",
  smile:"smile",laugh:"smile",happy:"smile",cry:"cry",thumbsup:"highfive",
  slap:"slap",punch:"slap",kick:"slap",bonk:"bonk",poke:"poke",bite:"bite",
  tickle:"poke",shake:"highfive",yeet:"slap",shocked:"cringe",run:"wave",
  carry:"cuddle",smug:"smug",blush:"blush",facepalm:"cringe"
};

function lerEstado(jid){
  const dados=db.ler("modobn",{});
  return {dados,ativo:dados[jid]===true};
}
function nome(jid){return `@${num(N(jid))}`;}
function alvoDaMensagem(ctx){
  const marcados=mencoesContexto(ctx.msg)||[];
  return marcados[0] || quotedParticipant(ctx.msg) || null;
}

function menu(prefix){
  const linhas=Object.keys(ACOES).map(c=>`${ACOES[c].emoji} ${prefix}${c}${ACOES[c].alvo?" @pessoa":""}`);
  return `╭━━━━━━━━━━━━━━━━━━╮\n┃ 🎉 MODO BRINCADEIRA\n╰━━━━━━━━━━━━━━━━━━╯\n\n${linhas.join("\n")}\n\n🎬 Todos usam GIF.\n🔁 ${prefix}modobn liga/desliga.`;
}

async function jsonFetch(url){
  const r=await fetch(url,{headers:{"User-Agent":"MiranhaBot/1.0","Accept":"application/json"},signal:AbortSignal.timeout(12000)});
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}


const ANIMEGIFS_MAP = {
  hug:"hug",
  pat:"pat",
  highfive:"highfive",
  wave:"wave",
  dance:"dance",
  smile:"happy",
  laugh:"happy",
  happy:"happy",
  cry:"cry",
  thumbsup:"brofist",
  slap:"slap",
  punch:"punch",
  kick:"attack",
  bonk:"bonk",
  poke:"poke",
  bite:"bite",
  tickle:"tickle",
  shake:"highfive",
  yeet:"attack",
  shocked:"scared",
  run:"run",
  carry:"cuddle",
  smug:"smirk",
  blush:"blush",
  facepalm:"facepalm"
};

async function pegarUrl(categoria){
  const cat = ANIMEGIFS_MAP[categoria] || "happy";

  const r = await fetch(
    `https://animegifs-enkidu.koyeb.app/v3/api/?category=${encodeURIComponent(cat)}`,
    {
      headers: {
        "Accept": "application/json"
      },
      signal: AbortSignal.timeout(15000)
    }
  );

  if(!r.ok)
    throw new Error(`AnimeGifs HTTP ${r.status}`);

  const j = await r.json();

  if(!j?.gif)
    throw new Error("AnimeGifs não retornou GIF");

  return j.gif;
}

async function baixar(url){
  const r=await fetch(url,{headers:{"User-Agent":"MiranhaBot/1.0"},signal:AbortSignal.timeout(20000)});
  if(!r.ok) throw new Error(`download ${r.status}`);
  const tipo=String(r.headers.get("content-type")||"").toLowerCase();
  const buffer=Buffer.from(await r.arrayBuffer());
  if(!buffer.length) throw new Error("arquivo vazio");
  if(buffer.length>15*1024*1024) throw new Error("arquivo muito grande");
  return {buffer,tipo};
}

async function paraVideo({buffer,tipo}){
  if(tipo.includes("video/mp4")) return buffer;
  let ext="bin";
  if(tipo.includes("gif")) ext="gif";
  else if(tipo.includes("webp")) ext="webp";
  else if(tipo.includes("png")) ext="png";
  else if(tipo.includes("jpeg")||tipo.includes("jpg")) ext="jpg";

  const base=path.join(os.tmpdir(),`miranha_bn_${Date.now()}_${Math.random().toString(36).slice(2,8)}`);
  const entrada=`${base}.${ext}`;
  const saida=`${base}.mp4`;
  fs.writeFileSync(entrada,buffer);
  try{
    const args=["-y","-loglevel","error"];
    const estatico=["png","jpg","webp"].includes(ext) && !tipo.includes("gif");
    if(estatico) args.push("-loop","1");
    args.push("-i",entrada,"-t","5","-vf","scale=min(640\\,iw):-2:flags=lanczos,fps=24","-an","-c:v","libx264","-preset","veryfast","-crf","28","-pix_fmt","yuv420p","-movflags","+faststart",saida);
    await execFileAsync("ffmpeg",args,{timeout:35000,maxBuffer:5*1024*1024});
    return fs.readFileSync(saida);
  }finally{
    for(const f of [entrada,saida]){try{if(fs.existsSync(f))fs.unlinkSync(f);}catch{}}
  }
}

module.exports=async function bn(ctx){
  const comandos=["modobn","menubn",...Object.keys(ACOES)];
  if(!comandos.includes(ctx.cmd)) return false;
  if(!ctx.isGroup){await ctx.replyText("⚠️ O Modo Brincadeira funciona apenas em grupos.");return true;}

  if(ctx.cmd==="modobn"){
    if(!ctx.isOwner&&!ctx.canAdmin("modobn")){await ctx.replyText("🛡️ Apenas admin ou dono pode alterar o Modo Brincadeira.");return true;}
    const {dados,ativo}=lerEstado(ctx.jid);
    dados[ctx.jid]=!ativo; db.salvar("modobn",dados);
    await ctx.replyText(!ativo?`🎉 Modo Brincadeira ativado!\n\nUse ${ctx.prefix}menubn para ver os comandos.`:"⏸️ Modo Brincadeira desativado!");
    return true;
  }

  const {ativo}=lerEstado(ctx.jid);
  if(!ativo){await ctx.replyText(`🎮 Modo Brincadeira está desativado.\nUm admin pode ativar usando ${ctx.prefix}modobn.`);return true;}
  if(ctx.cmd==="menubn"){await ctx.replyText(menu(ctx.prefix));return true;}

  const acao=ACOES[ctx.cmd];
  const alvo=alvoDaMensagem(ctx);
  if(acao.alvo&&!alvo){await ctx.replyText(`${acao.emoji} Marque uma pessoa ou responda a mensagem dela.\nExemplo: ${ctx.prefix}${ctx.cmd} @pessoa`);return true;}

  const autorTxt=nome(ctx.sender);
  const alvoTxt=alvo?nome(alvo):null;
  const legenda=`${acao.emoji} ${acao.texto(autorTxt,alvoTxt)}`;
  const mentions=[...new Set([ctx.sender,alvo].filter(Boolean).map(N))];

  try{
    const url=await pegarUrl(acao.api);
    const midia=await baixar(url);
    const video=await paraVideo(midia);
    await ctx.sock.sendMessage(ctx.jid,{video,gifPlayback:true,caption:legenda,mentions},{quoted:ctx.msg});
  }catch(e){
    console.log(`⚠️ BN ${ctx.cmd}:`,e?.message||e);
    await ctx.sock.sendMessage(ctx.jid,{text:`${legenda}\n\n⚠️ O GIF não carregou desta vez.`,mentions},{quoted:ctx.msg});
  }
  return true;
};

