const db=require('../lib/db');
const {N,num}=require('../lib/utils');

function nomeRole(v){return String(v||'').trim().toLowerCase();}
function grupo(d,jid){if(!d[jid])d[jid]={};return d[jid];}

module.exports=async function roles(ctx){
  const cmds=['role.criar','role.alterar','role.excluir','role.lista','role.dar','role.remover'];
  if(!cmds.includes(ctx.cmd))return false;
  if(!ctx.isGroup)return ctx.replyText('⚠️ Apenas em grupos.'),true;
  if(!ctx.canAdmin(ctx.cmd)&&!ctx.isOwner)return ctx.replyText('❌ Sem permissão.'),true;
  const d=db.ler('roles',{}),g=grupo(d,ctx.jid);

  if(ctx.cmd==='role.lista'){
    const itens=Object.entries(g);
    if(!itens.length)return ctx.replyText('📭 Nenhum cargo criado.'),true;
    const texto=itens.map(([k,r],i)=>`${i+1}. ${r.nome||k}${r.descricao?` — ${r.descricao}`:''}\n   👥 ${(r.membros||[]).length} membro(s)`).join('\n');
    return ctx.replyText(`🎭 CARGOS\n\n${texto}`),true;
  }

  if(ctx.cmd==='role.criar'){
    const bruto=ctx.args.join(' ').trim();const [nome,...rest]=bruto.split('|').map(x=>x.trim());
    if(!nome)return ctx.replyText(`Use ${ctx.prefix}role.criar Nome | descrição`),true;
    const k=nomeRole(nome);if(g[k])return ctx.replyText('⚠️ Esse cargo já existe.'),true;
    g[k]={nome,descricao:rest.join(' | '),membros:[]};db.salvar('roles',d);return ctx.replyText(`✅ Cargo ${nome} criado.`),true;
  }

  if(ctx.cmd==='role.alterar'){
    const bruto=ctx.args.join(' ').trim();const partes=bruto.split('|').map(x=>x.trim());
    const antigo=nomeRole(partes[0]),novo=partes[1],descricao=partes.slice(2).join(' | ');
    if(!antigo||!novo)return ctx.replyText(`Use ${ctx.prefix}role.alterar Cargo atual | Novo nome | descrição`),true;
    if(!g[antigo])return ctx.replyText('⚠️ Cargo não encontrado.'),true;
    const item=g[antigo];delete g[antigo];item.nome=novo;if(descricao)item.descricao=descricao;g[nomeRole(novo)]=item;db.salvar('roles',d);
    return ctx.replyText(`✅ Cargo alterado para ${novo}.`),true;
  }

  if(ctx.cmd==='role.excluir'){
    const k=nomeRole(ctx.args.join(' '));if(!k)return ctx.replyText(`Use ${ctx.prefix}role.excluir Nome`),true;
    if(!g[k])return ctx.replyText('⚠️ Cargo não encontrado.'),true;delete g[k];db.salvar('roles',d);return ctx.replyText('✅ Cargo excluído.'),true;
  }

  const alvo=ctx.mentions[0]||ctx.reply;
  const argsSemMencao=ctx.args.filter(a=>!a.startsWith('@')).join(' ').trim();
  const k=nomeRole(argsSemMencao);
  if(!k||!alvo)return ctx.replyText(`Use ${ctx.prefix}${ctx.cmd} Nome do cargo @pessoa`),true;
  if(!g[k])return ctx.replyText('⚠️ Cargo não encontrado.'),true;
  const u=N(alvo);if(!Array.isArray(g[k].membros))g[k].membros=[];
  if(ctx.cmd==='role.dar'){
    if(!g[k].membros.map(N).includes(u))g[k].membros.push(u);
    db.salvar('roles',d);await ctx.sock.sendMessage(ctx.jid,{text:`✅ @${num(u)} recebeu o cargo ${g[k].nome}.`,mentions:[u]});return true;
  }
  g[k].membros=g[k].membros.map(N).filter(x=>x!==u);db.salvar('roles',d);
  await ctx.sock.sendMessage(ctx.jid,{text:`✅ Cargo ${g[k].nome} removido de @${num(u)}.`,mentions:[u]});return true;
};
