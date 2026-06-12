from django.db import migrations


TIPOS_INICIAIS = [
    {
        "nome": "Call",
        "rotulo": "CALL",
        "descricao": "Opcao de compra — confere ao titular o direito de comprar o ativo pelo preco de exercicio.",
        "requer_barreira": False,
        "requer_posicao": True,
        "posicao_implicita": None,
    },
    {
        "nome": "Put",
        "rotulo": "PUT",
        "descricao": "Opcao de venda — confere ao titular o direito de vender o ativo pelo preco de exercicio.",
        "requer_barreira": False,
        "requer_posicao": True,
        "posicao_implicita": None,
    },
    {
        "nome": "Forward",
        "rotulo": "FWD",
        "descricao": "Contrato a termo — obrigacao de comprar ou vender o ativo em data futura a preco previamente acordado.",
        "requer_barreira": False,
        "requer_posicao": True,
        "posicao_implicita": None,
    },
    {
        "nome": "Swap",
        "rotulo": "SWAP",
        "descricao": "Troca de fluxos financeiros entre duas partes com base em variacoes de preco do ativo subjacente.",
        "requer_barreira": False,
        "requer_posicao": True,
        "posicao_implicita": None,
    },
    {
        "nome": "Call com Barreira",
        "rotulo": "CALL-B",
        "descricao": "Opcao de compra com barreira de ativacao ou desativacao (knock-in / knock-out).",
        "requer_barreira": True,
        "requer_posicao": True,
        "posicao_implicita": None,
    },
    {
        "nome": "Put com Barreira",
        "rotulo": "PUT-B",
        "descricao": "Opcao de venda com barreira de ativacao ou desativacao (knock-in / knock-out).",
        "requer_barreira": True,
        "requer_posicao": True,
        "posicao_implicita": None,
    },
]


def seed_tipos(apps, schema_editor):
    TipoDerivativo = apps.get_model("tipos_derivativo", "TipoDerivativo")
    for tipo in TIPOS_INICIAIS:
        TipoDerivativo.objects.get_or_create(rotulo=tipo["rotulo"], defaults=tipo)


def remove_seed(apps, schema_editor):
    TipoDerivativo = apps.get_model("tipos_derivativo", "TipoDerivativo")
    rotulos = [t["rotulo"] for t in TIPOS_INICIAIS]
    TipoDerivativo.objects.filter(rotulo__in=rotulos).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("tipos_derivativo", "0002_add_posicao_implicita"),
    ]

    operations = [
        migrations.RunPython(seed_tipos, remove_seed),
    ]
