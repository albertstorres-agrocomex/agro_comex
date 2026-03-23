// AgroComex - Modelo Fisico (3a Forma Normal)
// Formato: DBML (dbdiagram.io)

Table auth_user {
  id           serial       [pk]
  username     varchar(150) [not null, unique]
  email        varchar(254) [not null, default: '']
  password     varchar(128) [not null]
  first_name   varchar(150) [not null, default: '']
  last_name    varchar(150) [not null, default: '']
  is_active    boolean      [not null, default: true]
  is_staff     boolean      [not null, default: false]
  is_superuser boolean      [not null, default: false]
  date_joined  timestamp    [not null]
  last_login   timestamp
}

Table usuarios {
  id            bigserial  [pk]
  user_id       integer    [unique, ref: - auth_user.id]
  criado_em     timestamp  [not null, default: `now()`]
  atualizado_em timestamp  [not null]
}

Table commodities {
  id      bigserial    [pk]
  codigo  varchar(10)  [not null]
  nome    varchar(100) [not null]
  bolsa   varchar(20)  [not null]
  unidade varchar(30)  [not null]
  moeda   varchar(5)   [not null]
  ativo   boolean      [not null, default: true]
}

Table tipos_derivativo {
  id              bigserial   [pk]
  nome            varchar(50) [not null]
  rotulo          varchar(50) [not null]
  descricao       text
  requer_barreira boolean     [not null, default: false]
  requer_posicao  boolean     [not null, default: false]
}

Table meses_contrato_futuro {
  id              bigserial  [pk]
  commodity_id    bigint     [not null, ref: > commodities.id]
  codigo_mes      varchar(1) [not null]
  ano             smallint   [not null]
  data_vencimento date       [not null]
  ticket_completo varchar(20)
  ativo           boolean    [not null, default: true]

  indexes {
    (commodity_id, codigo_mes, ano) [unique]
  }
}

Table cache_dados_mercado {
  id               bigserial  [pk]
  commodity_id     bigint     [not null, ref: > commodities.id]
  data_preco       date       [not null]
  preco_fechamento integer    [not null]
  fonte            varchar(50)
  obtido_em        timestamp  [not null, default: `now()`]

  indexes {
    (commodity_id, data_preco, fonte) [unique]
  }
}

Table solicitacoes_analise {
  id                  bigserial   [pk]
  usuario_id          bigint      [not null, ref: > usuarios.id]
  commodity_id        bigint      [not null, ref: > commodities.id]
  tipo_derivativo_id  bigint      [not null, ref: > tipos_derivativo.id]
  mes_contrato_id     bigint      [ref: > meses_contrato_futuro.id]
  preco_mercado_atual integer     [not null]
  posicao             varchar(12)
  nivel_barreira      integer
  status              varchar(20) [not null, default: 'aguardanto']
  id_tarefa_worker    varchar(100)
  criado_em           timestamp   [not null, default: `now()`]
}

Table resultados_analise {
  id                     bigserial    [pk]
  solicitacao_id         bigint       [not null, ref: > solicitacoes_analise.id]
  nivel_acumulacao       integer
  volatilidade_utilizada numeric(8,6)
  taxa_juros_utilizada   numeric(8,6)
  dados_brutos           jsonb
  calculado_em           timestamp    [not null, default: `now()`]
}
