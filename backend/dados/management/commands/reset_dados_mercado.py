from django.core.management.base import BaseCommand
from django.db import connection


TABELAS_ORDENADAS = [
    # Ordem respeita FKs: filhos antes dos pais
    "analises_pontocurvaresultado",
    "analises_cenarioanalise",
    "analises_resultadoanalise",
    "analises_solicitacaoanalise",
    "cache_dados_mercado",
    "dados_macroeconomicos",
    "exportacao_mensal",
]

PRESERVADAS = [
    "commodities",
    "auth_user",
    "usuarios_perfil",
    "usuarios_perfil_commodities",
]


class Command(BaseCommand):
    help = (
        "Zera todas as tabelas de dados de mercado e analises, "
        "preservando usuarios e commodities. "
        "Use --confirm para executar sem confirmacao interativa."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--confirm",
            action="store_true",
            help="Executa sem pedir confirmacao (uso em scripts/CI).",
        )

    def handle(self, *args, **options):
        self.stdout.write("\nTabelas que serao ZERADAS:")
        for t in TABELAS_ORDENADAS:
            self.stdout.write(f"  - {t}")
        self.stdout.write("\nTabelas PRESERVADAS:")
        for t in PRESERVADAS:
            self.stdout.write(f"  - {t}")

        if not options["confirm"]:
            resposta = input("\nConfirmar reset? [s/N] ").strip().lower()
            if resposta != "s":
                self.stdout.write(self.style.WARNING("Operacao cancelada."))
                return

        with connection.cursor() as cursor:
            for tabela in TABELAS_ORDENADAS:
                cursor.execute(f"DELETE FROM {tabela}")  # noqa: S608
                total = cursor.rowcount
                self.stdout.write(
                    self.style.SUCCESS(f"  {tabela}: {total} registros removidos")
                )

        self.stdout.write(self.style.SUCCESS("\nReset concluido."))
