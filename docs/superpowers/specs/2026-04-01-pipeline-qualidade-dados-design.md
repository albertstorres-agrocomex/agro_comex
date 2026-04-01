# Spec: Pipeline de Qualidade de Dados — Ingestao de Commodities

**Data:** 2026-04-01
**Autor:** Albert Sevy Torres + Claude Sonnet 4.6
**Status:** Aprovado para implementacao

---

## Contexto e Motivacao

Uma sessao de debugging identificou dois bugs criticos no pipeline de ingestao de precos:

1. **Bug CEPEA — coluna errada**: `normalizar_precos_cepea` lia a coluna `"preco"`, mas o contrato `CEPEA_INDICADOR_V1` da biblioteca `agrobr` define a coluna de preco como `"valor"`. Resultado: nenhum dado CEPEA foi jamais persistido no banco — a task Celery capturava o `KeyError` silenciosamente.

2. **Bug B3 — ausencia de conversao de unidade/moeda**: `normalizar_futuros_b3` armazenava `ajuste_atual` diretamente (apos `* 100`), sem converter para a unidade padrao da commodity. Cada contrato B3 usa uma unidade diferente que nao corresponde ao `moeda`/`unidade` do modelo `Comomodity`:

| Commodity | Contrato B3 | Unidade retornada pelo B3 | Unidade padrao do sistema |
|-----------|-------------|--------------------------|--------------------------|
| ZC (Milho) | CCM | BRL/saca (60 kg) | USD/bu |
| ZS (Soja) | SFI | USD/tonelada metrica | USD/bu |
| KC (Cafe) | ICF | USD/saca (60 kg) | USD/lb |

**Evidencia numerica (2026-03-31):**
- ZC: banco = 7490 centavos → exibido como USD 74.90/bu. Correto seria ~USD 4.58/bu.
- ZS: banco = 46500 centavos → exibido como USD 465.00/bu. Correto seria ~USD 11.60/bu. (USD/MT ÷ 36.744 = USD 12.66/bu)
- KC: banco = 39805 centavos → exibido como USD 398.05/lb. Correto seria ~USD 2.97/lb. (USD/saca ÷ 132.277 = USD 3.01/lb)

Esses bugs expuseram uma ausencia mais ampla: nenhuma camada de validacao de qualidade existe no pipeline, tornando erros futuros de mesma natureza indetectaveis.

---

## Objetivo

1. Corrigir os dois bugs de ingestao.
2. Implementar pipeline de qualidade de dados para todas as fontes ingeridas (`CacheDadosMercado`, `DadosMacroeconomicos`, `ExportacaoMensal`).
3. Garantir que outliers extremos (ex: eventos geopoliticos) sejam registrados, categorizados e justificaveis — nunca descartados.
4. Documentar o fluxo de dados para auditoria e analise futura.
5. Prover management command de reset seletivo do banco.

---

## Arquitetura

### Fluxo de dados completo

```
Fonte externa (agrobr lib)
        |
        v
normalizar_*()           [dados/limpeza/agrobr.py]
  - extrai colunas corretas do DataFrame
  - mapeia para codigo_commodity
        |
        v
converter_*()            [dados/limpeza/conversao.py]  ← NOVO
  - converte unidade/moeda para padrao da commodity
  - resultado: sempre USD/unidade-nativa (USD/bu ou USD/lb)
        |
        v
[* 100] → preco_fechamento em centavos de USD
        |
        v
validar_*()              [dados/validacao/qualidade.py]  ← NOVO
  - Etapa 1: inspecao estrutural (nulo, positivo, tipo, range)
  - Etapa 2: deteccao de outliers (variacao diaria + z-score historico)
  - retorna (QualidadeDado, motivo_str)
        |
        v
persistir_*()            [dados/servicos.py]
  - grava com campos qualidade, motivo_qualidade
  - justificado=False por padrao
```

### Estrutura de modulos

```
backend/dados/
  limpeza/
    agrobr.py              (modificado: fix CEPEA "valor", conversao B3 por contrato)
    conversao.py           (NOVO: constantes fisicas + funcoes de conversao)
  validacao/
    __init__.py            (NOVO)
    qualidade.py           (NOVO: QualidadeDado enum + validadores)
  management/
    commands/
      reset_dados_mercado.py   (NOVO: reset seletivo com confirmacao)
  models.py                (modificado: +4 campos nos 3 modelos)
  servicos.py              (modificado: chamar validadores antes de persistir)
  migrations/
    000X_add_qualidade_fields.py
```

---

## Modulo `dados/limpeza/conversao.py`

### Constantes fisicas (fontes: USDA, CBOT, ICE)

```
SACA_KG = 60.0
KG_PER_BUSHEL_CORN = 25.401   # milho (USDA)
KG_PER_BUSHEL_SOY  = 27.216   # soja (USDA)
KG_PER_LB          = 0.45359237

# Fatores derivados
SACAS_PER_BUSHEL_ZC  = SACA_KG / KG_PER_BUSHEL_CORN   # 2.362
SACAS_PER_BUSHEL_ZS  = SACA_KG / KG_PER_BUSHEL_SOY    # 2.205
LBS_PER_SACA_KC      = SACA_KG / KG_PER_LB             # 132.277
BU_PER_MT_ZS         = 1000.0 / KG_PER_BUSHEL_SOY      # 36.744
```

### Mapeamento B3 por contrato

| Codigo | Contrato B3 | Moeda B3 | Unidade B3 | Conversao |
|--------|-------------|----------|------------|-----------|
| ZC | CCM | BRL | saca (60 kg) | `price / SACAS_PER_BUSHEL_ZC / usd_brl` |
| ZS | SFI | USD | tonelada metrica | `price / BU_PER_MT_ZS` |
| KC | ICF | USD | saca (60 kg) | `price / LBS_PER_SACA_KC` |

### Mapeamento CEPEA por commodity

| Codigo | Unidade CEPEA | Moeda CEPEA | Conversao |
|--------|---------------|-------------|-----------|
| ZC | saca (60 kg) | BRL | `price / SACAS_PER_BUSHEL_ZC / usd_brl` |
| ZS | saca (60 kg) | BRL | `price / SACAS_PER_BUSHEL_ZS / usd_brl` |
| KC | saca (60 kg) | BRL | `price / LBS_PER_SACA_KC / usd_brl` |

### API publica

```python
def converter_b3(codigo: str, preco: float, usd_brl: float | None) -> float
    """
    Converte preco retornado pelo B3 para USD na unidade padrao da commodity.
    ZC exige usd_brl; ZS e KC sao puramente de unidade.
    Lanca ValueError se codigo nao mapeado ou usd_brl ausente para ZC.
    """

def converter_cepea(codigo: str, preco_brl: float, usd_brl: float, unidade_cepea: str | None = None) -> float
    """
    Converte preco CEPEA (BRL/saca por padrao) para USD na unidade padrao.
    Se unidade_cepea for fornecida, valida que corresponde ao esperado para o codigo
    (ex: "R$/saca 60 kg" para milho). Loga warning e marca SUSPEITO se divergir.
    Lanca ValueError se codigo nao mapeado.
    """

def obter_taxa_usd_brl(tolerancia_dias: int = 7) -> float
    """
    Le DadosMacroeconomicos (indicador=USD_BRL) pela data mais recente.
    Lanca ValueError se a taxa mais recente for anterior a tolerancia_dias.
    Lanca ValueError com mensagem clara se nao houver taxa no banco.
    Motivo: taxa muito desatualizada produziria conversao BRL->USD incorreta.
    """
```

---

## Modulo `dados/validacao/qualidade.py`

### Duas etapas com comportamentos distintos

**Etapa 1 — Inspecao estrutural (pre-persistencia):**
Falhas estruturais impedem a persistencia do registro. O dado e descartado com log de warning.
Nunca chegam ao banco.

| Categoria | Gatilho | Comportamento |
|-----------|---------|---------------|
| `VALOR_INVALIDO` | nulo, negativo, tipo errado | Descarta — nao persiste |
| `RANGE_ESPERADO` | fora do range fixo por indicador macro | Descarta — nao persiste |

**Etapa 2 — Deteccao de outliers (pos-conversao, pre-persistencia):**
Outliers sao **sempre persistidos** com flag de qualidade. Um outlier pode ser um evento de mercado real
(guerra, pandemia, crise) e precisa estar disponivel para justificativa e analise historica.

### Enum (aplicado apenas a registros persistidos)

```python
class QualidadeDado(str, Enum):
    OK       = "OK"        # dado valido, sem anomalias detectadas
    SUSPEITO = "SUSPEITO"  # outlier moderado — catalogado para atencao
    INVALIDO = "INVALIDO"  # outlier extremo — catalogado, mas INCLUIDO nos calculos
```

**Principio fundamental:** todos os registros persistidos participam dos calculos,
independentemente do flag de qualidade. Guerras, pandemias e crises globais geram
outliers reais que fazem parte da historia do mercado e devem influenciar
volatilidade e precificacao. Excluir esses dados distorceria os modelos.

O flag `qualidade` e exclusivamente para **catalogacao e auditoria**:
- Permite identificar periodos anomalos na serie historica
- Permite que um operador documente a causa via `justificativa`
- Permite filtros em analises exploratorias futuras

Um registro `INVALIDO` no banco **nunca e um NaN ou valor negativo** — esses sao
descartados na Etapa 1 e nunca chegam ao banco.

### Categorias de motivo (apenas para registros persistidos)

| Categoria | Gatilho |
|-----------|---------|
| `VARIACAO_DIARIA` | variacao percentual diaria acima do threshold |
| `DESVIO_HISTORICO` | z-score acima do threshold (janela 90 dias) |

O campo `motivo_qualidade` concatena todas as categorias disparadas separadas por `|`.
Exemplo: `"VARIACAO_DIARIA:+23.4%|DESVIO_HISTORICO:z=3.8"`

### Thresholds de outlier para precos

| Metrica | SUSPEITO | INVALIDO |
|---------|----------|---------|
| Variacao diaria `|Δ%|` | > 15% | > 50% |
| Z-score historico `|z|` | > 3σ | > 5σ |

### Regra de combinacao

O pior resultado prevalece: `INVALIDO > SUSPEITO > OK`.
Quando multiplos motivos disparam, todos sao registrados em `motivo_qualidade`.

### API publica

```python
def validar_preco(codigo: str, preco: float, data: date, fonte: str) -> tuple[QualidadeDado, str | None]
def validar_macro(indicador: str, valor: float, data: date) -> tuple[QualidadeDado, str | None]
def validar_exportacao(codigo: str, valor_fob: float, data: date) -> tuple[QualidadeDado, str | None]
```

---

## Mudancas nos modelos

Os 3 modelos recebem os mesmos 4 campos novos:

```python
qualidade        = models.CharField(
    max_length=10,
    choices=[(q.value, q.value) for q in QualidadeDado],
    default=QualidadeDado.OK,
)
motivo_qualidade = models.TextField(null=True, blank=True)
justificado      = models.BooleanField(default=False)
justificativa    = models.TextField(null=True, blank=True)
```

### Uso downstream (Black-Scholes e preco_atual)

- `calcular_volatilidade()` em `calculators.py`: inclui **todos** os registros persistidos (`OK`, `SUSPEITO`, `INVALIDO`) — nenhum e excluido por flag de qualidade
- `UserCommoditiesView`: usa o registro mais recente independente de qualidade; se o mais recente for `INVALIDO`, exibe o valor com indicador visual de anomalia no frontend
- O campo `justificado` e `justificativa` sao anotacoes humanas para documentacao — nao alteram o comportamento de calculos

### Justificativa de outliers

Quando um evento real (guerra, crise, pandemia) causa variacao extrema, um operador pode marcar:
```python
registro.justificado = True
registro.justificativa = "Guerra Russia-Ucrania: pico de milho fev/2022"
registro.save()
```
O registro volta a ser incluido nos calculos sem alterar o `motivo_qualidade` original (preserva historico do desvio detectado).

---

## Management command `reset_dados_mercado`

```
python manage.py reset_dados_mercado [--confirm]
```

**Tabelas zeradas:**
- `cache_dados_mercado`
- `dados_macroeconomicos`
- `exportacao_mensal`
- `analises_solicitacaoanalise`
- `analises_resultadoanalise`
- `analises_cenarioanalise`
- `analises_pontocurvaresultado`

**Tabelas preservadas:**
- `dados_comomodity`
- `auth_user`
- `usuarios_perfil` e tabelas M2M relacionadas
- Tabelas de configuracao (django_celery_beat_*, django_migrations, etc.)

Sem `--confirm`, o comando lista o que sera zerado e aborta. Com `--confirm`, executa e exibe contagem de registros removidos por tabela.

---

## Documentacao a atualizar

| Arquivo | Secao nova |
|---------|-----------|
| `BACKEND_TECHNICAL_DOC.md` | "Pipeline de Ingestao de Dados" — fluxo completo, tabela de fontes/unidades/fatores, thresholds de qualidade, instrucoes de reset e re-ingestao |
| `SPEC.md` | "Qualidade de Dados" — contrato de qualidade para calculos downstream |

---

## O que NAO esta no escopo

- Interface de admin para justificar outliers (via Django admin e suficiente por ora)
- Notificacao automatica quando dados INVALIDO sao detectados
- Conversao de SB (Acucar) — sem dados B3/CEPEA ativos no MVP
- Retroativo: dados historicos incorretos sao zerados pelo reset, nao recalculados
