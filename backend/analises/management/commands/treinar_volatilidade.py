from django.core.management.base import BaseCommand

from analises.ml.runner import executar_treino_completo


class Command(BaseCommand):
    help = "Treina e avalia o modelo de volatilidade futura em separado (Fase 2 / PoC)."

    def add_arguments(self, parser):
        parser.add_argument("--tipo", default="arvores", choices=["linear", "arvores"])
        parser.add_argument("--saida", default="artefatos_ml")
        parser.add_argument("--horizonte", type=int, default=21)

    def handle(self, *args, **opts):
        res = executar_treino_completo(
            dir_saida=opts["saida"], tipo=opts["tipo"], H=opts["horizonte"]
        )
        m = res["metricas"]
        self.stdout.write(self.style.SUCCESS("Treino concluido."))
        self.stdout.write(f"RMSE holdout modelo: {m.get('modelo_holdout_rmse'):.4f}")
        self.stdout.write(f"RMSE holdout 252d:   {m.get('baseline252_holdout_rmse'):.4f}")
        if "garch_holdout_rmse" in m:
            self.stdout.write(f"RMSE holdout GARCH:  {m.get('garch_holdout_rmse'):.4f}")
        for nome, caminho in res["caminhos"].items():
            self.stdout.write(f"{nome}: {caminho}")
