from rest_framework import serializers
from analises.models import SolicitacaoAnalise, ResultadoAnalise, CenarioAnalise, PontoCurvaResultado
from analises.price_utils import usd_para_centavos, centavos_para_usd
from meses_contrato_futuro.models import MesContratoFurturo as MesContratoFurturoModel


class SolicitacaoAnaliseCreateSerializer(serializers.ModelSerializer):
    """Usado no POST — aceita IDs das FKs, auto-preenche usuario e preco."""

    mes_contrato = serializers.PrimaryKeyRelatedField(
        queryset=MesContratoFurturoModel.objects.filter(ativo=True),
        required=True,
    )
    preco_exercicio = serializers.IntegerField(required=True, min_value=1)
    nivel_barreira = serializers.FloatField(required=False, allow_null=True, min_value=0)
    quantidade = serializers.IntegerField(write_only=True, required=True, min_value=1)
    unidade_quantidade = serializers.ChoiceField(
        choices=["sacas", "toneladas"],
        write_only=True,
        required=True,
    )

    class Meta:
        model = SolicitacaoAnalise
        fields = [
            "commodity",
            "tipo_derivativo",
            "mes_contrato",
            "preco_exercicio",
            "quantidade",
            "unidade_quantidade",
            "posicao",
            "nivel_barreira",
            "barreira_tipo",
        ]

    def validate(self, attrs):
        tipo = attrs.get("tipo_derivativo")
        if tipo:
            posicao_implicita = getattr(tipo, "posicao_implicita", None)
            if not posicao_implicita and tipo.requer_posicao and not attrs.get("posicao"):
                raise serializers.ValidationError(
                    {"posicao": "Este tipo de derivativo requer posicao (comprador/vendedor)."}
                )
            if tipo.requer_barreira:
                nivel = attrs.get("nivel_barreira")
                if nivel is None or nivel <= 0:
                    raise serializers.ValidationError(
                        {"nivel_barreira": "Nivel de barreira obrigatorio e deve ser positivo."}
                    )
                if not attrs.get("barreira_tipo"):
                    raise serializers.ValidationError(
                        {"barreira_tipo": "Informe knock_in ou knock_out para opcoes com barreira."}
                    )
            else:
                attrs["barreira_tipo"] = None

        return attrs

    def create(self, validated_data):
        from dados.models import CacheDadosMercado
        from analises.calculators import toneladas_para_sacas

        request = self.context["request"]
        perfil = request.user.usuarios
        commodity = validated_data["commodity"]
        tipo = validated_data["tipo_derivativo"]

        if tipo.posicao_implicita and not validated_data.get("posicao"):
            validated_data["posicao"] = tipo.posicao_implicita

        quantidade = validated_data.pop("quantidade")
        unidade = validated_data.pop("unidade_quantidade")

        if unidade == "sacas":
            quantidade_sacas = quantidade
        else:
            quantidade_sacas = toneladas_para_sacas(quantidade, commodity.codigo)

        # Filtrar apenas fontes de preco unitario — COMEXSTAT_EXPORT reside em ExportacaoMensal
        ultimo = (
            CacheDadosMercado.objects
            .filter(
                commodity=commodity,
                fonte__in=["CEPEA_SPOT", "B3_FUTUROS"],
            )
            .order_by("-data_preco")
            .values_list("preco_fechamento", flat=True)
            .first()
        )
        preco = ultimo if ultimo is not None else 0

        if validated_data.get("nivel_barreira") is not None:
            nivel_centavos = usd_para_centavos(validated_data["nivel_barreira"])
            if tipo.requer_barreira and nivel_centavos == preco:
                raise serializers.ValidationError(
                    {"nivel_barreira": "A barreira nao pode ser igual ao preco de mercado atual."}
                )
            validated_data["nivel_barreira"] = nivel_centavos

        return SolicitacaoAnalise.objects.create(
            usuario=perfil,
            preco_mercado_atual=preco,
            quantidade_sacas=quantidade_sacas,
            **validated_data,
        )


class SolicitacaoAnaliseReadSerializer(serializers.ModelSerializer):
    """Usado em GET — retorna dados aninhados para exibicao."""

    preco_mercado_atual = serializers.SerializerMethodField()
    preco_exercicio = serializers.SerializerMethodField()
    nivel_barreira = serializers.SerializerMethodField()
    commodity_nome = serializers.CharField(source="commodity.nome", read_only=True)
    commodity_codigo = serializers.CharField(source="commodity.codigo", read_only=True)
    commodity_moeda = serializers.CharField(source="commodity.moeda", read_only=True)
    commodity_unidade = serializers.CharField(source="commodity.unidade", read_only=True)
    commodity_imagem_url = serializers.URLField(source="commodity.imagem_url", read_only=True)
    tipo_derivativo_nome = serializers.CharField(source="tipo_derivativo.nome", read_only=True)
    tipo_derivativo_rotulo = serializers.CharField(source="tipo_derivativo.rotulo", read_only=True)
    mes_contrato_codigo = serializers.CharField(source="mes_contrato.codigo_mes", read_only=True)
    mes_contrato_ano = serializers.IntegerField(source="mes_contrato.ano", read_only=True)
    mes_contrato_vencimento = serializers.DateField(source="mes_contrato.data_vencimento", read_only=True)
    mes_contrato_ticket = serializers.CharField(source="mes_contrato.ticket_completo", read_only=True)

    def get_preco_mercado_atual(self, obj):
        return centavos_para_usd(obj.preco_mercado_atual)

    def get_preco_exercicio(self, obj):
        return centavos_para_usd(obj.preco_exercicio)

    def get_nivel_barreira(self, obj):
        return centavos_para_usd(obj.nivel_barreira)

    class Meta:
        model = SolicitacaoAnalise
        fields = [
            "id",
            "status",
            "preco_mercado_atual",
            "preco_exercicio",
            "quantidade_sacas",
            "posicao",
            "nivel_barreira",
            "id_tarefa_worker",
            "criado_em",
            "commodity",
            "commodity_nome",
            "commodity_codigo",
            "commodity_moeda",
            "commodity_unidade",
            "commodity_imagem_url",
            "tipo_derivativo",
            "tipo_derivativo_nome",
            "tipo_derivativo_rotulo",
            "mes_contrato",
            "mes_contrato_codigo",
            "mes_contrato_ano",
            "mes_contrato_vencimento",
            "mes_contrato_ticket",
        ]


class PontoCurvaResultadoSerializer(serializers.ModelSerializer):
    preco     = serializers.SerializerMethodField()
    resultado = serializers.SerializerMethodField()

    def get_preco(self, obj):
        return centavos_para_usd(obj.preco_centavos)

    def get_resultado(self, obj):
        return centavos_para_usd(obj.resultado_centavos)

    class Meta:
        model  = PontoCurvaResultado
        fields = ["preco", "resultado"]


_FATORES_CENARIO = {"conservador": "0.90", "moderado": "0.99", "agressivo": "1.07"}
_NIVEL_RISCO_CENARIO = {"conservador": "baixo", "moderado": "medio", "agressivo": "alto"}


class CenarioAnaliseSerializer(serializers.ModelSerializer):
    preco_exercicio  = serializers.SerializerMethodField()
    premio           = serializers.SerializerMethodField()
    valor_total      = serializers.SerializerMethodField()
    ponto_equilibrio = serializers.SerializerMethodField()
    fator            = serializers.SerializerMethodField()
    nivel_risco      = serializers.SerializerMethodField()
    pontos_curva     = PontoCurvaResultadoSerializer(many=True, read_only=True)

    def get_preco_exercicio(self, obj):
        return centavos_para_usd(obj.preco_exercicio_centavos)

    def get_premio(self, obj):
        return centavos_para_usd(obj.premio_centavos)

    def get_valor_total(self, obj):
        qtd = obj.resultado.solicitacao.quantidade_sacas
        if qtd is None:
            return None
        return centavos_para_usd(obj.premio_centavos * qtd)

    def get_ponto_equilibrio(self, obj):
        return centavos_para_usd(obj.preco_exercicio_centavos - obj.premio_centavos)

    def get_fator(self, obj):
        return _FATORES_CENARIO.get(obj.nome)

    def get_nivel_risco(self, obj):
        return _NIVEL_RISCO_CENARIO.get(obj.nome)

    class Meta:
        model  = CenarioAnalise
        fields = [
            "id", "nome", "fator", "preco_exercicio", "premio",
            "valor_total", "ponto_equilibrio", "nivel_risco",
            "e_recomendado", "escolhido_pelo_usuario", "escolhido_em",
            "pontos_curva",
        ]


class ResultadoAnaliseSerializer(serializers.ModelSerializer):
    premio_calculado      = serializers.SerializerMethodField()
    valor_total_contrato  = serializers.SerializerMethodField()
    lucro_maximo          = serializers.SerializerMethodField()
    cenarios              = CenarioAnaliseSerializer(many=True, read_only=True)

    def get_premio_calculado(self, obj):
        return centavos_para_usd(obj.premio_calculado)

    def get_valor_total_contrato(self, obj):
        return centavos_para_usd(obj.valor_total_contrato)

    def get_lucro_maximo(self, obj):
        return centavos_para_usd(obj.lucro_maximo)

    class Meta:
        model = ResultadoAnalise
        fields = [
            "id",
            "solicitacao",
            "premio_calculado",
            "percentual_premio",
            "valor_total_contrato",
            "lucro_maximo",
            "volatilidade_utilizada",
            "taxa_juros_utilizada",
            "d1",
            "d2",
            "calculado_em",
            "cenarios",
        ]
