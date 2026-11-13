/*
 * Extrai o ID do cliente a partir do retorno de uma consulta realizada no IXCSoft.

 * Localiza os dados da consulta em diferentes estruturas disponíveis em `_vars`,
 * interpreta o retorno quando necessário e obtém o ID do primeiro registro.

 * @returns {{ cliente_id: string }} ID do cliente convertido para string.
 * @throws {Error} Caso o retorno da consulta não seja localizado ou não contenha o ID do cliente.
 */

const variaveis = _vars || {};

let resposta = variaveis.route_return;

// Se route_return estiver dentro da saída de algum componente, procura esse campo.
if (resposta == null) {
  for (const valor of Object.values(variaveis)) {
    if (valor && typeof valor === "object" && valor.route_return != null) {
      resposta = valor.route_return;
      break;
    }
  }
}

// Algumas integrações podem disponibilizar o retorno diretamente pelo nome do componente.
if (resposta == null && variaveis["consulta-cliente"] != null) {
  resposta = variaveis["consulta-cliente"];
}

if (resposta == null) {
  throw new Error("Não foi possível localizar o retorno da consulta do IXCSoft em _vars.");
}

const retorno = typeof resposta === "string"
  ? JSON.parse(resposta)
  : resposta;

const cliente_id = retorno?.registros?.[0]?.id ?? null;

if (cliente_id == null) {
  throw new Error("O retorno do IXCSoft não contém registros[0].id.");
}

return {
  cliente_id: String(cliente_id)
};
