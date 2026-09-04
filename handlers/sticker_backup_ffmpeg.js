const fs=require("fs");
const path=require("path");
const {promisify}=require("util");
const {execFile}=require("child_process");
const {downloadMediaMessage}=require("@whiskeysockets/baileys");
const execFileAsync=promisify(execFile);
const {N,num,idsParticipante}=require("../lib/utils");

function unwrapContent(content){
  let c=content||{};

  for(let i=0;i<8;i++){
    if(c.ephemeralMessage?.message){
      c=c.ephemeralMessage.message;
      continue;
    }

    if(c.viewOnceMessage?.message){
      c=c.viewOnceMessage.message;
      continue;
    }

    if(c.viewOnceMessageV2?.message){
      c=c.viewOnceMessageV2.message;
      continue;
    }

    if(c.viewOnceMessageV2Extension?.message){
      c=c.viewOnceMessageV2Extension.message;
      continue;
    }

    if(c.documentWithCaptionMessage?.message){
      c=c.documentWithCaptionMessage.message;
      continue;
    }

    break;
  }

  return c;
}

function contextoDoConteudo(content){
  for(const v of Object.values(content||{})){
    if(v?.contextInfo)return v.contextInfo;
  }

  return {};
}

function temMediaKey(media){
  const k=media?.mediaKey;

  if(!k)return false;

  if(Buffer.isBuffer(k) || k instanceof Uint8Array)
    return k.length>0;

  if(typeof k==="string")
    return k.trim().length>0;

  if(Array.isArray(k?.data))
    return k.data.length>0;

  return false;
}


function limparMeta(v,max=120){
  return String(v||"")
    .replace(/[\r\n\t]+/g," ")
    .replace(/\s+/g," ")
    .trim()
    .slice(0,max);
}

function numeroReal(ctx){
  const aliases=idsParticipante(ctx.metadata,ctx.sender);
  const telefone=aliases.find(j=>String(j).endsWith("@s.whatsapp.net"));
  const jid=telefone||N(ctx.sender);
  const n=num(jid).replace(/\D/g,"");
  return n||"desconhecido";
}

function dadosDaFigurinha(ctx){
  const numero=numeroReal(ctx);
  const pessoa=limparMeta(ctx.msg?.pushName,70)||`+${numero}`;
  const grupo=ctx.isGroup
    ? limparMeta(ctx.metadata?.subject,90)||"Grupo"
    : "Conversa privada";

  return {
    pack:"🕷️ Miranha Bot",
    author:limparMeta(
      `👤 ${pessoa} • 🤖 Miranha Bot • 👥 ${grupo} • 📱 +${numero}`,
      240
    )
  };
}

function criarExifFigurinha(pack,author){
  const obj={
    "sticker-pack-id":"miranha-bot",
    "sticker-pack-name":String(pack||"🕷️ Miranha Bot"),
    "sticker-pack-publisher":String(author||"Miranha Bot"),
    "emojis":["🕷️"]
  };

  const json=Buffer.from(JSON.stringify(obj),"utf8");
  const head=Buffer.from([
    0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,
    0x01,0x00,0x41,0x57,0x07,0x00,
    0x00,0x00,0x00,0x00,
    0x16,0x00,0x00,0x00
  ]);

  head.writeUIntLE(json.length,14,4);
  return Buffer.concat([head,json]);
}

function mediaSource(msg){
  const direto=unwrapContent(msg.message);

  if(direto?.imageMessage){
    return {
      type:"image",
      media:direto.imageMessage,
      message:{
        ...msg,
        message:direto
      }
    };
  }

  if(direto?.videoMessage){
    return {
      type:"video",
      media:direto.videoMessage,
      message:{
        ...msg,
        message:direto
      }
    };
  }

  const c=contextoDoConteudo(direto);
  const q=unwrapContent(c.quotedMessage);

  if(q?.imageMessage){
    return {
      type:"image",
      media:q.imageMessage,
      message:{
        key:{
          remoteJid:msg.key.remoteJid,
          fromMe:false,
          id:c.stanzaId,
          participant:c.participant
        },
        message:q
      }
    };
  }

  if(q?.videoMessage){
    return {
      type:"video",
      media:q.videoMessage,
      message:{
        key:{
          remoteJid:msg.key.remoteJid,
          fromMe:false,
          id:c.stanzaId,
          participant:c.participant
        },
        message:q
      }
    };
  }

  return null;
}

module.exports=async function sticker(ctx){
  if(!["sticker","s","fig","toimg"].includes(ctx.cmd))return false;
  const dir=path.join(__dirname,"..","temp_sticker");if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});
  const id=`${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

  if(ctx.cmd==="toimg"){
    const q=ctx.context?.quotedMessage;

    if(!q?.stickerMessage){
      await ctx.replyText(
        `Responda uma figurinha com ${ctx.prefix}toimg`
      );
      return true;
    }

    const m={
      key:{
        remoteJid:ctx.jid,
        fromMe:false,
        id:ctx.context.stanzaId,
        participant:ctx.context.participant
      },
      message:{
        stickerMessage:q.stickerMessage
      }
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
        {
          logger:ctx.logger,
          reuploadRequest:ctx.sock.updateMediaMessage
        }
      );

      if(!buf || !buf.length){
        throw new Error("mídia vazia");
      }

      fs.writeFileSync(input,buf);

      let animada=q.stickerMessage.isAnimated===true;

      try{
        const info=await execFileAsync(
          "webpmux",
          ["-info",input],
          {maxBuffer:10*1024*1024}
        );

        const txt=
          String(info.stdout||"")+
          "\n"+
          String(info.stderr||"");

        if(
          /Animation:\s*1/i.test(txt) ||
          /Number of frames:\s*(?:[2-9]|\d{2,})/i.test(txt)
        ){
          animada=true;
        }
      }catch{}

      if(animada){
        await execFileAsync(
          "magick",
          [
            input,
            "-coalesce",
            gif
          ],
          {maxBuffer:60*1024*1024}
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
          {maxBuffer:60*1024*1024}
        );

        await ctx.sock.sendMessage(ctx.jid,{
          video:fs.readFileSync(mp4),
          gifPlayback:true,
          caption:"🎞️ Figurinha animada extraída"
        });
      }else{
        await execFileAsync(
          "dwebp",
          [
            input,
            "-o",png
          ],
          {maxBuffer:20*1024*1024}
        );

        await ctx.sock.sendMessage(ctx.jid,{
          image:fs.readFileSync(png),
          caption:"🖼️ Figurinha extraída"
        });
      }
    }catch(e){
      console.error("⚠️ toimg:",e.message);

      if(
        String(e.message||"")
          .toLowerCase()
          .includes("media key")
      ){
        await ctx.replyText(
          "❌ Essa figurinha chegou sem a chave de mídia. Reenvie ela e tente novamente."
        );
      }else{
        await ctx.replyText(
          "❌ Não consegui extrair essa figurinha."
        );
      }
    }finally{
      for(const f of [input,png,gif,mp4]){
        if(fs.existsSync(f)){
          try{fs.unlinkSync(f);}catch{}
        }
      }
    }

    return true;
  }

  const src=mediaSource(ctx.msg);

  if(!src)
    return ctx.replyText(
      `🖼️ Envie ou responda uma imagem/vídeo com ${ctx.prefix}sticker`
    ),true;

  if(!temMediaKey(src.media))
    return ctx.replyText(
      "❌ Essa mídia chegou sem a chave de download. Reenvie a imagem/vídeo e tente novamente."
    ),true;
  const ext=src.type==="video"?"mp4":"jpg",input=path.join(dir,`${id}.${ext}`),output=path.join(dir,`${id}.webp`),tagged=path.join(dir,`${id}_dados.webp`),exif=path.join(dir,`${id}.exif`);
  try{
    const buf=await downloadMediaMessage(src.message,"buffer",{}, {logger:ctx.logger,reuploadRequest:ctx.sock.updateMediaMessage});
    fs.writeFileSync(input,buf);
    const args=["-y","-i",input];
    if(src.type==="video")args.push("-t","10");
    args.push("-vf","scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0,fps=15","-c:v","libwebp","-lossless","0","-q:v","60","-compression_level","6","-loop","0","-an",output);
    await execFileAsync("ffmpeg",args,{maxBuffer:30*1024*1024});
    const meta=dadosDaFigurinha(ctx);
    fs.writeFileSync(exif,criarExifFigurinha(meta.pack,meta.author));

    await execFileAsync(
      "webpmux",
      ["-set","exif",exif,output,"-o",tagged],
      {maxBuffer:10*1024*1024}
    );

    await ctx.sock.sendMessage(ctx.jid,{sticker:fs.readFileSync(tagged)});
  }catch(e){
    console.error("⚠️ sticker:",e.message);

    if(String(e.message||"").includes("empty media key")){
      await ctx.replyText(
        "❌ Essa mídia chegou sem a chave de download. Reenvie a imagem/vídeo e tente novamente."
      );
    }else{
      await ctx.replyText("❌ Não consegui criar essa figurinha.");
    }
  }
  finally{for(const f of[input,output,tagged,exif])if(fs.existsSync(f))try{fs.unlinkSync(f);}catch{}}
  return true;
};
