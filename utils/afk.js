const fs = require("fs");

const arquivo = "./data/afk.json";

function ler(){
    if(!fs.existsSync(arquivo)){
        fs.writeFileSync(arquivo,"{}");
    }

    return JSON.parse(fs.readFileSync(arquivo));
}

function salvar(dados){
    fs.writeFileSync(
        arquivo,
        JSON.stringify(dados,null,2)
    );
}

function ativar(id,motivo){

    let dados = ler();

    dados[id]={
        motivo: motivo || "Não informado",
        hora: Date.now(),
        data: new Date().toLocaleString("pt-BR")
    };

    salvar(dados);

    return dados[id];
}


function verificarRetorno(id){

    let dados = ler();

    if(!dados[id]) return null;

    const registro = dados[id];

    registro.tempo = Date.now() - registro.hora;

    delete dados[id];

    salvar(dados);

    return registro;
}


function buscarAFK(texto){

    let dados = ler();

    for(const id in dados){

        const numero=id.split("@")[0];

        if(texto.includes(numero) || texto.includes("@"+numero)){

            return {
                id:id,
                ...dados[id]
            };
        }
    }

    return null;
}


// compatibilidade com versões anteriores
module.exports={
    ativar,
    verificarRetorno,
    buscarAFK,
    procurar: buscarAFK,
    retornar: verificarRetorno
};
