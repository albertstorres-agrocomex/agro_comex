from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from usuario.models import Usuario
from usuario.serializers import UsuarioSerializer


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer


class UserCommoditiesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from dados.models import CacheDadosMercado
        from django.db.models import Subquery, OuterRef

        perfil = request.user.usuarios
        commodities = perfil.commodities.filter(ativo=True)

        ultimo_preco = (
            CacheDadosMercado.objects
            .filter(commodity=OuterRef("pk"))
            .order_by("-data_preco")
            .values("preco_fechamento")[:1]
        )

        ultima_data_preco = (
            CacheDadosMercado.objects
            .filter(commodity=OuterRef("pk"))
            .order_by("-data_preco")
            .values("data_preco")[:1]
        )

        ultima_qualidade = (
            CacheDadosMercado.objects
            .filter(commodity=OuterRef("pk"))
            .order_by("-data_preco")
            .values("qualidade")[:1]
        )

        commodities = commodities.annotate(
            preco_atual_raw=Subquery(ultimo_preco),
            data_preco_atual_raw=Subquery(ultima_data_preco),
            qualidade_preco_atual=Subquery(ultima_qualidade),
        )

        result = [
            {
                "id": c.id,
                "codigo": c.codigo,
                "nome": c.nome,
                "moeda": c.moeda,
                "unidade": c.unidade,
                "preco_atual": round(c.preco_atual_raw / 100, 2) if c.preco_atual_raw is not None else None,
                "data_preco_atual": c.data_preco_atual_raw.isoformat() if c.data_preco_atual_raw is not None else None,
                "qualidade_preco_atual": c.qualidade_preco_atual,
            }
            for c in commodities
        ]
        return Response({"commodities": result})

    def put(self, request):
        ids = request.data.get('commodity_ids', [])
        if not isinstance(ids, list) or not all(isinstance(i, int) for i in ids):
            return Response(
                {'detail': 'commodity_ids deve ser lista de inteiros.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        from commodities.models import Comomodity
        existing_ids = set(Comomodity.objects.filter(id__in=ids, ativo=True).values_list('id', flat=True))
        invalid = [i for i in ids if i not in existing_ids]
        if invalid:
            return Response(
                {'detail': f'IDs invalidos: {invalid}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        perfil = request.user.usuarios
        perfil.commodities.set(ids)
        return Response({'commodity_ids': ids}, status=status.HTTP_200_OK)