const fs=require("fs");
const path=require("path");
const db=require("../lib/db");
const {N}=require("../lib/utils");

const CFG_PATH=path.join(__dirname,"..","config","assistente.json");
const KEY_PATH=path.join(__dirname,"..","config","openai.key");

const PADRAO={
  model:"gpt-5.6-luna",
  cooldownSeconds:7,
  maxChars:3500,
  memoryMessages:10
};

const cooldown=new Map();

function cfg(){
  try{
    const j=JSON.parse(fs.readFileSync(CFG_PATH,"utf8"));
    return {...PADRAO,...j};
  }catch{
    return {...PADRAO};
  }
}

function chave(){
  const env=String(process.env.OPENAI_API_KEY||"").trim();
  if(env)return env;

  try{
    return String(fs.readFileSync(KEY_PATH,"utf8")||"").trim();
  }catch{
    return "";
  }
}

function dados(){
  const d=db.ler("assistente",{usuarios:{}});
  d.usuarios=d.usuarios||{};
  return d;
}

function salvar(d){
  db.salvar("assistente",d);
}

function idMemoria(ctx){
  return `${ctx.jid}:${N(ctx.sender)}`;
}

function historico(ctx,limite){
  const d=dados();
  const id=idMemoria(ctx);
  const h=Array.isArray(d.usuarios[id])?d.usuarios[id]:[];
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

  d.usuarios[id]=d.usuarios[id]
    .slice(-Math.max(2,Number(limite||10)));

  salvar(d);
}

function limpar(ctx){
  const d=dados();
  delete d.usuarios[idMemoria(ctx)];
  salvar(d);
}

function extrairTexto(j){
  if(typeof j?.output_text==="string"&&j.output_text.trim()){
    return j.output_text.trim();
  }

  const partes=[];

  for(const item of j?.output||[]){
    for(const c of item?.content||[]){
      if(c?.type==="output_text"&&typeof c.text==="string"){
        partes.push(c.text);
      }
      if(c?.type==="text"&&typeof c.text==="string"){
        partes.push(c.text);
      }
    }
  }

  return partes.join("\n").trim();
}

async function chamarIA({prompt,history=[],modo="assistente"}){
  const config=cfg();
  const apiKey=chave();

  if(!apiKey){
    const e=new Error("SEM_CHAVE");
    e.code="SEM_CHAVE";
    throw e;
  }

  const instrucoesBase=
`Você é o Miranha Assistente, um assistente útil integrado a um bot de WhatsApp.
Responda em português do Brasil, a menos que o usuário peça outro idioma.
Seja claro, objetivo e amigável.
Não invente fatos quando não souber.
Não forneça instruções perigosas, ilegais, sexualmente explícitas ou que incentivem dano.
Quando a solicitação for escolar ou explicativa, ensine de forma compreensível.
Evite respostas gigantes; priorize mensagens que funcionem bem no WhatsApp.`;

  const instrucoesModo={
    assistente:"Responda ao pedido normalmente e use o histórico somente quando ele for relevante.",
    explicar:"Explique o assunto de maneira simples, organizada e didática.",
    resumir:"Resuma apenas o texto fornecido, preservando as ideias principais.",
    corrigir:"Corrija ortografia, gramática e clareza sem mudar desnecessariamente o sentido.",
    traduzir:"Traduza fielmente para o idioma pedido. Se o idioma não estiver claro, peça para indicar.",
    ideias:"Gere ideias variadas, úteis e apropriadas ao pedido.",
    definir:"Explique o significado de forma curta e inclua um exemplo simples quando ajudar.",
    calcular:"Resolva a conta com cuidado e dê o resultado de forma clara.",
    reformular:"Reescreva mantendo o sentido, com linguagem mais clara e natural.",
    continuar:"Continue o texto mantendo o estilo e o contexto fornecidos.",
    gerarpergunta:"Crie perguntas adequadas ao assunto solicitado."
  };

  const input=[];

  for(const h of history){
    if(!["user","assistant"].includes(h.role))continue;
    input.push({
      role:h.role,
      content:[{
        type:h.role==="assistant"?"output_text":"input_text",
        text:String(h.content||"")
      }]
    });
  }

  input.push({
    role:"user",
    content:[{type:"input_text",text:prompt}]
  });

  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),45000);

  let r;
  try{
    r=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{
        "Authorization":`Bearer ${apiKey}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        model:config.model,
        instructions:instrucoesBase+"\n"+(instrucoesModo[modo]||instrucoesModo.assistente),
        input,
        max_output_tokens:900
      }),
      signal:controller.signal
    });
  }finally{
    clearTimeout(timer);
  }

  let j={};
  try{j=await r.json();}catch{}

  if(!r.ok){
    const e=new Error(j?.error?.message||`HTTP ${r.status}`);
    e.status=r.status;
    throw e;
  }

  const texto=extrairTexto(j);
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
`🤖 ASSISTENTE

Use:
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
• !limparia`
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
    const usarMemoria=ctx.cmd==="assistente";
    const h=usarMemoria?historico(ctx,config.memoryMessages):[];

    const resposta=await chamarIA({
      prompt,
      history:h,
      modo:ctx.cmd
    });

    if(usarMemoria){
      guardar(ctx,"user",prompt,config.memoryMessages);
      guardar(ctx,"assistant",resposta,config.memoryMessages);
    }

    await ctx.sock.sendMessage(ctx.jid,{
      text:`🤖 *Miranha Assistente*\n\n${resposta}`
    });

  }catch(e){
    console.log("⚠️ Assistente IA:",e.message);

    if(e.code==="SEM_CHAVE"){
      await ctx.replyText(
`⚠️ O Assistente ainda não tem uma chave da API configurada.

No Termux, execute:
bash configurar-assistente.sh`
      );
      return true;
    }

    if(e.status===401){
      await ctx.replyText("⚠️ A chave da API do Assistente não foi aceita. Configure novamente.");
      return true;
    }

    if(e.status===429){
      await ctx.replyText("⏳ O serviço de IA atingiu um limite temporário. Tente novamente depois.");
      return true;
    }

    if(e.name==="AbortError"){
      await ctx.replyText("⏳ A IA demorou demais para responder. Tente novamente.");
      return true;
    }

    await ctx.replyText("⚠️ Não consegui consultar o Assistente agora.");
  }

  return true;
};

