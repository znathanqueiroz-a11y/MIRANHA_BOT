const db=require('../lib/db');

function baseGrupo(d,jid){
  if(!d[jid])d[jid]={enabled:false,itens:[]};
  if(!Array.isArray(d[jid].itens))d[jid].itens=[];
  return d[jid];
}

module.exports=async function automsg(ctx){
  if(ctx.cmd!=='automsg')return false;
  if(!ctx.isGroup)return ctx.replyText('⚠️ Apenas em grupos.'),true;
  if(!ctx.canAdmin('automsg'))return ctx.replyText('❌ Sem permissão.'),true;

  const d=db.ler('automsg',{});
  const g=baseGrupo(d,ctx.jid);
  const sub=(ctx.args[0]||'status').toLowerCase();

  if(['on','off'].includes(sub)){
    g.enabled=sub==='on';db.salvar('automsg',d);
    await ctx.replyText(g.enabled?'✅ AutoMsg ativado.':'⏸️ AutoMsg desativado.');return true;
  }

  if(sub==='add'){
    const min=Math.max(5,Math.min(10080,parseInt(ctx.args[1])||0));
    const texto=ctx.args.slice(2).join(' ').trim();
    if(!texto)return ctx.replyText(`Use ${ctx.prefix}automsg add 60 sua mensagem\n⏱️ Mínimo: 5 minutos.`),true;
    const id=Date.now().toString(36).slice(-6);
    g.itens.push({id,texto,intervaloMin:min,ultimoEnvio:0});
    db.salvar('automsg',d);
    await ctx.replyText(`✅ AutoMsg criado.\n🆔 ${id}\n⏱️ A cada ${min} min.`);return true;
  }

  if(sub==='del'){
    const id=ctx.args[1];
    if(!id)return ctx.replyText(`Use ${ctx.prefix}automsg del ID`),true;
    const antes=g.itens.length;g.itens=g.itens.filter(x=>String(x.id)!==String(id));db.salvar('automsg',d);
    await ctx.replyText(g.itens.length<antes?'✅ AutoMsg removido.':'⚠️ ID não encontrado.');return true;
  }

  if(sub==='list'){
    if(!g.itens.length)return ctx.replyText('📭 Nenhuma mensagem automática cadastrada.'),true;
    const lista=g.itens.map((x,i)=>`${i+1}. [${x.id}] ${x.intervaloMin} min — ${x.texto.slice(0,70)}${x.texto.length>70?'…':''}`).join('\n');
    await ctx.replyText(`🤖 AUTOMSG — ${g.enabled?'ON':'OFF'}\n\n${lista}`);return true;
  }

  await ctx.replyText(`🤖 AUTOMSG\n\nStatus: ${g.enabled?'ON':'OFF'}\nMensagens: ${g.itens.length}\n\n${ctx.prefix}automsg on/off\n${ctx.prefix}automsg add 60 mensagem\n${ctx.prefix}automsg list\n${ctx.prefix}automsg del ID`);
  return true;
};

module.exports.tick=async function tick(sock){
  const d=db.ler('automsg',{});
  let mudou=false;
  const agora=Date.now();
  for(const [jid,g] of Object.entries(d)){
    if(!g?.enabled||!Array.isArray(g.itens))continue;
    for(const item of g.itens){
      const intervalo=Math.max(5,Number(item.intervaloMin||5))*60000;
      if(agora-Number(item.ultimoEnvio||0)<intervalo)continue;
      try{
        await sock.sendMessage(jid,{text:String(item.texto||'')});
        item.ultimoEnvio=agora;mudou=true;
      }catch(e){console.log(`⚠️ AutoMsg ${jid}:`,e.message);}
    }
  }
  if(mudou)db.salvar('automsg',d);
};
