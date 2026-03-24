import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from dados.tasks import (
    atualizar_cambio,
    atualizar_selic_ipca,
    atualizar_futuros_b3,
    atualizar_precos_cepea,
    atualizar_estimativa_safra,
    atualizar_exportacao,
    atualizar_precos_prohort,
)

tasks = [
    ("BCB - Cambio", atualizar_cambio),
    ("BCB - Selic/IPCA", atualizar_selic_ipca),
    ("AgroBR - Futuros B3", atualizar_futuros_b3),
    ("AgroBR - Precos CEPEA", atualizar_precos_cepea),
    ("AgroBR - Estimativa Safra", atualizar_estimativa_safra),
    ("AgroBR - Exportacao", atualizar_exportacao),
    ("AgroBR - Precos PROHORT", atualizar_precos_prohort),
]

for nome, task in tasks:
    print(f"\n--- {nome} ---")
    try:
        result = task.apply()
        print(result.get())
    except Exception as e:
        print(f"ERRO: {e}")

# Checar o que foi persistido
from dados.models import CacheDadosMercado, DadosMacroeconomicos
print("\n--- Banco de dados: CacheDadosMercado ---")
print(CacheDadosMercado.objects.values("fonte").distinct())
print(f"Total de registros: {CacheDadosMercado.objects.count()}")

print("\n--- Banco de dados: DadosMacroeconomicos ---")
print(DadosMacroeconomicos.objects.values("indicador").distinct())
print(f"Total de registros: {DadosMacroeconomicos.objects.count()}")