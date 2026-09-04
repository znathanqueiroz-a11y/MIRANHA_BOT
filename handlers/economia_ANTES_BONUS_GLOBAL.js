const db=require("../lib/db");
const loja=require("../data/loja");
const {N,num,dinheiro,restante,idsParticipante}=require("../lib/utils");
const {bonus:bonusLoja,calcularBonus,aplicarBonus}=require("../data/bonus-loja");

function novo(){return {saldo:0,xp:0,level:1,ultimoDiario:0,ultimoTrabalho:0,inventario:{},cooldowns:{}};}
function nivel(xp){return Math.floor(Math.sqrt(Number(xp||0)/100))+1;}
function get(grupo,usuario,metadata){
  const d=db.ler("economia",{}),normal=N(usuario);
  if(!d[grupo])d[grupo]={};
  const aliases=[...new Set(idsParticipante(metadata,normal).concat([normal]).filter(Boolean))];
  const existentes=aliases.filter(id=>d[grupo][id]);
  let u;
  if(existentes.length){
    u=existentes.sort((a,b)=>{
      const A=d[grupo][a]||{},B=d[grupo][b]||{};
      return (Number(B.saldo||0)+Number(B.xp||0))-(Number(A.saldo||0)+Number(A.xp||0));
    })[0];
  }else{
    u=aliases[0]||normal;
    d[grupo][u]=novo();
  }
  for(const id of aliases){
    if(id!==u&&d[grupo][id]){
      const src=d[grupo][id],dst=d[grupo][u];
      dst.saldo=Math.max(Number(dst.saldo||0),Number(src.saldo||0));
      dst.xp=Math.max(Number(dst.xp||0),Number(src.xp||0));
      dst.inventario=dst.inventario||{};
      for(const [k,q] of Object.entries(src.inventario||{}))dst.inventario[k]=Math.max(Number(dst.inventario[k]||0),Number(q||0));
      delete d[grupo][id];
    }
  }
  const p=d[grupo][u];p.inventario=p.inventario||{};p.cooldowns=p.cooldowns||{};p.level=nivel(p.xp||0);
  return {d,u,p};
}
function save(x){db.salvar("economia",x.d);}
function reward(min,max){return min+Math.floor(Math.random()*(max-min+1));}
function ganho(ctx,key,cool,min,max,xpMin=15,xpMax=40,texto="Trabalho concluído"){
  const x=get(ctx.jid,ctx.sender,ctx.metadata),agora=Date.now(),ultimo=Number(x.p.cooldowns[key]||0);
  if(agora-ultimo<cool)return ctx.replyText(`⏳ Aguarde ${restante(cool-(agora-ultimo))}.`).then(()=>true);
  const base=reward(min,max),xp=reward(xpMin,xpMax),old=x.p.level||1;
  const calc=aplicarBonus(base,x.p),m=calc.final;
  x.p.saldo=Number(x.p.saldo||0)+m;x.p.xp=Number(x.p.xp||0)+xp;x.p.level=nivel(x.p.xp);x.p.cooldowns[key]=agora;save(x);
  const extra=calc.bonusValor>0?`\n⚡ Bônus dos itens: +${dinheiro(calc.bonusValor)} (${calc.total}%)`:"";
  return ctx.replyText(`${texto}\n\n🪙 +${dinheiro(m)} moedas${extra}\n✨ +${xp} XP${x.p.level>old?`\n🎉 Você subiu para o level ${x.p.level}!`:""}`).then(()=>true);
}

const trabalhos={
trabalhar:[60*60e3,150,500,20,50,"💼 Trabalho concluído!"],
pescar:[30*60e3,100,450,15,35,"🎣 Você voltou da pescaria!"],
minerar:[45*60e3,180,600,20,45,"⛏️ Mineração concluída!"],
missao:[2*60*60e3,400,1200,35,70,"🎯 Missão concluída!"],
coletar:[20*60e3,80,300,10,30,"🧺 Coleta concluída!"],
tesouro:[90*60e3,300,1000,30,60,"🗺️ Você encontrou um tesouro!"],
entregar:[25*60e3,100,350,10,30,"📦 Entrega concluída!"],
cozinhar:[35*60e3,120,450,15,35,"🍳 Pedido preparado!"],
fotografar:[40*60e3,150,500,15,40,"📸 Sessão concluída!"],
programar:[60*60e3,250,800,25,55,"💻 Projeto entregue!"],
reciclar:[15*60e3,60,220,10,25,"♻️ Reciclagem concluída!"],
fazenda:[40*60e3,150,500,15,40,"🌾 Colheita concluída!"],
explorar:[50*60e3,180,650,20,45,"🧭 Exploração concluída!"],
premio:[6*60*60e3,700,1800,40,80,"🏆 Prêmio resgatado!"],
caixamisteriosa:[3*60*60e3,350,1400,30,70,"🎁 Caixa misteriosa aberta!"]
};

module.exports=async function economia(ctx){
  const c=ctx.cmd;

  if(c==="saldo"){
    const x=get(ctx.jid,ctx.sender,ctx.metadata);save(x);await ctx.replyText(`💰 SALDO\n\n🪙 ${dinheiro(x.p.saldo)} moedas`);return true;
  }

  if(c==="diario"){
    const x=get(ctx.jid,ctx.sender,ctx.metadata),agora=Date.now(),cool=24*60*60e3,ult=Number(x.p.ultimoDiario||0);
    if(agora-ult<cool)return ctx.replyText(`⏳ Seu diário volta em ${restante(cool-(agora-ult))}.`),true;
    const base=reward(500,1000),xp=reward(40,70),old=x.p.level||1,calc=aplicarBonus(base,x.p),m=calc.final;
    x.p.saldo+=m;x.p.xp+=xp;x.p.level=nivel(x.p.xp);x.p.ultimoDiario=agora;save(x);
    const extra=calc.bonusValor>0?`\n⚡ Bônus dos itens: +${dinheiro(calc.bonusValor)} (${calc.total}%)`:"";
    await ctx.replyText(`🎁 DIÁRIO\n\n🪙 +${dinheiro(m)} moedas${extra}\n✨ +${xp} XP${x.p.level>old?`\n🎉 Level ${x.p.level}!`:""}`);return true;
  }

  if(trabalhos[c]){
    const [cool,min,max,x1,x2,t]=trabalhos[c];await ganho(ctx,c,cool,min,max,x1,x2,t);return true;
  }

  if(c==="bonus"){
    const x=get(ctx.jid,ctx.sender,ctx.metadata);save(x);
    const b=calcularBonus(x.p),nomes={tecnologia:"🎮 Tecnologia",veiculos:"🚘 Veículos",luxo:"💎 Luxo",miranha:"🕷️ Miranha"};
    const linhas=Object.entries(nomes).map(([cat,titulo])=>{
      const dados=b.categorias[cat];
      if(!dados||!dados.itens.length)return `${titulo}
   📦 0 itens • ⚡ +0%`;
      const limite=b.limitesCategoria[cat];
      return `${titulo}
   📦 ${dados.itens.length} itens diferentes • ⚡ +${dados.total}%${dados.bruto>dados.total?` (limite ${limite}%)`:""}`;
    }).join("\n\n");
    await ctx.replyText(`╭━━━━━━━━━━━━━━━━━━╮
┃ ⚡ BÔNUS ACUMULADOS
╰━━━━━━━━━━━━━━━━━━╯

${linhas}

━━━━━━━━━━━━━━━━━━
🚀 Bônus total: *+${b.total}%*

📈 Cada item diferente soma seu próprio bônus.
🔁 Itens repetidos não multiplicam o bônus.
🛡️ Limite global: +${b.limiteTotal}%.`);
    return true;
  }

  if(c==="perfil"){
    const a=N(ctx.mentions[0]||ctx.reply||ctx.sender),x=get(ctx.jid,a,ctx.metadata);save(x);
    await ctx.sock.sendMessage(ctx.jid,{text:`👤 PERFIL\n\n@${num(a)}\n🪙 Saldo: ${dinheiro(x.p.saldo)}\n✨ XP: ${dinheiro(x.p.xp)}\n🏆 Level: ${x.p.level}\n🎒 Itens: ${Object.values(x.p.inventario).reduce((s,v)=>s+Number(v||0),0)}`,mentions:[a]});return true;
  }

  if(c==="xp"||c==="level"){
    const a=N(ctx.mentions[0]||ctx.reply||ctx.sender),x=get(ctx.jid,a,ctx.metadata);save(x);
    await ctx.sock.sendMessage(ctx.jid,{text:c==="xp"?`✨ @${num(a)} possui ${dinheiro(x.p.xp)} XP.`:`🏆 @${num(a)} está no level ${x.p.level}.`,mentions:[a]});return true;
  }

  if(c==="transferir"){
    const a=ctx.mentions[0]||ctx.reply;if(!a)return ctx.replyText(`Use ${ctx.prefix}transferir @pessoa 500`),true;
    const valor=parseInt(ctx.args.find(x=>/^\d+$/.test(x))||"0");if(valor<=0)return ctx.replyText("❌ Informe um valor válido."),true;
    const de=get(ctx.jid,ctx.sender,ctx.metadata),para=get(ctx.jid,a,ctx.metadata);if(de.u===para.u)return ctx.replyText("❌ Você não pode transferir para si mesmo."),true;
    if(de.p.saldo<valor)return ctx.replyText("❌ Saldo insuficiente."),true;
    const paraId=para.u;
    de.p.saldo-=valor;save(de);
    const destino=get(ctx.jid,a,ctx.metadata);destino.p.saldo=Number(destino.p.saldo||0)+valor;save(destino);
    await ctx.sock.sendMessage(ctx.jid,{text:`💸 TRANSFERÊNCIA\n\n@${num(de.u)} → @${num(paraId)}\n🪙 ${dinheiro(valor)}`,mentions:[de.u,paraId]});return true;
  }

  if(c==="rank"||c==="rankxp"){
    const d=db.ler("economia",{}),g=d[ctx.jid]||{},campo=c==="rank"?"saldo":"xp";
    const r=Object.entries(g).sort((a,b)=>Number(b[1]?.[campo]||0)-Number(a[1]?.[campo]||0)).slice(0,10);
    if(!r.length)return ctx.replyText("📭 Ranking vazio."),true;

    const medalhas=["🥇","🥈","🥉"];
    const posicoes=["4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];
    const titulo=c==="rank"?"🕷️ RANK MIRANHA":"⚡ RANK DE XP";

    const linhas=r.map(([u,p],i)=>{
      const valor=dinheiro(p?.[campo]||0);
      if(i<3){
        if(c==="rank") return `${medalhas[i]} @${num(u)}\n💰 ${valor} moedas`;
        const level=nivel(p?.xp||0);
        return `${medalhas[i]} @${num(u)}\n⚡ ${valor} XP\n🏆 Level ${level}`;
      }
      const pos=posicoes[i-3]||`${i+1}º`;
      if(c==="rank") return `${pos} @${num(u)} — ${valor} moedas`;
      return `${pos} @${num(u)} — ${valor} XP`;
    }).join("\n\n");

    await ctx.sock.sendMessage(ctx.jid,{
      text:`╭━━━━━━━━━━━━━━━━━━╮\n┃ ${titulo}\n╰━━━━━━━━━━━━━━━━━━╯\n\n${linhas}\n\n━━━━━━━━━━━━━━━━━━\n👥 Top ${r.length} do grupo`,
      mentions:r.map(x=>x[0])
    });
    return true;
  }

  if(c==="loja"){
    const cat=(ctx.args[0]||"").toLowerCase();
    const categorias={
      comida:{ini:1,fim:10,titulo:"🍔 COMIDAS & BEBIDAS"},
      tecnologia:{ini:11,fim:20,titulo:"🎮 TECNOLOGIA"},
      tech:{ini:11,fim:20,titulo:"🎮 TECNOLOGIA"},
      veiculos:{ini:21,fim:30,titulo:"🚘 VEÍCULOS"},
      luxo:{ini:31,fim:40,titulo:"💎 LUXO"},
      miranha:{ini:41,fim:70,titulo:"🕷️ UNIVERSO MIRANHA"},
      aranha:{ini:41,fim:70,titulo:"🕷️ UNIVERSO MIRANHA"}
    };

    if(!cat){
      await ctx.replyText(`╭━━━━━━━━━━━━━━━━━━╮
┃ 🛒 LOJA MIRANHA
╰━━━━━━━━━━━━━━━━━━╯

💰 Compre itens usando suas moedas do grupo.

📂 *CATEGORIAS*
🍔 ${ctx.prefix}loja comida
🎮 ${ctx.prefix}loja tecnologia
🚘 ${ctx.prefix}loja veiculos
💎 ${ctx.prefix}loja luxo
🕷️ ${ctx.prefix}loja miranha

━━━━━━━━━━━━━━━━━━
🛍️ Para comprar:
*${ctx.prefix}comprar ID*

🎒 Seu inventário:
*${ctx.prefix}inventario*

⚡ Seus bônus ativos:
*${ctx.prefix}bonus*`);
      return true;
    }

    const cfg=categorias[cat];
    if(!cfg){
      await ctx.replyText(`❌ Categoria não encontrada.

Use: comida, tecnologia, veiculos, luxo ou miranha.`);
      return true;
    }

    const itens=[];
    for(let id=cfg.ini;id<=cfg.fim;id++){
      const item=loja[String(id)];
      if(!item)continue;
      const [nome,preco,emoji="📦"]=item;
      const b=bonusLoja[String(id)];
      itens.push(`${emoji} *${id}.* ${nome}
   🪙 ${dinheiro(preco)} moedas${b?`\n   ⚡ Bônus: +${b.percent}% ganhos`:""}`);
    }

    await ctx.replyText(`╭━━━━━━━━━━━━━━━━━━╮
┃ ${cfg.titulo}
╰━━━━━━━━━━━━━━━━━━╯

${itens.join("\n\n")}

━━━━━━━━━━━━━━━━━━
🛒 Comprar: *${ctx.prefix}comprar ID*
↩️ Categorias: *${ctx.prefix}loja*`);
    return true;
  }

  if(c==="comprar"){
    const id=String(parseInt(ctx.args[0])),item=loja[id];if(!item)return ctx.replyText(`Use ${ctx.prefix}comprar ID`),true;
    const x=get(ctx.jid,ctx.sender,ctx.metadata),[nome,preco]=item;if(x.p.saldo<preco)return ctx.replyText(`❌ Você precisa de 🪙 ${dinheiro(preco)}.`),true;
    x.p.saldo-=preco;x.p.inventario[id]=Number(x.p.inventario[id]||0)+1;save(x);const emoji=item[2]||"📦";await ctx.replyText(`╭━━━━━━━━━━━━━━━━━━╮
┃ ✅ COMPRA REALIZADA
╰━━━━━━━━━━━━━━━━━━╯

${emoji} *${nome}*
🪙 Valor: ${dinheiro(preco)} moedas

💰 Saldo restante: ${dinheiro(x.p.saldo)} moedas${bonusLoja[id]?`\n⚡ Bônus do item: +${bonusLoja[id].percent}% ganhos`:""}`);return true;
  }

  if(c==="inventario"){
    const x=get(ctx.jid,ctx.sender,ctx.metadata);save(x);const itens=Object.entries(x.p.inventario).filter(([,q])=>q>0);
    if(!itens.length)return ctx.replyText(`╭━━━━━━━━━━━━━━━━━━╮
┃ 🎒 INVENTÁRIO
╰━━━━━━━━━━━━━━━━━━╯

📭 Seu inventário está vazio.

🛒 Use *${ctx.prefix}loja* para ver os itens.`),true;
    const linhas=itens.map(([id,q])=>{
      const [nome=`Item ${id}`,preco=0,emoji="📦"]=loja[id]||[];
      return `${emoji} *${nome}*
   📦 Quantidade: ${q}
   🪙 Valor un.: ${dinheiro(preco)}`;
    }).join("\n\n");
    await ctx.replyText(`╭━━━━━━━━━━━━━━━━━━╮
┃ 🎒 INVENTÁRIO
╰━━━━━━━━━━━━━━━━━━╯

${linhas}

━━━━━━━━━━━━━━━━━━
💰 Saldo: *${dinheiro(x.p.saldo)} moedas*
💵 Vender: *${ctx.prefix}vender ID*
⚡ Bônus ativos: *${ctx.prefix}bonus*`);return true;
  }

  if(c==="vender"){
    const id=String(parseInt(ctx.args[0])),item=loja[id];if(!item)return ctx.replyText(`Use ${ctx.prefix}vender ID`),true;
    const x=get(ctx.jid,ctx.sender,ctx.metadata);if(Number(x.p.inventario[id]||0)<1)return ctx.replyText("❌ Você não possui esse item."),true;
    const valor=Math.floor(item[1]*.5);x.p.inventario[id]--;if(x.p.inventario[id]<=0)delete x.p.inventario[id];x.p.saldo+=valor;save(x);
    await ctx.replyText(`💵 ${item[0]} vendido por 🪙 ${dinheiro(valor)}.`);return true;
  }

  if(["addsaldo","setsaldo","limparrankdinheiro"].includes(c)){
    if(!ctx.isOwner)return ctx.replyText("👑 Apenas o dono pode usar."),true;
    if(c==="limparrankdinheiro"){
      const d=db.ler("economia",{});for(const p of Object.values(d[ctx.jid]||{}))p.saldo=0;db.salvar("economia",d);await ctx.replyText("🧹 Saldos do grupo zerados.");return true;
    }
    const a=N(ctx.mentions[0]||ctx.reply||ctx.sender),valor=parseInt(ctx.args.find(x=>/^-?\d+$/.test(x))||"0"),x=get(ctx.jid,a,ctx.metadata);
    if(c==="addsaldo")x.p.saldo=Number(x.p.saldo||0)+valor;else x.p.saldo=Math.max(0,valor);
    save(x);await ctx.sock.sendMessage(ctx.jid,{text:`👑 @${num(a)} agora possui 🪙 ${dinheiro(x.p.saldo)}.`,mentions:[a]});return true;
  }

  return false;
};
