import django.db.models.deletion
import pgvector.django
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("analises", "0009_add_cenario_proposto"),
        ("chatbot", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(
            "CREATE EXTENSION IF NOT EXISTS vector;",
            migrations.RunSQL.noop,
        ),
        migrations.CreateModel(
            name="AnaliseEmbedding",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("content", models.TextField()),
                ("content_hash", models.CharField(max_length=64)),
                ("embedding", pgvector.django.VectorField(dimensions=1536)),
                ("embedded_at", models.DateTimeField(auto_now=True)),
                ("analise", models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="embedding",
                    to="analises.solicitacaoanalise",
                )),
            ],
            options={"db_table": "chatbot_analise_embeddings"},
        ),
        migrations.RunSQL(
            "CREATE INDEX ON chatbot_analise_embeddings USING hnsw (embedding vector_cosine_ops);",
            migrations.RunSQL.noop,
        ),
    ]
