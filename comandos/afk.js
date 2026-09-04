module.exports = async function afk(ctx){

    const {cmd,args,replyText} = ctx;

    if(cmd !== "afk") return false;

    const motivo = args.join(" ") || "Não informado";

    await replyText(
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
