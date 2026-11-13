# Atendimento Virtual IXC

Projeto de integração entre o **Fortics IA** e o **IXCSoft**, com o objetivo de consultar os atendimentos vinculados a um cliente antes de iniciar um novo atendimento.

A lógica evita a abertura desnecessária de um novo chamado quando já existe um atendimento em andamento para o cliente. Quando há um chamado, o fluxo pode informar ao cliente o andamento; quando não há, segue para a abertura normal do atendimento.

## Objetivo

1. Consultar o cliente no IXCSoft e obter seu identificador (`cliente_id`).
2. Consultar os chamados vinculados ao identificador do cliente.
3. Verificar se a consulta retornou algum chamado.
4. Direcionar o fluxo conforme o resultado:
   - **Existe chamado:** informar o andamento ao cliente, incluindo o status atual, a interação do técnico e a ordem de serviço vinculada, conforme disponibilidade dessas informações.
   - **Não existe chamado:** prosseguir com a abertura normal do atendimento.

## Estrutura do projeto

Cada tipo de arquivo fica em uma pasta cujo nome corresponde à sua extensão:

```text
.
├── README.md
├── .drawio/
│   └── fluxo-atendimento-virtual-ixc.drawio
├── .js/
│   ├── consultar-id-cliente.js
│   └── validar-ticket-cliente.js
├── .json/
│   └── su_ticket.json
└── .txt/
    └── anotacoes_tecnicas.txt
```

> Os nomes das pastas seguem a extensão dos arquivos (`.drawio`, `.js`, `.json` e `.txt`). O `README.md` permanece na raiz para facilitar a apresentação e a documentação do projeto.

## Componentes

### 1. Diagrama do fluxo — `.drawio/fluxo-atendimento-virtual-ixc.drawio`

Diagrama editável no [diagrams.net (draw.io)](https://app.diagrams.net/).

Representa as seguintes etapas:

- Início do atendimento virtual.
- Consulta do cliente para obter o ID no IXC.
- Consulta dos atendimentos do cliente.
- Decisão sobre a existência de atendimento em aberto.
- Se **Sim**: informar o andamento ao cliente.
- Se **Não**: abrir o atendimento normalmente.
- Encerramento do fluxo.

O diagrama identifica os status considerados no processo como **Novo, Pendente ou Em progresso**.

### 2. Consulta do ID do cliente — `.js/consultar-id-cliente.js`

Responsável por extrair o identificador do cliente a partir do retorno da consulta ao IXCSoft.

O script:

- Procura o retorno em `_vars.route_return`.
- Caso não encontre, procura `route_return` dentro dos objetos disponíveis em `_vars`.
- Como alternativa, verifica `_vars["consulta-cliente"]`.
- Converte o retorno de JSON em texto para objeto, quando necessário.
- Obtém o valor de `registros[0].id`.
- Retorna o identificador como texto no formato:

```javascript
{
  cliente_id: "123"
}
```

O valor `"123"` é apenas ilustrativo. O ID efetivo vem da resposta da integração.

**Erros tratados:** o script lança um erro se não localizar o retorno da consulta ou se o retorno não contiver `registros[0].id`. Um JSON inválido também causará erro durante a conversão.

### 3. Validação dos chamados — `.js/validar-ticket-cliente.js`

Responsável por verificar a quantidade de chamados retornados pela variável `_vars["atendimentos-cliente"]`.

O script:

1. Recupera os dados da variável `atendimentos-cliente`.
2. Converte o conteúdo de texto JSON em objeto, quando necessário.
3. Se existir `var_value`, utiliza esse conteúdo e também o converte quando necessário.
4. Lê o campo `total` e o converte para número.
5. Considera que existe chamado quando `total` é maior que zero.

Retorna três propriedades:

| Propriedade | Tipo | Descrição |
|---|---|---|
| `quantidade` | `number` | Quantidade de registros retornada em `total`. |
| `existe_registro` | `boolean` | `true` quando a quantidade é maior que zero. |
| `resultado` | `string` | `"SIM"` quando existe registro ou `"NAO"` quando não existe. |

Exemplo ilustrativo:

```javascript
{
  quantidade: 2,
  existe_registro: true,
  resultado: "SIM"
}
```

O resultado textual pode ser utilizado em condicionais e em outros componentes do Workflow do Fortics IA.

**Atenção:** o script espera encontrar os dados em `_vars["atendimentos-cliente"]`. O nome da variável configurada no workflow deve corresponder a esse identificador. Se o retorno não for um JSON válido, a conversão lançará um erro.

### 4. Parâmetros da consulta de chamados — `.json/su_ticket.json`

Define os parâmetros enviados para a consulta de chamados no IXCSoft.

| Campo | Finalidade |
|---|---|
| `qtype` | Campo utilizado na pesquisa: `su_ticket.id_cliente`. |
| `query` | ID do cliente recebido por `{{id-cliente.cliente_id}}`. |
| `oper` | Operador de comparação (`=`). |
| `rp` | Quantidade máxima solicitada (`1000`). |
| `sortname` | Campo de ordenação: `su_ticket.id`. |
| `sortorder` | Ordem crescente (`asc`). |
| `grid_param` | Filtros adicionais aplicados ao campo `su_ticket.su_status`. |

O `grid_param` contém duas condições de exclusão: status `S` e status `C`.

O arquivo utiliza a variável de workflow `{{id-cliente.cliente_id}}`, portanto a etapa que extrai o ID do cliente deve ser executada antes dessa consulta.

### 5. Anotações técnicas — `.txt/anotacoes_tecnicas.txt`

Reúne informações de referência sobre os atributos e o endpoint do IXCSoft.

Atributos documentados:

- `id_cliente`: ID vinculado ao cliente no IXC Provedor.
- `id_assunto`: assunto vinculado ao atendimento.
- `id_ticket_setor`: departamento onde o atendimento está localizado.

Endpoint registrado nas anotações:

- **Método:** `GET`
- **Recurso:** `/webservice/v1/su_ticket`
- **URL anotada:** `https://seudominio/webservice/v1/su_ticket`

`seudominio` é um valor ilustrativo e deve ser substituído pelo domínio real da instalação do IXCSoft na configuração da integração.

## Dependências e configurações

Para utilizar os componentes no workflow, configure:

- A integração com o IXCSoft no Fortics IA.
- A consulta de cliente, disponibilizando o retorno em uma das estruturas reconhecidas por `consultar-id-cliente.js`.
- A etapa de extração do ID, com saída `cliente_id`.
- A consulta de chamados usando os parâmetros de `.json/su_ticket.json`.
- A disponibilização do retorno da consulta na variável `atendimentos-cliente`, esperada por `validar-ticket-cliente.js`.
- A condicional baseada no resultado da validação (`SIM` ou `NAO`).

A URL, as credenciais, os cabeçalhos e demais detalhes de autenticação da integração devem ser definidos conforme o ambiente. Esses dados não estão especificados nos arquivos deste projeto e não devem ser incluídos diretamente no repositório.

## Sequência de execução

```text
Início
  |
  v
Consultar cliente no IXCSoft
  |
  v
Extrair cliente_id
  |
  v
Consultar chamados em su_ticket
  |
  v
Validar quantidade de chamados (total)
  |
  v
Existe chamado?
  | Sim                  | Não
  v                      v
Informar andamento       Abrir atendimento
ao cliente               normalmente
  |                      |
  +----------+-----------+
             v
            Fim
```

## Observações importantes

- O diagrama descreve os status como **Novo, Pendente ou Em progresso**. Já o JSON aplica filtros que excluem os códigos `S` e `C`. Os arquivos fornecidos não apresentam a correspondência entre esses códigos e os nomes dos status; confirme essa relação na configuração/documentação do IXCSoft antes de alterar os filtros.
- O script `validar-ticket-cliente.js` utiliza o campo `total` como quantidade de chamados. A resposta da integração deve disponibilizar esse campo no nível esperado pelo script ou dentro de `var_value`.
- O diagrama menciona status, interação do técnico e ordem de serviço como informações a apresentar ao cliente. Os arquivos fornecidos não incluem uma rotina específica para extrair ou formatar esses três dados; essa etapa depende dos dados disponibilizados pela consulta e da configuração complementar do workflow.
- O endpoint e o domínio devem ser ajustados para cada ambiente.
- Não armazene tokens, senhas ou credenciais no código ou nos arquivos versionados.

## Manutenção

Ao modificar o projeto:

1. Atualize o diagrama `.drawio` quando a sequência ou as decisões do workflow mudarem.
2. Mantenha os nomes das variáveis do Fortics IA alinhados entre as consultas e os scripts.
3. Revise os parâmetros de `su_ticket.json` quando os critérios de busca ou os filtros de status forem alterados.
4. Atualize este README sempre que um componente, parâmetro ou comportamento for adicionado ou removido.
