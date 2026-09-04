const loja = require("./loja");

function categoriaDoId(id){
  const n=Number(id);

  if(n>=11 && n<=20) return "tecnologia";
  if(n>=21 && n<=30) return "veiculos";
  if(n>=31 && n<=40) return "luxo";
  if(n>=41 && n<=70) return "miranha";

  return null;
}

function percentualPorPreco(preco){
  preco=Number(preco||0);

  if(preco < 3000) return 0;
  if(preco < 8000000) return 10;
  if(preco < 15000000) return 20;
  if(preco < 25000000) return 30;
  if(preco < 50000000) return 40;
  if(preco < 75000000) return 50;
  if(preco < 100000000) return 60;
  if(preco < 250000000) return 70;

  return 80;
}

const bonus={};

for(const [id,item] of Object.entries(loja)){
  const nome=item[0];
  const preco=Number(item[1]||0);
  const emoji=item[2]||"📦";

  const categoria=categoriaDoId(id);
  const percent=percentualPorPreco(preco);

  if(!categoria || percent<=0) continue;

  bonus[id]={
    categoria,
    percent,
    label:`${emoji} ${nome} +${percent}% nos ganhos`
  };
}

const limitesCategoria={
  tecnologia:100,
  veiculos:200,
  luxo:250,
  miranha:400
};

const LIMITE_TOTAL=400;

function calcularBonus(perfil={}){
  const inventario=perfil.inventario||{};
  const categorias={};
  const ativos=[];

  for(const [id,qtd] of Object.entries(inventario)){
    if(Number(qtd||0)<1) continue;

    const b=bonus[id];
    if(!b) continue;

    if(!categorias[b.categoria]){
      categorias[b.categoria]={
        bruto:0,
        total:0,
        itens:[]
      };
    }

    const cat=categorias[b.categoria];

    cat.bruto+=Number(b.percent||0);
    cat.itens.push({
      id:String(id),
      ...b
    });

    ativos.push({
      id:String(id),
      ...b
    });
  }

  for(const [cat,dados] of Object.entries(categorias)){
    dados.total=Math.min(
      limitesCategoria[cat] ?? 999,
      dados.bruto
    );
  }

  const bruto=Object.values(categorias)
    .reduce((s,c)=>s+Number(c.bruto||0),0);

  const limitadoCategorias=Object.values(categorias)
    .reduce((s,c)=>s+Number(c.total||0),0);

  const total=Math.min(
    LIMITE_TOTAL,
    limitadoCategorias
  );

  return {
    total,
    bruto,
    limitadoCategorias,
    categorias,
    ativos,
    limitesCategoria,
    limiteTotal:LIMITE_TOTAL
  };
}

function aplicarBonus(valor,perfil={}){
  const {total}=calcularBonus(perfil);

  const base=Number(valor||0);
  const bonusValor=Math.floor(base*(total/100));

  return {
    base,
    bonusValor,
    total,
    final:base+bonusValor
  };
}

module.exports={
  bonus,
  limitesCategoria,
  LIMITE_TOTAL,
  calcularBonus,
  aplicarBonus,
  percentualPorPreco
};
