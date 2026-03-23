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

Todos os endpoints seguem o padrao REST gerado pelo `DefaultRouter` do DRF. O prefixo base e `/api/v1/`.

| Metodo | URL | Descricao |
|--------|-----|-----------|
| GET | `/api/v1/commodities/` | Lista todas as commodities |
| POST | `/api/v1/commodities/` | Cria uma commodity |
| GET | `/api/v1/commodities/{id}/` | Detalhe de uma commodity |
| PUT/PATCH | `/api/v1/commodities/{id}/` | Atualiza uma commodity |
| DELETE | `/api/v1/commodities/{id}/` | Remove uma commodity |
| GET/POST | `/api/v1/meses_contrato_futuro/` | Lista / cria meses de contrato futuro |
| GET/PUT/PATCH/DELETE | `/api/v1/meses_contrato_futuro/{id}/` | Detalhe / atualiza / remove |
| GET/POST | `/api/v1/tipos_derivativo/` | Lista / cria tipos de derivativo |
| GET/PUT/PATCH/DELETE | `/api/v1/tipos_derivativo/{id}/` | Detalhe / atualiza / remove |
| GET/POST | `/api/v1/usuario/` | Lista / cria perfis de usuario |
| GET/PUT/PATCH/DELETE | `/api/v1/usuario/{id}/` | Detalhe / atualiza / remove |
| GET/POST | `/api/v1/cache_dados_mercado/` | Lista / cria registros de cache de preco |
| GET/PUT/PATCH/DELETE | `/api/v1/cache_dados_mercado/{id}/` | Detalhe / atualiza / remove |
| GET/POST | `/api/v1/solicitacao_analise/` | Lista / cria solicitacoes de analise |
| GET/PUT/PATCH/DELETE | `/api/v1/solicitacao_analise/{id}/` | Detalhe / atualiza / remove |
| GET/POST | `/api/v1/resultado_analise/` | Lista / cria resultados de analise |
| GET/PUT/PATCH/DELETE | `/api/v1/resultado_analise/{id}/` | Detalhe / atualiza / remove |

### Estrutura de URLs por app

Cada app registra seu proprio router e expoe `urlpatterns = router.urls`. O `core/urls.py` inclui cada app sob o prefixo `/api/v1/`.

### Observacoes sobre autorizacao

Os ViewSets usam `ModelViewSet` sem restricao de permissao configurada — qualquer requisicao autenticada ou anonima tem acesso completo. Antes de ir para producao, e obrigatorio configurar `permission_classes` e `authentication_classes` nos ViewSets ou globalmente em `settings.py` (via `DEFAULT_PERMISSION_CLASSES`).

### Typos nos nomes de modelos (pendente correcao futura)

| Local | Nome atual | Nome correto |
|-------|-----------|-------------|
| `commodities/models.py` | `Comomodity` | `Commodity` |
| `meses_contrato_futuro/models.py` | `MesContratoFurturo` | `MesContratoFuturo` |

A correcao requer nova migration e renomeacao coordenada de ViewSets e serializers. Nao foi feita automaticamente para evitar migrations nao solicitadas.
