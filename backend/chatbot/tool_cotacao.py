import concurrent.futures
import unicodedata
from django.conf import settings
from langchain.tools import tool
from usuario.models import Usuario
from commodities.models import Comomodity
from dados.servicos import obter_cotacao_cache, obter_cotacao_ao_vivo


def _normalizar(texto: str) -> str:
    s = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return s.strip().lower()


def _resolver_commodity(commodity_nome, commodities_usuario):
    """Casa o nome informado contra a allowlist do usuario (nome ou codigo)."""
    alvo = _normalizar(commodity_nome)
    for c in commodities_usuario:
        if alvo == _normalizar(c.nome) or alvo == _normalizar(c.codigo):
            return c
    for c in commodities_usuario:
        if alvo in _normalizar(c.nome):
            return c
    return None


def _buscar_com_fallback(commodity):
    """AO_VIVO com timeout -> fallback CACHE; ou CACHE direto."""
    if settings.COTACAO_MODO == "AO_VIVO":
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
                futuro = ex.submit(obter_cotacao_ao_vivo, commodity)
                vivo = futuro.result(timeout=settings.COTACAO_TIMEOUT_SEGUNDOS)
            if vivo is not None:
                return vivo
        except Exception:
            pass  # timeout ou falha de rede -> cai no cache
    return obter_cotacao_cache(commodity)


def make_cotacao_tool(django_user):
    """Retorna a tool de cotacao vinculada ao usuario autenticado."""

    @tool
    def consultar_cotacao_atual(commodity: str) -> str:
        """
        Consulta a cotacao atual de uma commodity do usuario (preco de mercado).

        Use quando o usuario perguntar se vale a pena seguir com um contrato,
        ou pedir o preco/cotacao atual de uma commodity. So funciona para
        commodities associadas a conta do usuario. O parametro commodity e o
        nome da commodity, por exemplo: "soja", "milho", "cafe".
        """
        try:
            perfil = Usuario.objects.get(user=django_user)
        except Usuario.DoesNotExist:
            return "Usuario sem perfil cadastrado no sistema."

        commodities_usuario = list(perfil.commodities.filter(ativo=True))
        alvo = _resolver_commodity(commodity, commodities_usuario)

        if alvo is None:
            # Distingue "existe no catalogo mas nao e do usuario" (recusa +
            # orienta fonte externa) de "nao existe" (pede esclarecimento).
            no_catalogo = _resolver_commodity(
                commodity, Comomodity.objects.filter(ativo=True)
            )
            if no_catalogo is not None:
                return (
                    f"A commodity '{commodity}' nao esta associada a sua conta, "
                    "entao nao consigo trazer a cotacao por aqui. Para essa, "
                    "recomendo consultar uma fonte de mercado externa."
                )
            return (
                f"Nao identifiquei '{commodity}' entre as commodities da sua "
                "conta. Pode confirmar qual commodity voce quer consultar?"
            )

        cotacao = _buscar_com_fallback(alvo)
        if cotacao is None:
            return (
                f"No momento estou sem a cotacao atualizada de {alvo.nome}. "
                "Tente novamente mais tarde."
            )

        data_fmt = cotacao["data_preco"].strftime("%d/%m/%Y")
        return (
            f"Cotacao de {alvo.nome} ({cotacao['fonte']}): "
            f"USD {cotacao['preco_usd']:.2f} por {alvo.unidade} "
            f"(referencia de {data_fmt})."
        )

    return consultar_cotacao_atual
