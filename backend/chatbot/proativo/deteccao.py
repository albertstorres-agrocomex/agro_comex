# backend/chatbot/proativo/deteccao.py
import datetime as dt
import logging

from celery import shared_task

from analises.models import ResultadoAnalise, SolicitacaoAnalise
from dados.servicos import obter_cotacao_cache
from chatbot.models import Conversation, ConversationMessage, EstadoAlertaAnalise
from chatbot.proativo import regras, templates

logger = logging.getLogger(__name__)

STATUS_ATIVOS = ["concluido", "aprovado"]


def _conversa_proativa(user):
    conversa, _ = Conversation.objects.get_or_create(user=user, is_proativa=True)
    return conversa


def _emitir(analise, tipo_alerta, texto):
    conversa = _conversa_proativa(analise.usuario.user)
    ConversationMessage.objects.create(
        conversation=conversa, role="ai", content=texto,
        is_proativa=True, solicitacao=analise, tipo_alerta=tipo_alerta,
    )


def _avaliar_cenario(analise):
    estado = regras.estado_cenario(analise)
    registro, criado = EstadoAlertaAnalise.objects.get_or_create(
        solicitacao=analise, tipo_alerta="cenario_nao_escolhido",
        defaults={"ultimo_estado": estado},
    )
    if criado:
        if estado == "pendente":
            _emitir(analise, "cenario_nao_escolhido", templates.cenario_nao_escolhido(analise))
        return
    if estado != registro.ultimo_estado:
        if estado == "pendente":
            _emitir(analise, "cenario_nao_escolhido", templates.cenario_nao_escolhido(analise))
        registro.ultimo_estado = estado
        registro.save(update_fields=["ultimo_estado", "atualizado_em"])


def _avaliar_strike(analise):
    cotacao = obter_cotacao_cache(analise.commodity)
    if not cotacao:
        return
    spot = cotacao["preco_usd"]
    strike = analise.preco_exercicio / 100
    estado = regras.estado_strike(spot, strike)
    registro, criado = EstadoAlertaAnalise.objects.get_or_create(
        solicitacao=analise, tipo_alerta="cotacao_cruzou",
        defaults={"ultimo_estado": estado},
    )
    if criado:
        return  # primeira leitura: sem transicao conhecida, nao alerta
    if estado != registro.ultimo_estado:
        _emitir(analise, "cotacao_cruzou", templates.cotacao_cruzou(analise, spot, strike))
        registro.ultimo_estado = estado
        registro.save(update_fields=["ultimo_estado", "atualizado_em"])


def _avaliar_melhor_momento(analise):
    cotacao = obter_cotacao_cache(analise.commodity)
    if not cotacao:
        return
    spot = cotacao["preco_usd"]
    strike = analise.preco_exercicio / 100
    intrinseco = regras.valor_intrinseco_usd(analise.tipo_derivativo.nome, spot, strike)

    sinais = []
    if analise.nivel_barreira and regras.proximo_knockout(spot, analise.nivel_barreira / 100, analise.barreira_tipo or ""):
        sinais.append("knockout")
    resultado = ResultadoAnalise.objects.filter(solicitacao=analise).order_by("-calculado_em").first()
    if resultado and resultado.premio_calculado and regras.intrinseco_relevante(intrinseco, resultado.premio_calculado / 100):
        sinais.append("intrinseco")
    if analise.mes_contrato_id and analise.mes_contrato.data_vencimento:
        dias = regras.dias_uteis_ate(analise.mes_contrato.data_vencimento, dt.date.today())
        if regras.proximo_vencimento(dias, intrinseco):
            sinais.append("vencimento")

    estado = "disparado" if sinais else "normal"
    registro, criado = EstadoAlertaAnalise.objects.get_or_create(
        solicitacao=analise, tipo_alerta="melhor_momento",
        defaults={"ultimo_estado": estado},
    )
    if criado:
        if estado == "disparado":
            _emitir(analise, "melhor_momento", templates.melhor_momento(analise, sinais, spot))
        return
    if estado != registro.ultimo_estado:
        if estado == "disparado":
            _emitir(analise, "melhor_momento", templates.melhor_momento(analise, sinais, spot))
        registro.ultimo_estado = estado
        registro.save(update_fields=["ultimo_estado", "atualizado_em"])


@shared_task
def varrer_alertas_proativos():
    qs = SolicitacaoAnalise.objects.filter(status__in=STATUS_ATIVOS).select_related(
        "commodity", "usuario", "usuario__user", "tipo_derivativo", "mes_contrato"
    )
    total = 0
    for analise in qs:
        try:
            _avaliar_cenario(analise)
            _avaliar_strike(analise)
            _avaliar_melhor_momento(analise)
            total += 1
        except Exception:
            logger.exception("falha ao avaliar analise proativa %s", analise.id)
    return {"analises_avaliadas": total}
