const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const db = require("../lib/db");
const { N, num, mencoesContexto } = require("../lib/utils");
const execFileAsync = promisify(execFile);

const ACOES = {
  abraco:{emoji:"🤗",alvo:true,texto:(a,b)=>`${a} abraçou ${b}!`,media:{tipo:"gifukai",acao:"hug"}},
  cafune:{emoji:"🫳",alvo:true,texto:(a,b)=>`${a} fez cafuné em ${b}!`,media:{tipo:"gifukai",acao:"pat"}},
  highfive:{emoji:"🙌",alvo:true,texto:(a,b)=>`${a} bateu aqui com ${b}!`,media:{tipo:"tenor",pagina:"https://tenor.com/view/high-five-gif-13710649"}},
  acenar:{emoji:"👋",alvo:false,texto:a=>`${a} começou a acenar!`,media:{tipo:"tenor",pagina:"https://tenor.com/view/wave-stickman-hello-good-morning-gif-20285948"}},
  dancar:{emoji:"💃",alvo:false,texto:a=>`${a} começou a dançar!`,media:{tipo:"tenor",pagina:"https://tenor.com/view/stickman-dance-gif-19711627"}},
  sorrir:{emoji:"😁",alvo:false,texto:a=>`${a} abriu um sorrisão!`,media:{tipo:"waifu",acao:"smile"}},
  rir:{emoji:"😂",alvo:false,texto:a=>`${a} caiu na risada!`,media:{tipo:"waifu",acao:"happy"}},
  feliz:{emoji:"🥳",alvo:false,texto:a=>`${a} está muito feliz!`,media:{tipo:"waifu",acao:"happy"}},
  chorar:{emoji:"😢",alvo:false,texto:a=>`${a} ficou emotivo!`,media:{tipo:"gifukai",acao:"cry"}},
  joinha:{emoji:"👍",alvo:false,texto:a=>`${a} mandou um joinha!`,media:{tipo:"tenor",pagina:"https://tenor.com/pt-BR/view/anime-thumbs-up-nice-gif-15057433"}},

  tapa:{emoji:"🖐️",alvo:true,texto:(a,b)=>`${a} deu um tapa de desenho animado em ${b}!`,media:{tipo:"tenor",pagina:"https://tenor.com/view/stickman-fight-slap-gif-16914463"}},
  soco:{emoji:"🥊",alvo:true,texto:(a,b)=>`${a} mandou um soco cartunesco em ${b}!`,media:{tipo:"tenor",pagina:"https://tenor.com/view/stickman-punch-gif-21692325"}},
  chute:{emoji:"🦶",alvo:true,texto:(a,b)=>`${a} deu um chute de brincadeira em ${b}!`,media:{tipo:"tenor",pagina:"https://tenor.com/view/stickman-kick-punch-fighting-gif-17723679"}},
  bonk:{emoji:"🔨",alvo:true,texto:(a,b)=>`${a} deu um BONK em ${b}!`,media:{tipo:"waifu",acao:"bonk"}},
  cutucar:{emoji:"👉",alvo:true,texto:(a,b)=>`${a} cutucou ${b}!`,media:{tipo:"waifu",acao:"poke"}},
  morder:{emoji:"😬",alvo:true,texto:(a,b)=>`${a} deu uma mordidinha de brincadeira em ${b}!`,media:{tipo:"waifu",acao:"bite"}},
  cocegas:{emoji:"🤣",alvo:true,texto:(a,b)=>`${a} fez cócegas em ${b}!`,media:{tipo:"tenor",pagina:"https://tenor.com/view/anime-tickle-funny-gif-14132818"}},
  duelo:{emoji:"⚔️",alvo:true,texto:(a,b)=>`${a} desafiou ${b} para um duelo cartunesco!`,media:{tipo:"tenor",pagina:"https://tenor.com/view/stick-man-fight-animation-gif-10797870"}},
  nocaute:{emoji:"💫",alvo:true,texto:(a,b)=>`${a} venceu ${b} no duelo de desenho animado!`,media:{tipo:"tenor",pagina:"https://tenor.com/view/stick-fight-fight-kick-knockout-stickman-gif-10154315462450668965"}},
  jogar:{emoji:"💨",alvo:true,texto:(a,b)=>`${a} lançou ${b} longe no modo desenho animado!`,media:{tipo:"tenor",pagina:"https://tenor.com/view/stickman-kick-punch-fighting-gif-17723679"}},
  assustar:{emoji:"👻",alvo:true,texto:(a,b)=>`${a} assustou ${b}!`,media:{tipo:"waifu",acao:"cringe"}},
  fugir:{emoji:"🏃",alvo:false,texto:a=>`${a} fugiu da confusão!`,media:{tipo:"tenor",pagina:"https://tenor.com/view/running-stickman-animation-gif-17748875"}},

  carregar:{emoji:"🏋️",alvo:true,texto:(a,b)=>`${a} carregou ${b}!`,media:{tipo:"tenor",pagina:"https://tenor.com/view/anime-carry-me-pick-up-gif-22029460"}},
  apertodemao:{emoji:"🤝",alvo:true,texto:(a,b)=>`${a} apertou a mão de ${b}!`,media:{tipo:"tenor",pagina:"https://tenor.com/view/handshake-gif-20334450"}},
  cumprimentar:{emoji:"👋",alvo:true,texto:(a,b)=>`${a} cumprimentou ${b}!`,media:{tipo:"tenor",pagina:"https://tenor.com/view/hello-hi-waving-wave-stick-man-gif-17693831"}},
  comemorar:{emoji:"🎉",alvo:false,texto:a=>`${a} começou a comemorar!`,media:{tipo:"waifu",acao:"happy"}},
  provocar:{emoji:"😏",alvo:true,texto:(a,b)=>`${a} provocou ${b}!`,media:{tipo:"waifu",acao:"smug"}},
  vergonha:{emoji:"😳",alvo:false,texto:a=>`${a} ficou com vergonha!`,media:{tipo:"waifu",acao:"blush"}},
  constrangido:{emoji:"😬",alvo:false,texto:a=>`${a} ficou constrangido!`,media:{tipo:"waifu",acao:"cringe"}},
  animar:{emoji:"🎊",alvo:true,texto:(a,b)=>`${a} tentou animar ${b}!`,media:{tipo:"waifu",acao:"happy"}},
  apoiar:{emoji:"💪",alvo:true,texto:(a,b)=>`${a} deu apoio para ${b}!`,media:{tipo:"gifukai",acao:"hug"}},
  consolar:{emoji:"🫂",alvo:true,texto:(a,b)=>`${a} consolou ${b}!`,media:{tipo:"gifukai",acao:"pat"}}
};

function lerEstado(jid){
  const dados=db.ler("modobn",{});
  return {dados,ativo:dados[jid]===true};
}
function nome(jid){return `@${num(N(jid))}`;}
function alvosDaMensagem(ctx){
  return [...new Set(
    (mencoesContexto(ctx.msg) || [])
      .filter(Boolean)
      .map(N)
  )];
}
function menu(prefix){
  const linhas=Object.keys(ACOES).map(c=>`${ACOES[c].emoji} ${prefix}${c}${ACOES[c].alvo?" @pessoa":""}`);
  return `╭━━━━━━━━━━━━━━━━━━╮\n┃ 🎉 MODO BRINCADEIRA\n╰━━━━━━━━━━━━━━━━━━╯\n\n${linhas.join("\n")}\n\n🎬 GIFs escolhidos conforme a ação.\n🔁 ${prefix}modobn liga/desliga.`;
}

async function jsonFetch(url){
  const r=await fetch(url,{
    headers:{"User-Agent":"Mozilla/5.0 MiranhaBot/1.0","Accept":"application/json,text/html,*/*"},
    signal:AbortSignal.timeout(15000)
  });
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return r;
}

async function tenorPaginaParaGif(pagina){
  const r=await jsonFetch(pagina);
  const html=await r.text();
  const padroes=[
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /"contentUrl"\s*:\s*"([^"]+)"/i
  ];
  for(const re of padroes){
    const m=html.match(re);
    if(m?.[1]) return m[1].replace(/\\u0026/g,"&").replace(/\\\//g,"/");
  }
  throw new Error("Tenor sem URL de mídia");
}

async function pegarUrl(media){
  if(media.tipo==="tenor") return tenorPaginaParaGif(media.pagina);

  if(media.tipo==="gifukai"){
    const r=await jsonFetch(`https://api.gifukai.com/v1/${encodeURIComponent(media.acao)}`);
    const j=await r.json();
    if(!j?.url) throw new Error("Gifukai sem URL");
    return j.url;
  }

  if(media.tipo==="waifu"){
    const r=await jsonFetch(`https://api.waifu.pics/sfw/${encodeURIComponent(media.acao)}`);
    const j=await r.json();
    if(!j?.url) throw new Error("Waifu sem URL");
    return j.url;
  }

  throw new Error("Fonte de GIF desconhecida");
}

async function baixar(url){
  const r=await fetch(url,{
    headers:{"User-Agent":"Mozilla/5.0 MiranhaBot/1.0","Accept":"image/*,video/*,*/*"},
    signal:AbortSignal.timeout(25000)
  });
  if(!r.ok) throw new Error(`download HTTP ${r.status}`);
  const tipo=String(r.headers.get("content-type")||"").toLowerCase();
  const buffer=Buffer.from(await r.arrayBuffer());
  if(!buffer.length) throw new Error("arquivo vazio");
  if(buffer.length>16*1024*1024) throw new Error("arquivo muito grande");
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
    const estatico=["png","jpg","webp"].includes(ext)&&!tipo.includes("gif");
    if(estatico) args.push("-loop","1");
    args.push("-i",entrada,"-t","6","-vf","scale=min(640\\,iw):-2:flags=lanczos,fps=24","-an","-c:v","libx264","-preset","veryfast","-crf","28","-pix_fmt","yuv420p","-movflags","+faststart",saida);
    await execFileAsync("ffmpeg",args,{timeout:40000,maxBuffer:6*1024*1024});
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
  const alvos=alvosDaMensagem(ctx);
  const alvo=alvos[0] || null;
  if(acao.alvo && !alvos.length){
    await ctx.replyText(
`╭──〔 🎭 MODO BN 〕──╮
┃ ${acao.emoji} Marque alguém para usar.
╰──────────────────╯

📌 Exemplo:
${ctx.prefix}${ctx.cmd} @pessoa`
    );
    return true;
  }

  const autorTxt = nome(ctx.sender);

  const alvoTxt = alvos.length
    ? alvos.map(nome).join(" e ")
    : null;

  const legenda =
    `${acao.emoji} ${acao.texto(autorTxt, alvoTxt)}`;

  // Marca quem enviou + quem foi mencionado.
  const mentions = [
    ...new Set(
      [ctx.sender, ...alvos]
        .filter(Boolean)
        .map(N)
    )
  ];

  try{
    const url=await pegarUrl(acao.media);
    const midia=await baixar(url);
    const video=await paraVideo(midia);
    await ctx.sock.sendMessage(ctx.jid,{video,gifPlayback:true,caption:legenda,mentions});
  }catch(e){
    console.log(`⚠️ BN ${ctx.cmd}:`,e?.message||e);
    await ctx.sock.sendMessage(ctx.jid,{text:`${legenda}\n\n⚠️ O GIF correspondente não carregou desta vez.`,mentions},{quoted:ctx.msg});
  }
  return true;
};
