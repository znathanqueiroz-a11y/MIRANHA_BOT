const fs=require('fs');
const path=require('path');
const {downloadMediaMessage}=require('@whiskeysockets/baileys');
const db=require('../lib/db');

const PADRAO=`👋 Bem-vindo(a) @user! 🕷️❤️\n\nÉ um prazer ter você com a gente! Esperamos que se sinta à vontade para conversar, interagir e conhecer novas pessoas.\n\n📸 Para a galera te conhecer melhor, envie sua foto e se apresente com:\n\n👤 Nome:\n🎂 Idade:\n🏙️ Cidade:\n📍 Estado:\n\n✨ Respeite todos os membros, evite confusões e aproveite bastante o grupo.\n\n🕷️ Seja muito bem-vindo(a) e divirta-se com a gente!`;
const SAIDA_PADRAO='👋 @user saiu do grupo.';
const MEDIA_DIR=path.join(__dirname,'..','media','grupos');
if(!fs.existsSync(MEDIA_DIR))fs.mkdirSync(MEDIA_DIR,{recursive:true});

function safeJid(jid){return String(jid).replace(/[^a-zA-Z0-9_.-]/g,'_');}
function arquivoMedia(jid,tipo){return path.join(MEDIA_DIR,`${safeJid(jid)}_${tipo}.bin`);}
function mediaSource(msg){
  if(msg.message?.imageMessage)return msg;
  const c=msg.message?.extendedTextMessage?.contextInfo||msg.message?.imageMessage?.contextInfo||{};
  const q=c.quotedMessage;
  if(q?.imageMessage)return {key:{remoteJid:msg.key.remoteJid,fromMe:false,id:c.stanzaId,participant:c.participant},message:{imageMessage:q.imageMessage}};
  return null;
}
async function salvarImagem(ctx,tipo){
  const src=mediaSource(ctx.msg);if(!src)return false;
  const buf=await downloadMediaMessage(src,'buffer',{}, {logger:ctx.logger,reuploadRequest:ctx.sock.updateMediaMessage});
  fs.writeFileSync(arquivoMedia(ctx.jid,tipo),buf);return true;
}
function removerImagem(jid,tipo){const f=arquivoMedia(jid,tipo);if(fs.existsSync(f))fs.unlinkSync(f);}
function lerImagem(jid,tipo){const f=arquivoMedia(jid,tipo);return fs.existsSync(f)?fs.readFileSync(f):null;}
function cfgMedia(){return db.ler('midias_grupo',{});}

module.exports=async function configuracoes(ctx){
  const cmds=['legendabv','legendaentrada','legendasaiu','legendasimples','setprefix','bemvindo','saida','fotobv','set-fotobv','set-bannerbv','rmfotobv','fotosaiu','rmfotosaiu'];
  if(!cmds.includes(ctx.cmd))return false;

  if(ctx.cmd==='setprefix'){
    if(!ctx.isOwner)return ctx.replyText('👑 Apenas o dono pode alterar o prefixo.'),true;
    const p=ctx.args[0];if(!p||p.length>3)return ctx.replyText(`Use ${ctx.prefix}setprefix novo_prefixo`),true;
    db.salvar('prefixo',{prefix:p});await ctx.replyText(`✅ Prefixo alterado para ${p}`);return true;
  }

  if(!ctx.isGroup)return ctx.replyText('⚠️ Apenas em grupos.'),true;
  if(!ctx.canAdmin(ctx.cmd)&&!ctx.isOwner)return ctx.replyText('❌ Sem permissão.'),true;

  if(ctx.cmd==='legendabv'||ctx.cmd==='legendaentrada'){
    const d=db.ler('legendabv',{}),t=ctx.args.join(' ').trim();
    if(!t)return ctx.replyText(`📝 LEGENDA DE ENTRADA\n\n${d[ctx.jid]||PADRAO}\n\nUse @user para mencionar quem entrou.`),true;
    d[ctx.jid]=t;db.salvar('legendabv',d);return ctx.replyText('✅ Legenda de entrada atualizada.'),true;
  }

  if(ctx.cmd==='legendasaiu'){
    const d=db.ler('legendasaiu',{}),t=ctx.args.join(' ').trim();
    if(!t)return ctx.replyText(`📝 LEGENDA DE SAÍDA\n\n${d[ctx.jid]||SAIDA_PADRAO}\n\nUse @user para mencionar quem saiu.`),true;
    d[ctx.jid]=t;db.salvar('legendasaiu',d);return ctx.replyText('✅ Legenda de saída atualizada.'),true;
  }

  if(ctx.cmd==='legendasimples'){
    const op=(ctx.args[0]||'').toLowerCase();if(!['on','off'].includes(op))return ctx.replyText(`Use ${ctx.prefix}legendasimples on/off\nON = envia só texto, mesmo com foto/banner configurado.`),true;
    const d=cfgMedia();if(!d[ctx.jid])d[ctx.jid]={};d[ctx.jid].simples=op==='on';db.salvar('midias_grupo',d);
    return ctx.replyText(op==='on'?'✅ Legenda simples ativada.':'✅ Mídia de boas-vindas/saída liberada.'),true;
  }

  if(ctx.cmd==='bemvindo'||ctx.cmd==='saida'){
    const op=(ctx.args[0]||'').toLowerCase();if(!['on','off'].includes(op))return ctx.replyText(`Use ${ctx.prefix}${ctx.cmd} on/off`),true;
    const nome=ctx.cmd==='bemvindo'?'welcome':'saida',d=db.ler(nome,{});d[ctx.jid]=op==='on';db.salvar(nome,d);
    await ctx.replyText(op==='on'?`✅ ${ctx.cmd} ativado.`:`⏸️ ${ctx.cmd} desativado.`);return true;
  }

  if(ctx.cmd==='set-fotobv'||ctx.cmd==='set-bannerbv'){
    try{
      const ok=await salvarImagem(ctx,ctx.cmd==='set-fotobv'?'fotobv':'bannerbv');
      if(!ok)return ctx.replyText(`📸 Envie uma imagem com ${ctx.prefix}${ctx.cmd} na legenda ou responda uma imagem.`),true;
      return ctx.replyText(ctx.cmd==='set-fotobv'?'✅ Foto de boas-vindas salva.':'✅ Banner de boas-vindas salvo.'),true;
    }catch(e){return ctx.replyText(`❌ Não consegui salvar a imagem: ${e.message}`),true;}
  }

  if(ctx.cmd==='fotobv'){
    const banner=lerImagem(ctx.jid,'bannerbv'),foto=lerImagem(ctx.jid,'fotobv'),img=banner||foto;
    if(!img)return ctx.replyText(`📭 Nenhuma foto/banner de boas-vindas configurado.\nUse ${ctx.prefix}set-fotobv ou ${ctx.prefix}set-bannerbv.`),true;
    await ctx.sock.sendMessage(ctx.jid,{image:img,caption:banner?'🖼️ Banner atual de boas-vindas':'🖼️ Foto atual de boas-vindas'});return true;
  }

  if(ctx.cmd==='rmfotobv'){
    removerImagem(ctx.jid,'fotobv');removerImagem(ctx.jid,'bannerbv');return ctx.replyText('✅ Foto/banner de boas-vindas removido.'),true;
  }

  if(ctx.cmd==='fotosaiu'){
    const src=mediaSource(ctx.msg);
    if(src){
      try{await salvarImagem(ctx,'fotosaiu');return ctx.replyText('✅ Foto de saída salva.'),true;}catch(e){return ctx.replyText(`❌ Não consegui salvar: ${e.message}`),true;}
    }
    const img=lerImagem(ctx.jid,'fotosaiu');if(!img)return ctx.replyText(`📭 Nenhuma foto de saída configurada.\nEnvie/responda uma imagem com ${ctx.prefix}fotosaiu.`),true;
    await ctx.sock.sendMessage(ctx.jid,{image:img,caption:'🖼️ Foto atual de saída'});return true;
  }

  if(ctx.cmd==='rmfotosaiu'){
    removerImagem(ctx.jid,'fotosaiu');return ctx.replyText('✅ Foto de saída removida.'),true;
  }

  return true;
};

module.exports.PADRAO=PADRAO;
module.exports.SAIDA_PADRAO=SAIDA_PADRAO;
module.exports.lerImagem=lerImagem;
