module.exports = async function marcarTodos(ctx) {
  if (ctx.cmd !== "marcar") return false;

  if (!ctx.isGroup) {
    await ctx.replyText("❌ Esse comando só funciona em grupos.");
    return true;
  }

  if (!ctx.isAdmin && !ctx.isOwner) {
    await ctx.replyText("❌ Apenas administradores podem usar.");
    return true;
  }

  const participantes = ctx.metadata?.participants || [];

  const mencoes = participantes
    .map(p => p.id)
    .filter(id => id !== ctx.sock.user.id);

  if (!mencoes.length) {
    await ctx.replyText("❌ Nenhum membro encontrado.");
    return true;
  }

  const texto = ctx.args?.length ? ctx.args.join(" ") : "📢 Atenção, pessoal!";

  await ctx.sock.sendMessage(ctx.jid, {
    text: `🕷️ *Miranha Bot*

${texto}

${mencoes.map(id => "@" + id.split("@")[0]).join(" ")}`,
    mentions: mencoes
  });

  return true;
};
