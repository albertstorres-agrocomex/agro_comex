from langchain.tools import tool
from dados.models import DadosMacroeconomicos


def make_cambio_tool():
    """Retorna a tool de cambio USD/BRL (dado macro publico, sem escopo de usuario)."""

    @tool
    def consultar_cambio() -> str:
        """
        Consulta a cotacao mais recente do dolar comercial (USD/BRL).
        Use apenas quando o usuario pedir explicitamente o valor em reais ou a
        cotacao do dolar. Nunca invente o cambio: se nao houver dado, informe.
        """
        registro = (
            DadosMacroeconomicos.objects
            .filter(indicador="USD_BRL")
            .order_by("-data")
            .first()
        )
        if registro is None:
            return "No momento nao tenho a cotacao do dolar (USD/BRL) disponivel."
        data_fmt = registro.data.strftime("%d/%m/%Y")
        return (
            f"Cambio USD/BRL (fonte {registro.fonte}): "
            f"R$ {registro.valor:.2f} por dolar (referencia de {data_fmt})."
        )

    return consultar_cambio
