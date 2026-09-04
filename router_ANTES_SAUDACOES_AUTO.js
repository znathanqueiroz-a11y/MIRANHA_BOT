const handlers=[
require("./handlers/menu-grande"),
require("./handlers/saudacoes"),
require("./handlers/assistente"),
require("./handlers/eventoresp"),
require("./handlers/animador"),
require("./handlers/bn"),
require("./handlers/core"),
require("./handlers/admin"),
require("./handlers/metas"),
require("./handlers/controle"),
require("./handlers/grupo"),
require("./handlers/moderadores"),
require("./handlers/whitelist"),
require("./handlers/parcerias"),
require("./handlers/seguranca"),
require("./handlers/configuracoes"),
require("./handlers/autorespostas"),
require("./handlers/automsg"),
require("./handlers/roles"),
require("./handlers/social"),
require("./handlers/arena"),
require("./handlers/coletartudo"),
require("./handlers/economia"),
require("./handlers/sticker")
];

module.exports=async function router(ctx){
  for(const h of handlers){
    if(await h(ctx))return true;
  }
  return false;
};
