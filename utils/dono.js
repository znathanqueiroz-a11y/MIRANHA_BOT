const fs = require("fs");

function limpar(n){
  return String(n || "").replace(/\D/g,"");
}

function ehDono(numero){
  try{
    const dono = JSON.parse(fs.readFileSync("./data/dono.json","utf8"));
    return limpar(numero) === limpar(dono.numero);
  }catch(e){
    return false;
  }
}

module.exports = { ehDono };
