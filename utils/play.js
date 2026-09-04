const { exec } = require("child_process");
const fs = require("fs");

function playYoutube(busca, enviar){
  if(!busca){
    return enviar("🎵 Use: !play nome da música");
  }

  const arquivo = `/tmp/musica_${Date.now()}.mp3`;

  const comando = `yt-dlp -x --audio-format mp3 -o "${arquivo}" "ytsearch1:${busca}"`;

  exec(comando, (erro)=>{
    if(erro){
      return enviar("❌ Não foi possível baixar a música.");
    }

    enviar({
      audio: fs.readFileSync(arquivo),
      mimetype: "audio/mpeg"
    });
  });
}

module.exports = { playYoutube };
