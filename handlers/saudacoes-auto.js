const db=require("../lib/db");

const TZ="America/Sao_Paulo";
const timers=new Map();

const frases={
  madrugada:[
    "🌑 Boa madrugada, pessoal! Quem ainda está acordado por aí? 🕷️✨",
    "🌙 Madrugada chegou! Que seja tranquila para todo mundo que ainda está online. 🕷️",
    "🌌 Boa madrugada, grupo! Hora dos sobreviventes da noite aparecerem 😄",
    "🌑 Passando para desejar uma ótima madrugada para quem ainda está por aqui. 🕷️❤️",
    "✨ Boa madrugada! Que a noite termine bem e o novo dia comece melhor ainda.",
    "🕷️ Madrugada no grupo! Quem está acordado manda um 👀",
    "🌙 Boa madrugada, galera! Aproveitem a paz desse horário.",
    "🌌 O grupo ainda está vivo? Boa madrugada para todo mundo! 😄"
  ],
  dia:[
    "🌅 Bom dia, pessoal! Que hoje seja um dia leve e cheio de coisas boas. 🕷️❤️",
    "☀️ Bom dia, grupo! Bora começar o dia com energia boa. ✨",
    "🌞 Um ótimo dia para todo mundo! Que dê tudo certo por aí. 🕷️",
    "🌅 Bom dia! Que não falte café, disposição e motivos para sorrir. ☕😄",
    "☀️ Bom dia, galera! Como vocês estão começando o dia hoje?",
    "🕷️ Miranha passando para desejar um excelente dia para o grupo! ❤️",
    "🌤️ Bom dia! Que hoje renda bastante e ainda sobre tempo para descansar.",
    "✨ Dia novo, grupo! Que venha coisa boa por aí. Bom dia!"
  ],
  tarde:[
    "🌤️ Boa tarde, pessoal! Que o restante do dia seja tranquilo. 🕷️✨",
    "☀️ Boa tarde, grupo! Como está indo o dia de vocês?",
    "🌇 Passando para desejar uma ótima tarde para todo mundo. ❤️",
    "🕷️ Boa tarde, galera! Bora manter o grupo animado. 😄",
    "🌤️ Uma excelente tarde para vocês! Que tudo continue dando certo.",
    "☕ Boa tarde! Hora de recuperar as energias e seguir o dia. ✨",
    "🌞 Boa tarde, grupo! Espero que o dia esteja sendo bom por aí.",
    "❤️ Miranha deseja uma ótima tarde para toda a galera do grupo!"
  ],
  noite:[
    "🌙 Boa noite, pessoal! Que a noite de vocês seja tranquila. 🕷️💙",
    "✨ Boa noite, grupo! Como foi o dia de vocês?",
    "🌃 Passando para desejar uma excelente noite para todo mundo. ❤️",
    "🕷️ Boa noite, galera! Hora de relaxar um pouco depois do dia.",
    "🌙 Que a noite seja leve e agradável para todos vocês. ✨",
    "🌌 Boa noite, grupo! Quem ainda está com energia para conversar? 😄",
    "💙 Miranha passando para desejar uma ótima noite para geral!",
    "🌃 Boa noite! Que amanhã venha ainda melhor."
  ]
};

function aleatorio(arr){
  return arr[Math.floor(Math.random()*arr.length)];
}

function partesAgora(){
  const fmt=new Intl.DateTimeFormat("en-CA",{
    timeZone:TZ,
    year:"numeric",
    month:"2-digit",
    day:"2-digit",
    hour:"2-digit",
    minute:"2-digit",
    second:"2-digit",
    hourCycle:"h23"
  });

  const obj={};
  for(const p of fmt.formatToParts(new Date())){
    if(p.type!=="literal")obj[p.type]=p.value;
  }

  return {
    data:`${obj.year}-${obj.month}-${obj.day}`,
    h:Number(obj.hour),
    m:Number(obj.minute),
    s:Number(obj.second)
  };
}

function periodoAtual(){
  const t=partesAgora();

  if(t.h<6)return {...t,nome:"madrugada",fim:6};
  if(t.h<12)return {...t,nome:"dia",fim:12};
  if(t.h<18)return {...t,nome:"tarde",fim:18};
  return {...t,nome:"noite",fim:24};
}

function ler(){
  const d=db.ler("saudacoes-auto",{grupos:{}});
  d.grupos=d.grupos||{};
  return d;
}

function salvar(d){
  db.salvar("saudacoes-auto",d);
}

function chavePeriodo(p){
  return `${p.data}:${p.nome}`;
}

function segundosRestantes(p){
  const agora=p.h*3600+p.m*60+p.s;
  const fim=p.fim*3600;
  return Math.max(1,fim-agora);
}

function limparTimer(jid){
  const antigo=timers.get(jid);
  if(antigo)clearTimeout(antigo);
  timers.delete(jid);
}

function agendar(sock,jid){
  limparTimer(jid);

  const p=periodoAtual();
  const chave=chavePeriodo(p);
  const d=ler();
  const g=d.grupos[jid]||(d.grupos[jid]={});

  // Se já saudou neste período, agenda nova checagem perto do próximo período.
  if(g.ultima===chave){
    const ms=Math.max(30000,(segundosRestantes(p)+5)*1000);
    timers.set(jid,setTimeout(()=>agendar(sock,jid),ms));
    return;
  }

  const restante=segundosRestantes(p);

  // Escolhe um momento aleatório dentro do que resta do período.
  // Nunca dispara em loop imediato.
  const minimo=30;
  const maximo=Math.max(minimo,restante-30);
  const atrasoSeg=maximo<=minimo
    ? minimo
    : Math.floor(Math.random()*(maximo-minimo+1))+minimo;

  timers.set(jid,setTimeout(async()=>{
    try{
      const atual=periodoAtual();
      const chaveAtual=chavePeriodo(atual);

      // Se o horário mudou antes do disparo, reagenda para o novo período.
      if(chaveAtual!==chave){
        agendar(sock,jid);
        return;
      }

      const estado=ler();
      const grupo=estado.grupos[jid]||(estado.grupos[jid]={});

      if(grupo.ultima===chaveAtual){
        agendar(sock,jid);
        return;
      }

      const texto=aleatorio(frases[atual.nome]||frases.dia);

      await sock.sendMessage(jid,{text:texto});

      grupo.ultima=chaveAtual;
      grupo.ultimoEnvio=Date.now();
      grupo.periodo=atual.nome;
      salvar(estado);

    }catch(e){
      console.log("⚠️ Saudação automática:",e.message);
    }finally{
      agendar(sock,jid);
    }
  },atrasoSeg*1000));
}

module.exports=async function saudacoesAuto(ctx){
  if(!ctx.isGroup)return false;

  if(!timers.has(ctx.jid)){
    agendar(ctx.sock,ctx.jid);
  }

  return false;
};

