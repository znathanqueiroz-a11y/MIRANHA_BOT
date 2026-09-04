const db=require("../lib/db");
const {N,num,dinheiro,idsParticipante}=require("../lib/utils");
const economia=require("./economia");

const TRABALHOS=[
  ["trabalhar","💼 Trabalhar"],
  ["pescar","🎣 Pescar"],
  ["minerar","⛏️ Minerar"],
  ["missao","🎯 Missão"],
  ["coletar","🧺 Coletar"],
  ["tesouro","🗺️ Tesouro"],
  ["entregar","📦 Entregar"],
  ["cozinhar","🍳 Cozinhar"],
  ["fotografar","📸 Fotografar"],
  ["programar","💻 Programar"],
  ["reciclar","♻️ Reciclar"],
  ["fazenda","🌾 Fazenda"],
  ["explorar","🧭 Explorar"],
  ["premio","🏆 Prêmio"],
  ["caixamisteriosa","🎁 Caixa misteriosa"]
];

function perfil(grupo,usuario,metadata){
  const d=db.ler("economia",{});
  const g=d[grupo]||{};
  const normal=N(usuario);

  const aliases=[...new Set(
    idsParticipante(metadata,normal)
      .concat([normal])
      .filter(Boolean)
      .map(N)
  )];

  const candidatos=aliases
    .filter(id=>g[id])
    .map(id=>[id,g[id]]);

  if(!candidatos.length){
    return {saldo:0,xp:0};
  }

  candidatos.sort((a,b)=>{
    const A=a[1]||{},B=b[1]||{};
    return (Number(B.saldo||0)+Number(B.xp||0))-
           (Number(A.saldo||0)+Number(A.xp||0));
  });

  const p=candidatos[0][1]||{};
  return {
    saldo:Number(p.saldo||0),
    xp:Number(p.xp||0)
  };
}

module.exports=async function coletarTudo(ctx){
  if(ctx.cmd!=="coletartudo")return false;

  if(!ctx.isGroup){
    await ctx.replyText("⚠️ Use este comando em um grupo.");
    return true;
  }

  const antesGeral=perfil(ctx.jid,ctx.sender,ctx.metadata);
  const coletados=[];
  const espera=[];
  const erros=[];

  for(const [cmd,nome] of TRABALHOS){
    const antes=perfil(ctx.jid,ctx.sender,ctx.metadata);
    const mensagens=[];

    const fakeSock=new Proxy(ctx.sock,{
      get(target,prop){
        if(prop==="sendMessage"){
          return async (_jid,payload)=>{
            if(payload?.text)mensagens.push(String(payload.text));
            return {key:{id:`coletartudo-${cmd}-${Date.now()}`}};
          };
        }
        const v=target[prop];
        return typeof v==="function"?v.bind(target):v;
      }
    });

    const fake={
      ...ctx,
      cmd,
      args:[],
      text:`${ctx.prefix}${cmd}`,
      body:`${ctx.prefix}${cmd}`,
      sock:fakeSock,
      replyText:async texto=>{
        mensagens.push(String(texto||""));
        return {key:{id:`coletartudo-${cmd}-${Date.now()}`}};
      }
    };

    try{
      await economia(fake);

      const depois=perfil(ctx.jid,ctx.sender,ctx.metadata);
      const moedas=Math.max(0,depois.saldo-antes.saldo);
      const xp=Math.max(0,depois.xp-antes.xp);

      if(moedas>0||xp>0){
        coletados.push({cmd,nome,moedas,xp});
      }else{
        const txt=mensagens.join("\n");
        if(/aguarde|volta em|cooldown|espere/i.test(txt)){
          espera.push(nome);
        }else{
          espera.push(nome);
        }
      }
    }catch(e){
      erros.push(nome);
      console.log(`⚠️ coletartudo ${cmd}:`,e.message);
    }
  }

  const depoisGeral=perfil(ctx.jid,ctx.sender,ctx.metadata);
  const totalMoedas=Math.max(0,depoisGeral.saldo-antesGeral.saldo);
  const totalXp=Math.max(0,depoisGeral.xp-antesGeral.xp);

  let texto=
`╭━━━━━━━━━━━━━━━━━━╮
┃ 💼 COLETA DE TRABALHOS
╰━━━━━━━━━━━━━━━━━━╯

✅ Coletados: ${coletados.length}/${TRABALHOS.length}
⏳ Em espera: ${espera.length}
🪙 Total recebido: +${dinheiro(totalMoedas)}
✨ XP recebido: +${dinheiro(totalXp)}`;

  if(coletados.length){
    texto+="\n\n📋 COLETADOS\n";
    texto+=coletados.map(x=>
      `${x.nome} — 🪙 +${dinheiro(x.moedas)} | ✨ +${dinheiro(x.xp)} XP`
    ).join("\n");
  }

  if(!coletados.length){
    texto+="\n\n⏳ Nenhum trabalho está disponível agora.";
  }

  if(erros.length){
    texto+=`\n\n⚠️ Não consegui verificar: ${erros.join(", ")}`;
  }

  texto+=`\n\n💰 Saldo atual: ${dinheiro(depoisGeral.saldo)}`;

  await ctx.sock.sendMessage(ctx.jid,{
    text:texto,
    mentions:[N(ctx.sender)]
  });

  return true;
};
