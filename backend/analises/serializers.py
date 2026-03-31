from rest_framework import serializers
from analises.models import SolicitacaoAnalise, ResultadoAnalise


class SolicitacaoAnaliseCreateSerializer(serializers.ModelSerializer):
    """Usado no POST — aceita IDs das FKs, auto-preenche usuario e preco."""

    quantidade = serializers.IntegerField(write_only=True, required=False, min_value=1)
    unidade_quantidade = serializers.ChoiceField(
        choices=["sacas", "toneladas"],
        write_only=True,
        required=False,
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
        ]

    def validate(self, attrs):
        tipo = attrs.get("tipo_derivativo")
        if tipo:
            posicao_implicita = getattr(tipo, "posicao_implicita", None)
            if not posicao_implicita and tipo.requer_posicao and not attrs.get("posicao"):
                raise serializers.ValidationError(
                    {"posicao": "Este tipo de derivativo requer posicao (comprador/vendedor)."}
                )
            if tipo.requer_barreira and attrs.get("nivel_barreira") is None:
                raise serializers.ValidationError(
                    {"nivel_barreira": "Este tipo de derivativo requer nivel de barreira."}
                )

        quantidade = attrs.get("quantidade")
        unidade = attrs.get("unidade_quantidade")
        if quantidade is not None and unidade is None:
            raise serializers.ValidationError(
                {"unidade_quantidade": "Informe a unidade (sacas ou toneladas) ao fornecer quantidade."}
            )
        if unidade is not None and quantidade is None:
            raise serializers.ValidationError(
                {"quantidade": "Informe a quantidade ao fornecer a unidade."}
            )

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

        quantidade = validated_data.pop("quantidade", None)
        unidade = validated_data.pop("unidade_quantidade", None)

        quantidade_sacas = None
        if quantidade is not None and unidade is not None:
            if unidade == "sacas":
                quantidade_sacas = quantidade
            elif unidade == "toneladas":
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
        if obj.preco_mercado_atual is None:
            return None
        return round(obj.preco_mercado_atual / 100, 2)

    def get_preco_exercicio(self, obj):
        if obj.preco_exercicio is None:
            return None
        return round(obj.preco_exercicio / 100, 2)

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


class ResultadoAnaliseSerializer(serializers.ModelSerializer):
    premio_calculado      = serializers.SerializerMethodField()
    valor_total_contrato  = serializers.SerializerMethodField()
    lucro_maximo          = serializers.SerializerMethodField()

    def get_premio_calculado(self, obj):
        if obj.premio_calculado is None:
            return None
        return round(obj.premio_calculado / 100, 2)

    def get_valor_total_contrato(self, obj):
        if obj.valor_total_contrato is None:
            return None
        return round(obj.valor_total_contrato / 100, 2)

    def get_lucro_maximo(self, obj):
        if obj.lucro_maximo is None:
            return None
        return round(obj.lucro_maximo / 100, 2)

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
            "dados_brutos",
            "calculado_em",
        ]
