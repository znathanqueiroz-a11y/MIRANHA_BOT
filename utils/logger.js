const fs = require("fs");

function log(tipo,msg){
 const texto =
 `[${new Date().toLocaleString("pt-BR")}] [${tipo}] ${msg}\n`;

 console.log(texto);

 try{
   fs.appendFileSync("logs/bot.log", texto);
 }catch{}
}

module.exports={
 info:(m)=>log("INFO",m),
 warn:(m)=>log("WARN",m),
 erro:(m)=>log("ERRO",m)
};
