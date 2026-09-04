const { OWNER_NUMBER } = require("../data/dono-config");

function ehDono(numero) {
  if (!numero) return false;
  return numero.replace(/\D/g,"") === OWNER_NUMBER.replace(/\D/g,"");
}

function bloquearAcaoNoDono(alvo) {
  return ehDono(alvo);
}

module.exports = {
  ehDono,
  bloquearAcaoNoDono
};
