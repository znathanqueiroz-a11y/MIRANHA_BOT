const fs=require("fs");
const path=require("path");
const os=require("os");
const {spawn}=require("child_process");
const db=require("../lib/db");
const {N}=require("../lib/utils");

const ROOT=path.join(__dirname,"..");
const SERVER=path.join(ROOT,"local-ai","llama.cpp","build","bin","llama-server");
const MODEL=path.join(ROOT,"local-ai","models","qwen3-0.6b-q4_k_m.gguf");
const BASE="http://127.0.0.1:8088";

const CFG_PATH=path.join(ROOT,"config","assistente-local.json");

const PADRAO={
  cooldownSeconds:7,
  maxChars:3500,
  memoryMessages:10,
  contextSize:2048,
  maxTokens:600
};

let processoLocal=null;
let iniciando=null;
const cooldown=new Map();

function cfg(){
  try{
    return {...PADRAO,...JSON.parse(fs.readFileSync(CFG_PATH,"utf8"))};
  }catch{
    return {...PADRAO};
  }
}

function dados(){
  const d=db.ler("assistente",{usuarios:{}});
  d.usuarios=d.usuarios||{};
  return d;
}
function salvar(d){db.salvar("assistente",d);}
function idMemoria(ctx){return `${ctx.jid}:${N(ctx.sender)}`;}

function historico(ctx,limite){
  const d=dados();
  const h=Array.isArray(d.usuarios[idMemoria(ctx)])?d.usuarios[idMemoria(ctx)]:[];
  return h.slice(-Math.max(2,Number(limite||10)));
}
function guardar(ctx,role,content,limite){
  const d=dados();
  const id=idMemoria(ctx);
  if(!Array.isArray(d.usuarios[id]))d.usuarios[id]=[];
  d.usuarios[id].push({
    role,
    content:String(content||"").slice(0,5000),
    at:Date.now()
  });
  d.usuarios[id]=d.usuarios[id].slice(-Math.max(2,Number(limite||10)));
  salvar(d);
}
function limpar(ctx){
  const d=dados();
  delete d.usuarios[idMemoria(ctx)];
  salvar(d);
}

async function dorme(ms){
  return new Promise(r=>setTimeout(r,ms));
}

async function servidorOk(){
  try{
    const c=new AbortController();
    const t=setTimeout(()=>c.abort(),1200);
    const r=await fetch(`${BASE}/health`,{signal:c.signal});
    clearTimeout(t);
    return r.ok;
  }catch{
    return false;
  }
}

async function garantirServidorLocal(){
  if(await servidorOk())return true;
  if(iniciando)return iniciando;

  iniciando=(async()=>{
    if(!fs.existsSync(SERVER)){
      const e=new Error("LLAMA_NAO_INSTALADO");
      e.code="LLAMA_NAO_INSTALADO";
      throw e;
    }
    if(!fs.existsSync(MODEL)){
      const e=new Error("MODELO_NAO_INSTALADO");
      e.code="MODELO_NAO_INSTALADO";
      throw e;
    }

    const config=cfg();
    const threads=Math.max(2,Math.min(4,(os.cpus()||[]).length||2));

    processoLocal=spawn(
      SERVER,
      [
        "-m",MODEL,
        "--host","127.0.0.1",
        "--port","8088",
        "-c",String(config.contextSize||2048),
        "-t",String(threads)
      ],
      {
        cwd:path.dirname(SERVER),
        stdio:["ignore","ignore","pipe"]
      }
    );

    processoLocal.stderr.on("data",b=>{
      const t=String(b||"").trim();
      if(/error|failed|fatal/i.test(t))console.log("⚠️ IA local:",t.slice(0,600));
    });

    processoLocal.on("exit",code=>{
      if(code&&code!==0)console.log("⚠️ Servidor IA local encerrou com código",code);
      processoLocal=null;
    });

    for(let i=0;i<90;i++){
      if(await servidorOk())return true;
      await dorme(500);
    }

    const e=new Error("SERVIDOR_NAO_INICIOU");
    e.code="SERVIDOR_NAO_INICIOU";
    throw e;
  })();

  try{
    return await iniciando;
  }finally{
    iniciando=null;
  }
}

function limparResposta(t){
  let s=String(t||"").trim();
  s=s.replace(/<think>[\s\S]*?<\/think>/gi,"").trim();
  s=s.replace(/^assistant\s*[:：]\s*/i,"").trim();
  return s;
}

async function chamarLocal({prompt,history=[],modo="assistente"}){
  await garantirServidorLocal();
  const config=cfg();

  const sistema=
`Você é o Miranha Assistente, um assistente útil dentro de um bot de WhatsApp.
Responda em português do Brasil, salvo se pedirem outro idioma.
Seja claro, curto e amigável.
Não mostre raciocínio interno.
Se não souber, diga que não sabe.
Não dê instruções perigosas, ilegais, sexualmente explícitas ou que incentivem dano.
Não ajude a burlar restrições de idade ou segurança.
Para assuntos escolares, explique de forma didática.`;

  const instrucoes={
    assistente:"Responda normalmente e use o histórico quando for relevante.",
    explicar:"Explique de forma simples, organizada e didática.",
    resumir:"Resuma o texto preservando as ideias principais.",
    corrigir:"Corrija ortografia, gramática e clareza sem mudar o sentido.",
    traduzir:"Traduza fielmente para o idioma pedido.",
    ideias:"Gere ideias variadas e apropriadas.",
    definir:"Defina de forma curta e clara e dê exemplo se ajudar.",
    calcular:"Resolva a conta cuidadosamente e dê o resultado.",
    reformular:"Reescreva mantendo o sentido.",
    continuar:"Continue o texto mantendo estilo e contexto.",
    gerarpergunta:"Crie perguntas adequadas ao assunto."
  };

  const messages=[
    {role:"system",content:sistema+"\n"+(instrucoes[modo]||instrucoes.assistente)}
  ];

  for(const h of history){
    if(["user","assistant"].includes(h.role)){
      messages.push({role:h.role,content:String(h.content||"")});
    }
  }

  messages.push({role:"user",content:prompt});

  const c=new AbortController();
  const timer=setTimeout(()=>c.abort(),60000);

  let r;
  try{
    r=await fetch(`${BASE}/v1/chat/completions`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"qwen3-0.6b",
        messages,
        temperature:0.7,
        max_tokens:Number(config.maxTokens||600),
        stream:false
      }),
      signal:c.signal
    });
  }finally{
    clearTimeout(timer);
  }

  let j={};
  try{j=await r.json();}catch{}

  if(!r.ok){
    throw new Error(j?.error?.message||`LOCAL_HTTP_${r.status}`);
  }

  const texto=limparResposta(j?.choices?.[0]?.message?.content||"");
  if(!texto)throw new Error("RESPOSTA_VAZIA");

  return texto.slice(0,Number(config.maxChars||3500));
}

function uso(cmd){
  const exemplos={
    assistente:"!assistente me explica o que é um buraco negro",
    explicar:"!explicar fotossíntese",
    resumir:"!resumir <texto>",
    corrigir:"!corrigir <texto>",
    traduzir:"!traduzir inglês <texto>",
    ideias:"!ideias nomes para um grupo",
    definir:"!definir biodiversidade",
    calcular:"!calcular 1250 * 18",
    reformular:"!reformular <texto>",
    continuar:"!continuar <texto>",
    gerarpergunta:"!gerarpergunta sistema solar"
  };
  return exemplos[cmd]||"!assistente <pergunta>";
}

module.exports=async function assistente(ctx){
  const comandos=[
    "assistente","explicar","resumir","corrigir","traduzir",
    "ideias","definir","calcular","reformular","continuar",
    "gerarpergunta","limparia"
  ];

  if(!comandos.includes(ctx.cmd))return false;

  const config=cfg();

  if(ctx.cmd==="limparia"){
    limpar(ctx);
    await ctx.replyText("🧹 Memória do Assistente apagada para você.");
    return true;
  }

  const prompt=(ctx.args||[]).join(" ").trim();

  if(!prompt){
    await ctx.replyText(
`🤖 ASSISTENTE LOCAL

${uso(ctx.cmd)}

Comandos:
• !assistente
• !explicar
• !resumir
• !corrigir
• !traduzir
• !ideias
• !definir
• !calcular
• !reformular
• !continuar
• !gerarpergunta
• !limparia

🧠 IA executada no próprio celular.`
    );
    return true;
  }

  const id=idMemoria(ctx);
  const agora=Date.now();
  const ultimo=Number(cooldown.get(id)||0);
  const espera=Number(config.cooldownSeconds||7)*1000;

  if(agora-ultimo<espera){
    const falta=Math.max(1,Math.ceil((espera-(agora-ultimo))/1000));
    await ctx.replyText(`⏳ Aguarde ${falta}s para usar o Assistente novamente.`);
    return true;
  }

  cooldown.set(id,agora);

  try{
    const usaMemoria=ctx.cmd==="assistente";
    const resposta=await chamarLocal({
      prompt,
      history:usaMemoria?historico(ctx,config.memoryMessages):[],
      modo:ctx.cmd
    });

    if(usaMemoria){
      guardar(ctx,"user",prompt,config.memoryMessages);
      guardar(ctx,"assistant",resposta,config.memoryMessages);
    }

    await ctx.sock.sendMessage(ctx.jid,{
      text:`🤖 *Miranha Assistente*\n\n${resposta}`
    });

  }catch(e){
    console.log("⚠️ Assistente local:",e.message);

    if(e.code==="LLAMA_NAO_INSTALADO"||e.code==="MODELO_NAO_INSTALADO"){
      await ctx.replyText("⚠️ A IA local ainda não foi instalada completamente.");
      return true;
    }

    if(e.name==="AbortError"||e.code==="SERVIDOR_NAO_INICIOU"){
      await ctx.replyText("⚠️ A IA local não conseguiu iniciar neste momento.");
      return true;
    }

    await ctx.replyText("⚠️ Não consegui gerar a resposta com a IA local agora.");
  }

  return true;
};

