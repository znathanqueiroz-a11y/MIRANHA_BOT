const { exec } = require("child_process");
const fs = require("fs");

module.exports = async function play(ctx){

    if(ctx.cmd !== "play") return false;

    const busca = ctx.args.join(" ");

    if(!busca){

        await ctx.replyText(
`╭━━━━━━━━━━━━━━━━━━╮
🕷️ MIRANHA BOT
🎵 PLAY AUDIO
╰━━━━━━━━━━━━━━━━━━╯

Use:
!play nome da música`
        );

        return true;
    }

    await ctx.replyText(
`╭━━━━━━━━━━━━━━━━━━╮
🕷️ MIRANHA BOT
🎵 PLAY AUDIO
╰━━━━━━━━━━━━━━━━━━╯

🔎 Procurando:
${busca}

⏳ Baixando áudio...`
    );


    const arquivo = `temp_audio/${Date.now()}.mp3`;

    exec(
`yt-dlp -x --audio-format mp3 -o "${arquivo}" "ytsearch1:${busca}"`,
async (erro)=>{

        if(erro){

            await ctx.replyText(
            "❌ Não foi possível baixar o áudio."
            );

            return;
        }


        if(fs.existsSync(arquivo)){

            await ctx.sock.sendMessage(
                ctx.jid,
                {
                    audio: fs.readFileSync(arquivo),
                    mimetype:"audio/mpeg"
                }
            );

            fs.unlinkSync(arquivo);
        }

});

return true;

};
