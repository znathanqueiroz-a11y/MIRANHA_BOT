const db=require('../lib/db');

const TOXICO={
  baixa:['idiota','imbecil','otário','otaria'],
  media:['idiota','imbecil','otário','otaria','burro','burra','nojento','nojenta'],
  alta:['idiota','imbecil','otário','otaria','burro','burra','nojento','nojenta','inútil','inutil','lixo']
};

module.exports=async function seguranca(ctx){
  const simples=['antilink','antiinvite','antiflood','anticlique','antiaudio','antifig','antiloc'];
  if(![...simples,'antipalavra','antitoxic'].includes(ctx.cmd))return false;
  if(!ctx.isGroup)return ctx.replyText('⚠️ Apenas em grupos.'),true;
  if(!ctx.canAdmin(ctx.cmd)&&!ctx.isOwner)return ctx.replyText('❌ Sem permissão.'),true;

  if(simples.includes(ctx.cmd)){
    const op=(ctx.args[0]||'').toLowerCase();
    if(!['on','off'].includes(op))return ctx.replyText(`Use ${ctx.prefix}${ctx.cmd} on/off`),true;
    const d=db.ler(ctx.cmd,{});d[ctx.jid]=op==='on';db.salvar(ctx.cmd,d);
    await ctx.replyText(op==='on'?`🛡️ ${ctx.cmd} ativado.`:`🔓 ${ctx.cmd} desativado.`);return true;
  }

  if(ctx.cmd==='antitoxic'){
    const d=db.ler('antitoxic',{});if(!d[ctx.jid])d[ctx.jid]={enabled:false,sensibilidade:'media'};
    const sub=(ctx.args[0]||'status').toLowerCase();
    if(['on','off'].includes(sub)){
      d[ctx.jid].enabled=sub==='on';db.salvar('antitoxic',d);return ctx.replyText(sub==='on'?'🛡️ Anti-tóxico ativado.':'🔓 Anti-tóxico desativado.'),true;
    }
    if(sub==='sensibilidade'){
      const n=(ctx.args[1]||'').toLowerCase();if(!['baixa','media','alta'].includes(n))return ctx.replyText(`Use ${ctx.prefix}antitoxic sensibilidade baixa|media|alta`),true;
      d[ctx.jid].sensibilidade=n;db.salvar('antitoxic',d);return ctx.replyText(`✅ Sensibilidade: ${n}.`),true;
    }
    return ctx.replyText(`🛡️ ANTITÓXICO\nStatus: ${d[ctx.jid].enabled?'ON':'OFF'}\nSensibilidade: ${d[ctx.jid].sensibilidade}\n\n${ctx.prefix}antitoxic on/off\n${ctx.prefix}antitoxic sensibilidade baixa|media|alta`),true;
  }

  const d=db.ler('antipalavra',{});if(!d[ctx.jid])d[ctx.jid]={enabled:false,palavras:[]};
  const sub=(ctx.args[0]||'').toLowerCase();const resto=ctx.args.slice(1).join(' ').trim().toLowerCase();
  if(sub==='on'||sub==='off'){d[ctx.jid].enabled=sub==='on';db.salvar('antipalavra',d);await ctx.replyText(sub==='on'?'🛡️ Anti-palavra ativado.':'🔓 Anti-palavra desativado.');return true;}
  if(sub==='add'){
    if(!resto)return ctx.replyText(`Use ${ctx.prefix}antipalavra add palavra`),true;
    if(!d[ctx.jid].palavras.includes(resto))d[ctx.jid].palavras.push(resto);db.salvar('antipalavra',d);await ctx.replyText('✅ Palavra adicionada.');return true;
  }
  if(sub==='del'){d[ctx.jid].palavras=d[ctx.jid].palavras.filter(x=>x!==resto);db.salvar('antipalavra',d);await ctx.replyText('✅ Palavra removida.');return true;}
  if(sub==='list')return ctx.replyText(d[ctx.jid].palavras.length?`🚫 PALAVRAS BLOQUEADAS\n\n${d[ctx.jid].palavras.map((x,i)=>`${i+1}. ${x}`).join('\n')}`:'📭 Lista vazia.'),true;
  await ctx.replyText(`Use:\n${ctx.prefix}antipalavra on/off\n${ctx.prefix}antipalavra add palavra\n${ctx.prefix}antipalavra del palavra\n${ctx.prefix}antipalavra list`);return true;
};

module.exports.toxicas=function(sens='media'){return TOXICO[sens]||TOXICO.media;};
