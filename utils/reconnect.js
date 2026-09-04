module.exports=function(update,iniciarBot){

const {connection,lastDisconnect}=update;

if(connection==="open"){
 console.log("🕷️ MIRANHA BOT ONLINE");
}

if(connection==="close"){

 const code =
 lastDisconnect?.error?.output?.statusCode;

 if(code!==401){

 console.log("🔄 Reconectando...");

 setTimeout(()=>{
   iniciarBot();
 },5000);

 }else{

 console.log("❌ Sessão expirada.");

 }

}

};
