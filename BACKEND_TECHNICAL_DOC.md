# Backend Technical Doc — AgroComex

## Visão Geral

- **Diretório:** `backend/`
- **Deploy:** Render
- **URL produção:** —

## Stack

- Python + Django Rest Framework
- Celery (worker assíncrono)
- Redis (broker Celery + cache de resultados)
- PostgreSQL (banco de dados principal)
- Deploy: Render

## Modelo de Dados — Apps e Responsabilidades

### `commodities`
Catálogo de ativos negociáveis (Soja, Milho, Café, Açúcar). Cada commodity define a bolsa de referência, unidade e moeda. MVP usa CBOT como bolsa principal para Soja e Milho; ICE para Café e Açúcar.

### `meses_contrato_futuro`
Catálogo de contratos futuros disponíveis por commodity. Governa quais vencimentos o usuário pode selecionar na UI — cada commodity tem meses válidos específicos (ex: Soja negocia em Jan/Mar/Mai/Jul/Ago/Set/Nov na CBOT). O campo `ticket_completo` é o identificador usado para consulta de preço em API externa.

### `tipos_derivativo`
Catálogo de estruturas financeiras que o sistema consegue precificar. Não é calculado pelo worker — **instrui** o worker sobre qual modelo matemático aplicar e quais parâmetros esperar na solicitação.

| Campo | Papel |
|-------|-------|
| `nome` | Identificador técnico usado pelo worker para selecionar a fórmula (ex: `call`, `put`, `knock_out`) |
| `rotulo` | Label de exibição na UI |
| `requer_barreira` | Indica que o tipo usa cláusula de barreira (ex: knock-out, knock-in) |
| `requer_posicao` | Indica que o tipo deve especificar lado do contrato (comprador ou vendedor da commodity) |

### `usuario`
Perfil de usuário da aplicação, estendendo `auth.User` do Django via `OneToOneField`. `primeiro_nome` e `sobrenome` são lidos diretamente de `auth_user`.

### `dados`
Cache local de preços de fechamento para cálculo de volatilidade histórica. Possível remoção futura, substituída por consulta direta à API de mercado.

### `analises`
Núcleo do sistema. Gerencia o ciclo completo de precificação:
- `SolicitacaoAnalise`: recebe os parâmetros do usuário e enfileira a tarefa no Celery
- `ResultadoAnalise`: armazena os dados calculados pelo worker (volatilidade, taxa de juros, grade de preços em `dados_brutos`)

---

## Regras de Negócio e Validação

### Validação de campos condicionais em `SolicitacaoAnalise`

Os campos `nivel_barreira` e `posicao` são opcionais no banco mas **obrigatórios em nível de aplicação** dependendo do tipo de derivativo selecionado:

| Condição | Campo obrigatório |
|----------|------------------|
| `tipo_derivativo.requer_barreira = true` | `nivel_barreira` deve ser preenchido |
| `tipo_derivativo.requer_posicao = true` | `posicao` deve ser preenchida (`comprado` ou `vendido`) |

**Esta validação não é garantida pelo banco de dados.** Deve ser implementada:
1. No serializer DRF de `SolicitacaoAnalise` (validação na entrada da API)
2. No worker Celery antes de iniciar o cálculo (validação defensiva)

Falhar em validar esses campos resulta em erro de precificação silencioso ou resultado incorreto.

---

## Endpoints

- A definir
