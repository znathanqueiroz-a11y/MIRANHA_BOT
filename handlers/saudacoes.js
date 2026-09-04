module.exports=async function saudacoes(ctx){
  const textos={
    dia:"🌅 Bom dia, pessoal! ☀️\nQue o dia de vocês seja leve, produtivo e cheio de coisas boas. 🕷️❤️",
    tarde:"🌤️ Boa tarde, pessoal!\nPassando para desejar uma ótima tarde para todo mundo do grupo. 🕷️✨",
    noite:"🌙 Boa noite, pessoal!\nQue todos tenham uma noite tranquila e agradável. 🕷️💙",
    madrugada:"🌑 Boa madrugada, pessoal!\nPara quem ainda está acordado: boa conversa e uma ótima madrugada. 🕷️✨"
  };

  if(!Object.prototype.hasOwnProperty.call(textos,ctx.cmd))return false;

  if(!ctx.isGroup){
    await ctx.replyText("👥 Esse comando de saudação foi feito para usar em grupo.");
    return true;
  }

  await ctx.sock.sendMessage(ctx.jid,{text:textos[ctx.cmd]});
  return true;
};

