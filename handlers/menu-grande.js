const comandos=require("../comandos");

const titulos={
  administracao:"🛡️ ADMINISTRAÇÃO",
  metas:"🎯 METAS",
  controle:"🔒 CONTROLE",
  grupo:"👥 GRUPO",
  moderadores:"👑 MODERADORES",
  whitelist:"✅ WHITELIST",
  parcerias:"🤝 PARCERIAS",
  seguranca:"🛡️ SEGURANÇA",
  configuracoes:"⚙️ CONFIGURAÇÕES",
  auto_respostas:"💬 AUTO-RESPOSTAS",
  modos:"⚡ MODOS",
  npc:"🤖 NPC",
  saudacoes:"☀️ SAUDAÇÕES EM GRUPO",
  assistente:"🤖 ASSISTENTE",
  social:"❤️ SOCIAL",
  sticker:"🖼️ FIGURINHAS",
  arena:"🎮 JOGOS / ARENA",
  economia:"💰 ECONOMIA",
  brincadeiras:"🎉 BRINCADEIRAS",
  bn:"🎉 BRINCADEIRAS",
  modobn:"🎉 BRINCADEIRAS",
  core:"⚙️ SISTEMA"
};

const macros={
  menuadm:{
    titulo:"👑 ADMINISTRAÇÃO",
    cats:["administracao","metas","controle","moderadores","whitelist","parcerias","seguranca"]
  },
  menugrupo:{
    titulo:"👥 GRUPO",
    cats:["grupo","auto_respostas","modos","saudacoes"]
  },
  menuassistente:{
    titulo:"🤖 ASSISTENTE",
    cats:["assistente"]
  },
  menueconomia:{
    titulo:"💰 ECONOMIA",
    cats:["economia"]
  },
  menuarena:{
    titulo:"🎮 JOGOS",
    cats:["arena"]
  },
  menubn:{
    titulo:"🎉 BRINCADEIRAS",
    cats:["brincadeiras","bn","modobn"]
  },
  menusocial:{
    titulo:"❤️ SOCIAL",
    cats:["social"]
  },
  menunpc:{
    titulo:"🤖 NPC",
    cats:["npc"]
  },
  menusticker:{
    titulo:"🖼️ FIGURINHAS",
    cats:["sticker"]
  },
  menuconfig:{
    titulo:"⚙️ CONFIGURAÇÕES",
    cats:["configuracoes"]
  },
  menusistema:{
    titulo:"⚙️ SISTEMA",
    cats:["core"]
  }
};

function listaCat(cat,prefix){
  const lista=Array.isArray(comandos[cat])?comandos[cat]:[];
  if(!lista.length)return "";

  if(cat==="saudacoes"){
    return `─❖ ☀️ SAUDAÇÕES EM GRUPO
│ 🌅 ${prefix}dia
│ 🌤️ ${prefix}tarde
│ 🌙 ${prefix}noite
│ 🌑 ${prefix}madrugada
╰────────────────────\n`;
  }

  let out=`─❖ ${titulos[cat]||cat.toUpperCase()}\n`;
  for(const cmd of lista)out+=`│ • ${prefix}${cmd}\n`;
  out+="╰────────────────────\n";
  return out;
}

function categoriasUsadas(){
  const s=new Set();
  for(const m of Object.values(macros)){
    for(const c of m.cats)s.add(c);
  }
  return s;
}

function menuPrincipal(prefix){
  const extras=Object.keys(comandos).filter(c=>!categoriasUsadas().has(c));

  let out=
`╭━━━━━━━━━━━━━━━━━━╮
┃ 🕷️ MIRANHA BOT
┃ 👥 MENU PRINCIPAL
╰━━━━━━━━━━━━━━━━━━╯

👑 Administração
${prefix}menuadm

👥 Grupo
${prefix}menugrupo

🤖 Assistente
${prefix}menuassistente

💰 Economia
${prefix}menueconomia

🎮 Jogos
${prefix}menuarena

🎉 Brincadeiras
${prefix}menubn

❤️ Social
${prefix}menusocial

🤖 NPC
${prefix}menunpc

🖼️ Figurinhas
${prefix}menusticker

⚙️ Configurações
${prefix}menuconfig

📊 Rankings
${prefix}menurank

⚙️ Sistema
${prefix}menusistema`;

  if(extras.length){
    out+=`\n\n📚 Outras categorias\n${prefix}menutodos`;
  }

  out+=`

━━━━━━━━━━━━━━━━━━
📚 Todos os comandos: ${prefix}menutodos
💡 Exemplo: ${prefix}menueconomia`;

  return out;
}

function submenu(chave,prefix){
  if(chave==="menurank"){
    const desejados=[
      "rank","rankxp","atividade","checkativo",
      "limparrank","limparrankdinheiro"
    ];
    const existentes=new Set(Object.values(comandos).flat());
    const lista=desejados.filter(x=>existentes.has(x));

    let out=
`╭━━━━━━━━━━━━━━━━━━╮
┃ 📊 RANKINGS
╰━━━━━━━━━━━━━━━━━━╯

`;
    for(const cmd of lista)out+=`│ 🏆 ${prefix}${cmd}\n`;
    out+=`\n↩️ Voltar: ${prefix}menu`;
    return out;
  }

  const m=macros[chave];
  if(!m)return null;

  let out=
`╭━━━━━━━━━━━━━━━━━━╮
┃ ${m.titulo}
╰━━━━━━━━━━━━━━━━━━╯

`;

  let achou=false;
  for(const cat of m.cats){
    if(Array.isArray(comandos[cat])&&comandos[cat].length){
      out+=listaCat(cat,prefix)+"\n";
      achou=true;
    }
  }

  if(!achou){
    out+="Nenhum comando desta categoria foi encontrado.\n";
  }

  out+=`↩️ Voltar: ${prefix}menu`;
  return out;
}

function menuTodos(prefix){
  let out=
`╭━━━━━━━━━━━━━━━━━━╮
┃ 📚 TODOS OS COMANDOS
╰━━━━━━━━━━━━━━━━━━╯

`;

  for(const cat of Object.keys(comandos)){
    out+=listaCat(cat,prefix)+"\n";
  }

  out+=`↩️ Voltar: ${prefix}menu`;
  return out;
}

module.exports=async function menuGrande(ctx){
  const cmd=ctx.cmd;
  const prefix=ctx.prefix||"!";

  const aceitos=new Set([
    "menu","menutodos","menurank",
    ...Object.keys(macros)
  ]);

  if(!aceitos.has(cmd))return false;

  if(cmd==="menu"){
    await ctx.replyText(menuPrincipal(prefix));
    return true;
  }

  if(cmd==="menutodos"){
    await ctx.replyText(menuTodos(prefix));
    return true;
  }

  const texto=submenu(cmd,prefix);
  if(texto){
    await ctx.replyText(texto);
    return true;
  }

  return false;
};

