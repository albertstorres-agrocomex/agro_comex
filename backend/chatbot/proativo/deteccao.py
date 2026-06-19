# backend/chatbot/proativo/deteccao.py
from celery import shared_task

from analises.models import SolicitacaoAnalise
from dados.servicos import obter_cotacao_cache
from chatbot.models import Conversation, ConversationMessage, EstadoAlertaAnalise
from chatbot.proativo import regras, templates

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


@shared_task
def varrer_alertas_proativos():
    qs = SolicitacaoAnalise.objects.filter(status__in=STATUS_ATIVOS).select_related(
        "commodity", "usuario", "usuario__user"
    )
    total = 0
    for analise in qs:
        _avaliar_cenario(analise)
        _avaliar_strike(analise)
        total += 1
    return {"analises_avaliadas": total}
