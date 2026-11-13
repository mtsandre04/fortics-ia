/*
 * Verifica a quantidade de chamados retornados pela integração IXCSoft.
 
 * Recupera os dados da variável `atendimentos-cliente`, interpreta o retorno
 * quando disponibilizado como texto JSON e identifica o conteúdo de `var_value`,
 * caso exista.
 
 * Utiliza o campo `total` retornado pelo IXCSoft para determinar a quantidade
 * de registros encontrados e verificar se existe pelo menos um chamado.
 
 * Retorna a quantidade de registros, um indicador booleano de existência
 * e um resultado textual (SIM ou NAO), permitindo sua utilização em
 * condicionais e outros componentes do Workflow do Fortics IA.
 
 * @returns {{ quantidade: number, existe_registro: boolean, resultado: string }}
 * Quantidade de registros e indicador de existência de chamados.
 * @throws {Error} Caso o retorno contenha um JSON inválido.
 */


// Recupera o retorno da integração IXCSoft
let dados = _vars["atendimentos-cliente"];

// Converte JSON em objeto, se necessário
if (typeof dados === "string") {
    dados = JSON.parse(dados);
}

// Recupera o conteúdo de var_value
if (dados && dados.var_value !== undefined) {
    dados = dados.var_value;

    if (typeof dados === "string") {
        dados = JSON.parse(dados);
    }
}

// Converte o total para número
let quantidade = Number(dados.total || 0);

// Verifica se existem registros
let existe_registro = quantidade > 0;

// Retorna os resultados
return {
    quantidade: quantidade,
    existe_registro: existe_registro,
    resultado: existe_registro ? "SIM" : "NAO"
};
