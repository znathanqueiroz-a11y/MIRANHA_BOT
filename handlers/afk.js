const afk=require("../utils/afk");

module.exports=async function(ctx){

    if(ctx.cmd!=="afk") return false;

    const motivo=ctx.args?.join(" ") || "Não informado";

    afk.ativar(
        ctx.sender,
        motivo
    );

    await ctx.replyText(
`╭━━━━━━━━━━━━━━━━━━╮
🕷️ MIRANHA BOT
💤 MODO AFK ATIVADO
╰━━━━━━━━━━━━━━━━━━╯

✅ Seu status AFK foi ativado!

📝 Motivo:
${motivo}

📅 Data:
${new Date().toLocaleDateString("pt-BR")}

🕒 Horário:
${new Date().toLocaleTimeString("pt-BR")}

⚡ O bot avisará quando você estiver ausente.`
    );

    return true;
};
