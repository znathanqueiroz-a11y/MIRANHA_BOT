const comandos = {
  administracao: [
    "ban","promover","rebaixar","mute","desmute","mutados",
    "adv","rmadv","listadv","limparrank","mantercontador",
    "atividade","checkativo","getpp"
  ],

  metas: [
    "setdiario","setsemanal","vermetas"
  ],

  controle: [
    "blockuser","unblockuser","listblockuser",
    "blockcmdgp","unblockcmdgp","listblocksgp",
    "addblacklist","delblacklist","listblacklist",
    "blockcmd","unblockcmd"
  ],

  grupo: [
    "del","limpar","marcar","hidetag","sorteio",
    "nomegp","descgrupo","linkgp","grupo",
    "solicitacoes","aprovar","recusarsolic",
    "role.criar","role.alterar","role.excluir","role.lista","role.dar","role.remover",
    "eventos"
  ],

  moderadores: [
    "addmod","delmod","listmods",
    "grantmodcmd","revokemodcmd","listmodcmds"
  ],

  whitelist: [
    "wladd","wl.remove","wl.lista"
  ],

  parcerias: [
    "parcerias","addparceria","delparceria"
  ],

  seguranca: [
    "antilink","antiinvite","antiflood","antipalavra",
    "anticlique","antiaudio","antifig","antiloc","antitoxic"
  ],

  configuracoes: [
    "legendabv","legendaentrada","legendasaiu","legendasimples",
    "fotobv","set-fotobv","set-bannerbv","rmfotobv","fotosaiu","rmfotosaiu","setprefix"
  ],

  auto_respostas: [
    "addautoadm","listautoadm","delautoadm","autorespostas","automsg"
  ],

  modos: [
    "bemvindo","saida"
  ],
  bn: [
    "modobn","menubn",
    "abraco","cafune","highfive","acenar",
    "dancar","sorrir","rir","feliz","chorar","joinha",
    "tapa","soco","chute","bonk","cutucar","morder",
    "cocegas","duelo","nocaute","jogar","assustar","fugir",
    "carregar","apertodemao","cumprimentar","comemorar",
    "provocar","vergonha","constrangido","animar",
    "apoiar","consolar"
  ],
  assistente: [
    "assistente","explicar","resumir","corrigir","traduzir",
    "ideias","definir","calcular","reformular","continuar",
    "gerarpergunta","limparia"
  ],
  saudacoes: [
    "dia","tarde","noite","madrugada"
  ],




  social: [
    "casal","amor","amizade","crush","ship","match",
    "porcentagem","compatibilidade","quimica","afinidade",
    "personalidade","humor","popularidade","sorte",
    "mensagem","previsao","destino","energia",
    "zoeira","fofo","estilo","detetive"
  ],

  sticker: [
    "sticker","s","fig","toimg"
  ],

  arena: [
    "dado","quiz","quizresp","8ball","jokenpo",
    "desafio","verdade","eununca","moeda","pergunta"
  ],

  eventos: [
    "evento","pegar","desafiododia","caixadogrupo",
    "caixa","roleta","premiosurpresa",
    "eventoresp"
  ],

  economia: [
    "saldo","trabalhar","diario","pescar","minerar",
    "missao","coletar","tesouro","entregar","cozinhar",
    "fotografar","programar","reciclar","fazenda",
    "explorar","premio","caixamisteriosa","perfil",
    "rank","rankxp","xp","level","transferir",
    "loja","comprar","inventario","vender","bonus",
    "coletartudo"
  ],

  core: [
    "menu","ping","info","uptime","statusbot","dono",
    "menuadm",
    "menugrupo",
    "menuassistente",
    "menueconomia",
    "menuarena",
    "menubn",
    "menusocial",
    "menunpc",
    "menusticker",
    "menuconfig",
    "menurank",
    "menusistema",
    "menutodos"
  ]
};

module.exports = comandos;
