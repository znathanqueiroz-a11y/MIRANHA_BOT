const fs=require("fs");
const path=require("path");
const {promisify}=require("util");
const {execFile}=require("child_process");
const {downloadMediaMessage}=require("@whiskeysockets/baileys");
const execFileAsync=promisify(execFile);

function mediaSource(msg){
  if(msg.message?.imageMessage)return {type:"image",message:msg};
  if(msg.message?.videoMessage)return {type:"video",message:msg};
  const c=msg.message?.extendedTextMessage?.contextInfo||msg.message?.imageMessage?.contextInfo||msg.message?.videoMessage?.contextInfo||{};
  const q=c.quotedMessage;
  if(q?.imageMessage)return {type:"image",message:{key:{remoteJid:msg.key.remoteJid,fromMe:false,id:c.stanzaId,participant:c.participant},message:{imageMessage:q.imageMessage}}};
  if(q?.videoMessage)return {type:"video",message:{key:{remoteJid:msg.key.remoteJid,fromMe:false,id:c.stanzaId,participant:c.participant},message:{videoMessage:q.videoMessage}}};
  return null;
}

module.exports=async function sticker(ctx){
  if(!["sticker","s","fig","toimg"].includes(ctx.cmd))return false;
  const dir=path.join(__dirname,"..","temp_sticker");if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});
  const id=`${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

  if(ctx.cmd==="toimg"){
    const q=ctx.context?.quotedMessage;
    if(!q?.stickerMessage)
      return ctx.replyText(`Responda uma figurinha com ${ctx.prefix}toimg`),true;

    const m={
      key:{
        remoteJid:ctx.jid,
        fromMe:false,
        id:ctx.context.stanzaId,
        participant:ctx.context.participant
      },
      message:{stickerMessage:q.stickerMessage}
    };

    const input=path.join(dir,`${id}.webp`);
    const png=path.join(dir,`${id}.png`);
    const gif=path.join(dir,`${id}.gif`);
    const mp4=path.join(dir,`${id}.mp4`);

    try{
      const buf=await downloadMediaMessage(
        m,
        "buffer",
        {},
        {logger:ctx.logger,reuploadRequest:ctx.sock.updateMediaMessage}
      );

      fs.writeFileSync(input,buf);

      const animada=q.stickerMessage.isAnimated===true;

      if(animada){
        await execFileAsync(
          "magick",
          [input,"-coalesce",gif],
          {maxBuffer:40*1024*1024}
        );

        await execFileAsync(
          "ffmpeg",
          [
            "-y",
            "-i",gif,
            "-an",
            "-vf","scale=trunc(iw/2)*2:trunc(ih/2)*2",
            "-c:v","libx264",
            "-preset","veryfast",
            "-crf","23",
            "-pix_fmt","yuv420p",
            "-movflags","+faststart",
            mp4
          ],
          {maxBuffer:40*1024*1024}
        );

        await ctx.sock.sendMessage(ctx.jid,{
          video:fs.readFileSync(mp4),
          gifPlayback:true,
          caption:"🎞️ Figurinha animada extraída"
        });
      }else{
        try{
          await execFileAsync(
            "magick",
            [`${input}[0]`,png],
            {maxBuffer:20*1024*1024}
          );
        }catch{
          await execFileAsync(
            "ffmpeg",
            ["-y","-i",input,"-frames:v","1",png],
            {maxBuffer:20*1024*1024}
          );
        }

        await ctx.sock.sendMessage(ctx.jid,{
          image:fs.readFileSync(png),
          caption:"🖼️ Figurinha extraída"
        });
      }
    }catch(e){
      console.error("⚠️ toimg:",e.message);
      await ctx.replyText("❌ Não consegui extrair essa figurinha.");
    }finally{
      for(const f of [input,png,gif,mp4]){
        if(fs.existsSync(f)){
          try{fs.unlinkSync(f);}catch{}
        }
      }
    }

    return true;
  }

  const src=mediaSource(ctx.msg);if(!src)return ctx.replyText(`🖼️ Envie ou responda uma imagem/vídeo com ${ctx.prefix}sticker`),true;
  const ext=src.type==="video"?"mp4":"jpg",input=path.join(dir,`${id}.${ext}`),output=path.join(dir,`${id}.webp`);
  try{
    const buf=await downloadMediaMessage(src.message,"buffer",{}, {logger:ctx.logger,reuploadRequest:ctx.sock.updateMediaMessage});
    fs.writeFileSync(input,buf);
    const args=["-y","-i",input];
    if(src.type==="video")args.push("-t","10");
    args.push("-vf","scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0,fps=15","-c:v","libwebp","-lossless","0","-q:v","60","-compression_level","6","-loop","0","-an",output);
    await execFileAsync("ffmpeg",args,{maxBuffer:30*1024*1024});
    await ctx.sock.sendMessage(ctx.jid,{sticker:fs.readFileSync(output)});
  }catch(e){await ctx.replyText(`❌ Erro ao criar figurinha: ${e.message}`);}
  finally{for(const f of[input,output])if(fs.existsSync(f))try{fs.unlinkSync(f);}catch{}}
  return true;
};
