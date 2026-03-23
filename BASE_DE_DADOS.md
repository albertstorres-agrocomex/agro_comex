# BASE DE DADOS — AgroComex

Documento de referencia tecnica sobre as fontes de dados oficiais utilizadas pelo sistema AgroComex, seus metodos de acesso programatico e estrategias de consumo.

---

## 1. Fontes oficiais

### 1.1 BCB — Banco Central do Brasil

**URL:** https://www.bcb.gov.br / https://dadosabertos.bcb.gov.br

**Status de API:** Completa e documentada

O BCB oferece duas superficies de acesso:

#### SGS — Sistema Gerenciador de Series Temporais

Mais de 18.000 series historicas de indicadores economicos e financeiros. Acesso via REST sem autenticacao.

Formato de endpoint:
```
GET https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados?formato=json
```

Parametros opcionais: `dataInicial` (dd/MM/yyyy), `dataFinal` (dd/MM/yyyy).

Exemplos de series relevantes para o AgroComex:

| Codigo | Serie |
|--------|-------|
| 1 | Taxa SELIC |
| 433 | IPCA |
| 10813 | Dolar comercial — venda diaria |
| 21619 | Euro — venda diaria |

Biblioteca Python recomendada:
```python
pip install python-bcb

from bcb import sgs
df = sgs.get({'IPCA': 433, 'Dolar': 10813}, start='2020-01-01')
```

#### Portal de Dados Abertos (CKAN)

627 datasets acessiveis via CKAN API, incluindo dados do SFN, PIX, operacoes de credito e balancas de pagamento.

```
GET https://dadosabertos.bcb.gov.br/api/3/action/package_list
GET https://dadosabertos.bcb.gov.br/api/3/action/package_show?id={id}
```

Formatos disponiveis: JSON, CSV, OData, HTML.

---

### 1.2 CONAB — Companhia Nacional de Abastecimento

**URL:** https://portaldeinformacoes.conab.gov.br

**Status de API:** Sem API REST documentada; dados disponiveis via download de arquivos e endpoints Pentaho nao oficiais

#### Download direto de arquivos

Pagina de downloads: https://portaldeinformacoes.conab.gov.br/download-arquivos.html

Arquivos disponibilizados em `.txt` (delimitado) e `.xls`, organizados por categoria:

| Categoria | Datasets |
|-----------|----------|
| Producao Agricola | Estimativas de graos, cafe, cana; series historicas |
| Mercado | Precos minimos, precos agropecuarios mensais/semanais por UF e municipio |
| Abastecimento | Estoques publicos, operacoes de comercializacao |
| Armazenamento e Logistica | Capacidade estatica, fretes |
| Agricultura Familiar | Programa Alimenta Brasil — entregas e propostas |
| PROHORT | Precos diarios e mensais de hortifruti |

#### Endpoints Pentaho (nao documentados oficialmente)

O portal de dashboards da CONAB expoe endpoints que retornam dados estruturados. Esses endpoints nao possuem documentacao oficial e podem ser descontinuados sem aviso.

Padrão de URL:
```
https://pentahoportaldeinformacoes.conab.gov.br/pentaho/api/repos/:home:{modulo}:{dataset}.wcdf/generatedContent?userid=pentaho&password=password
```

Exemplos:
```
# Evolucao de estimativas de safra
/pentaho/api/repos/:home:SIMASA2:EvolucaoEstimativas.wcdf/generatedContent

# Serie historica de cana-de-acucar
/pentaho/api/repos/:home:SIMASA2:Cana:SerieHistorica:SerieHistorica.wcdf/generatedContent

# Precos diarios PROHORT
/pentaho/api/repos/:home:PROHORT:precoDia.wcdf/generatedContent

# Relacao de troca
/pentaho/api/repos/:home:SIAGRO:RelacaoTroca.wcdf/generatedContent
```

**Aviso:** credenciais `pentaho/password` sao publicas mas sem suporte oficial. Usar apenas como fallback ou para prototipacao.

#### Cadastro e acesso

A CONAB nao esta no escopo do Decreto 8.777/2016 (Politica de Dados Abertos do Executivo Federal). Para acesso a sistemas que exigem autenticacao (ex: SICAN), e necessario cadastro — ver secao 3.

---

### 1.3 MAPA — Ministerio da Agricultura / Agrostat

**URL:** https://mapa-indicadores.agricultura.gov.br / https://dados.agricultura.gov.br

**Status de API:** Acesso publico sem cadastro; dados servidos via Qlik Sense Engine API (WebSocket)

#### Agrostat Brasil

Sistema de Estatisticas de Comercio Exterior do Agronegocio. Cobre exportacoes e importacoes do agronegocio brasileiro desde janeiro de 1997.

**Acesso publico, sem cadastro:**
https://mapa-indicadores.agricultura.gov.br/publico/extensions/Agrostat/Agrostat.html

Dados atualizados ate fevereiro de 2026 (atualizacao mensal).

Dimensoes de consulta disponíveis:
- Exportacao e importacao (abas separadas)
- Tabela de agrupamentos por produto, setor, subsetor e NCM
- Paises, blocos e areas geograficas de origem/destino
- Estados brasileiros e regioes geograficas
- Valor (US$) e peso (kg)
- Periodos mensais e anuais

#### Arquitetura tecnica do Agrostat (resultado de engenharia reversa)

O portal roda em **Qlik Sense Enterprise on-premises** (versao `8.423.17`). Todos os dados trafegam via **WebSocket** usando o protocolo Qlik Engine JSON API — nao ha REST HTTP simples acessivel externamente.

**Parametros de conexao:**

| Parametro | Valor |
|-----------|-------|
| Host | `mapa-indicadores.agricultura.gov.br` |
| Virtual proxy | `/publico/` |
| App ID | `348ee889-65ed-4f7c-b3e6-ad5d42552a17` |
| WebSocket URI | `wss://mapa-indicadores.agricultura.gov.br/publico/app/348ee889-65ed-4f7c-b3e6-ad5d42552a17` |
| Token de sessao | `GET /publico/qps/csrftoken?xrfkey={16chars}` |

**Objetos mapeados por aba:**

*Aba: Indicadores Gerais*

| Elemento | Object ID | Exportavel |
|----------|-----------|-----------|
| GRAFICO-1-1 (exportacoes por mercado) | `cf1fbb42-fa76-456c-b835-d42412a1a234` | Sim |
| GRAFICO-1-2 (exportacoes por UF) | `a0dc7392-1f5b-459c-b431-bb2b7682caf4` | Sim |
| GRAFICO-1-3 (exportacoes por setor) | `78a21f06-c296-4429-a71c-7e7e4783745d` | Sim |
| GRAFICO-1-4 (balanca comercial historica) | `aa6b3943-9aae-46d1-a7fb-5d1568d2e547` | Sim |
| GRAFICO-1-5 (exportacoes mensais 5 anos) | `13a42817-aae9-41cf-bb48-e0cc8e26751d` | Sim |

*Aba: Exportacao / Importacao*

| Elemento | Object ID | Exportavel |
|----------|-----------|-----------|
| MAPA-2-1 (mapa geografico) | `NPpryp` | Nao |
| KPI-2-1 (valor total exportado) | `fPenkm` | Nao |
| KPI-2-1-1 (variacao) | `GdrPPT` | Nao |
| GRAFICO-2-2-1 (serie por filtro) | `XTKgmLa` | Sim |
| GRAFICO-2-3-1 | id interno | Sim |
| GRAFICO-2-4-1 | id interno | Sim |
| GRAFICO-2-5-1 | id interno | Sim |
| GRAFICO-2-6-1 | id interno | Sim |
| GRAFICO-2-7-1 | `DJBEjph` | Sim |
| Filtros (periodo, pais, setor, UF, produto) | `SZWpNYj`, `UDXZLfU`, `mEJWW`, `WCBhm`, `JZPJbC` | — |

*Aba: Tabela de Agrupamentos*

| Elemento | Object ID | Exportavel |
|----------|-----------|-----------|
| GRAFICO-3-1 (tabela principal) | `LKdGv` | Sim |
| FILTRO-3-1 | `xZZjS` | — |

**Mecanismo de export verificado em laboratorio:**

O clique nos botoes "Exportar dados" (`#tabela-{id}`) dispara `qlik.table(obj).exportData({download: true})`, que:
1. Solicita ao Engine via WebSocket a geracao de um arquivo temporario
2. Recebe uma URL `/publico/tempcontent/{guid}.xlsx`
3. Inicia o download do XLSX no browser

O download de XLSX foi confirmado funcionando via automacao Playwright.

**Endpoints REST — status:**

| Endpoint | Resultado |
|----------|-----------|
| `POST /publico/api/v1/apps/{appId}/objects/{objectId}/data/export` | 403 Forbidden |
| `GET /publico/qrs/app/{appId}` | 302 → redirect para login |
| `GET /publico/api/v1/apps/{appId}` | 500 Internal Server Error |
| WebSocket sem header `x-qlik-xrfkey` (browser) | 403 Forbidden |
| WebSocket com header `x-qlik-xrfkey` (Python) | **a validar** |

#### Estrategias de acesso programatico para o backend

##### Opcao A — Playwright (mais rapida de implementar, garantida)

Usa automacao de browser. A pagina carrega normalmente, o Qlik JS estabelece a sessao WebSocket automaticamente, e o backend captura os downloads gerados pelos botoes de export.

Pseudocodigo do fluxo:
```
1. Abrir browser headless
2. Navegar para a URL do Agrostat
3. Aguardar carregamento dos graficos
4. (Opcional) Aplicar filtros clicando nos elementos FILTRO-*
5. Registrar listener de download
6. Clicar no botao #tabela-{id} do objeto desejado
7. Capturar o arquivo XLSX baixado
8. Parsear o XLSX como DataFrame
```

**Pros:** funcionamento confirmado em laboratorio, zero reversao de protocolo adicional
**Contras:** requer Playwright no servidor (~5s por objeto, mais lento)

##### Opcao B — WebSocket Engine API direto (recomendada para producao)

Python pode enviar headers customizados em conexoes WebSocket (diferente do browser), o que deve resolver o bloqueio 403. O fluxo e:

```
1. GET /publico/qps/csrftoken?xrfkey={16chars}
   → recebe cookie de sessao anonima

2. WSS /publico/app/{appId}
   headers: x-qlik-xrfkey: {mesmo valor}, Cookie: {cookie recebido}
   → conexao ao Qlik Engine

3. Engine JSON API — mensagens:
   OpenDoc(appId)          → handle do documento
   GetObject(objectId)     → handle do objeto
   GetHyperCubeData(...)   → dados paginados em JSON

   OU

   ExportData()            → URL /publico/tempcontent/{guid}.xlsx
   GET tempcontent URL     → arquivo XLSX
```

**Pros:** acesso direto e programatico, sem dependencia de browser, mais rapido e escalavel
**Contras:** requer validacao de que o servidor aceita a conexao WebSocket anonima com headers Python (nao confirmado ainda)

**Status:** aguardando validacao experimental antes de implementar.

#### Portal de Dados Abertos MAPA (CKAN)

```
GET https://dados.agricultura.gov.br/api/3/action/package_list
GET https://dados.agricultura.gov.br/api/3/action/package_show?id={id}
```

Datasets disponiveis incluem Agrofit (agrotoxicos registrados), ZARC (zoneamento agricola de risco climatico) e BINAGRI.

---

## 2. Camada de acesso PRIMÁRIA — Base dos Dados (BD+)

Para o AgroComex, a estrategia primaria de consumo de dados e o **Base dos Dados**, plataforma que processa, padroniza e disponibiliza dados de fontes oficiais brasileiras via BigQuery.

**URL:** https://basedosdados.org

### Vantagens

- Dados do Agrostat, CONAB e BCB ja tratados, com schema padronizado
- Acesso via SQL no BigQuery (1 TB gratis por mes por projeto GCP)
- Bibliotecas Python, R e Stata oficiais
- Schema versionado e documentado

### Acesso via Python

```python
pip install basedosdados

import basedosdados as bd

# Agrostat — comercio exterior do agronegocio
df = bd.read_sql(
    query="""
        SELECT ano, mes, produto, pais_destino, valor_fob_dolar, quantidade_kg
        FROM `basedosdados.br_agricultura_export.municipio`
        WHERE ano >= 2020
        LIMIT 1000
    """,
    billing_project_id="seu-projeto-gcp"
)
```

Dataset Agrostat no BD+: https://basedosdados.org/dataset/7a0cf7d9-cec5-43c9-a709-4ff6146953dd

### Pacote agrobr

Alternativa Python production-grade que abstrai 27 fontes publicas incluindo CONAB e MAPA, entregando DataFrames limpos e validados diretamente.

```python
pip install agrobr
```

Repositorio: https://github.com/bruno-portfolio/agrobr

---

## 3. Cadastros necessarios

### 3.1 Agrostat — MAPA

**Acesso publico, sem cadastro necessario.**

O sistema esta disponivel diretamente em:
https://mapa-indicadores.agricultura.gov.br/publico/extensions/Agrostat/Agrostat.html

Contato para duvidas ou suporte tecnico:
- E-mail: agrostat@agro.gov.br
- Gestor responsavel: Coordenacao Geral de Competitividade (MAPA)

### 3.2 CONAB — SICAN

O SICAN (Sistema de Cadastro Nacional de Agentes da Conab) e necessario para acesso a programas e sistemas autenticados da CONAB. O cadastro e aberto a pessoas fisicas (CPF) e juridicas (CNPJ).

**Como se cadastrar:**

1. Acessar https://sistemas.conab.gov.br/sicanweb/auth/cadastro
2. Informar CPF ou CNPJ, nome/razao social, e-mail e definir senha
3. Validar o cadastro pelo link enviado ao e-mail informado
4. Apos validacao, completar os dados adicionais exigidos pelo programa de interesse

**Contato para suporte:**
- E-mail: sican@conab.gov.br
- Telefone: (61) 3312-6238

**Observacao:** o SICAN e voltado principalmente a agentes que participam de programas de comercializacao da CONAB (PAA, PEP, CPR, etc.). Para acesso apenas aos dados do Portal de Informacoes, o cadastro nao e obrigatorio — os arquivos de download sao publicos.

---

## 4. Matriz de decisao — qual fonte usar

### Criterio de escolha

O BD+ e a fonte primaria para dados historicos e analiticos — schema padronizado, acesso unificado via SQL, sem necessidade de engenharia reversa. A fonte direta e usada quando o BD+ nao atende:

- **Latencia**: BD+ e atualizado com defasagem (tipicamente mensal ou trimestral). Para dados diarios operacionais (cambio, SELIC), a fonte direta e obrigatoria.
- **Cobertura**: dados nao disponíveis no BD+ (PROHORT diario, ZARC, Agrofit) continuam sendo consumidos diretamente da fonte original.

| Dado necessario | Fonte primaria | Fallback / Complemento | Metodo de acesso primario |
|-----------------|----------------|------------------------|--------------------------|
| Cambio (dolar, euro) diario | BCB SGS direto | — (BD+ tem defasagem inaceitavel) | `python-bcb` — sem cadastro |
| IPCA, SELIC, indicadores macro | BCB SGS direto | — (BD+ tem defasagem inaceitavel) | `python-bcb` — sem cadastro |
| Exportacoes/importacoes agronegocio (historico) | BD+ BigQuery | Agrostat (MAPA) direto | SQL via `basedosdados` |
| Estimativas e series historicas de safra | BD+ BigQuery | CONAB download direto | SQL via `basedosdados` |
| Precos agropecuarios por municipio/UF (historico) | BD+ BigQuery | CONAB download direto | SQL via `basedosdados` |
| Precos PROHORT (hortifruti) | CONAB Pentaho | — (nao disponível no BD+) | Endpoint nao oficial |
| Zoneamento agricola (ZARC) | MAPA CKAN | — (nao disponível no BD+) | CKAN API — sem cadastro |
| Agrotoxicos registrados (Agrofit) | MAPA CKAN | — (nao disponível no BD+) | CKAN API — sem cadastro |

---

## 5. Referencias

- [Portal de Dados Abertos do BCB](https://dadosabertos.bcb.gov.br/)
- [python-bcb no PyPI](https://pypi.org/project/python-bcb/)
- [CONAB — Download de Arquivos](https://portaldeinformacoes.conab.gov.br/download-arquivos.html)
- [CONAB — SICAN (Cadastro)](https://sistemas.conab.gov.br/sicanweb/auth/cadastro)
- [Agrostat — Portal publico](https://mapa-indicadores.agricultura.gov.br/publico/extensions/Agrostat/Agrostat.html)
- [Agrostat — Pagina institucional MAPA](https://sistemasweb.agricultura.gov.br/pages/AGROSTAT.html)
- [Qlik Engine JSON API — documentacao oficial](https://help.qlik.com/en-US/sense-developer/May2024/Subsystems/EngineJSONAPI/Content/introduction.htm)
- [Agrostat no Base dos Dados](https://basedosdados.org/dataset/7a0cf7d9-cec5-43c9-a709-4ff6146953dd)
- [agrobr no GitHub](https://github.com/bruno-portfolio/agrobr)
- [Portal de Dados Abertos MAPA](https://dados.agricultura.gov.br/)