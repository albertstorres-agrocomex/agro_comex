# Spec: Selecao de Commodities no Dashboard

**Data:** 2026-03-24
**Status:** Aprovado pelo usuario
**Scope:** Feature de selecao de commodities persistida, pagina dedicada e integracao com dashboard

---

## 1. Contexto

O dashboard do AgroComex exibe graficos e cards informativos sobre commodities. Atualmente a area de conteudo do dashboard esta vazia. O usuario precisa poder escolher quais commodities (persistidas no banco) deseja acompanhar, e o dashboard deve refletir essas escolhas em toda sessao futura.

---

## 2. Decisoes de Design

| Decisao | Escolha |
|---------|---------|
| Rota | `/dashboard/commodities` (pagina dedicada) |
| Persistencia | Backend — tabela de relacao M2M `usuario_commodity` |
| Usuario sem selecao | Redirecionar automaticamente para `/dashboard/commodities` com mensagem de orientacao |
| Layout da pagina | Grid de cards (padrao shadcn/ui do projeto) com barra de busca e paginacao 10 a 10 |

---

## 3. Fluxo do usuario

```
Login
  └─► Dashboard carrega
        ├─► [tem commodities selecionadas] → exibe graficos/cards das commodities do usuario
        └─► [sem selecao] → redirect para /dashboard/commodities
              └─► usuario ativa toggles → clica "Salvar selecao"
                    └─► redirect para /dashboard (agora com conteudo)
```

---

## 4. Backend

### 4.1 Model

O model `Usuario` em `backend/usuario/models.py` e um **model de perfil** — ele tem um `OneToOneField` para `django.contrib.auth.models.User`, nao extende `AbstractBaseUser`. Adicionar o `ManyToManyField` diretamente nele:

```python
# backend/usuario/models.py
class Usuario(models.Model):
    # campos existentes preservados sem alteracao, incluindo:
    #   user = models.OneToOneField(User, on_delete=models.PROTECT, related_name='usuarios')
    #
    # ADICIONAR apenas o campo abaixo:
    commodities = models.ManyToManyField(
        'commodities.Comomodity',   # nome exato da classe (typo legado no model)
        blank=True,
        related_name='usuarios_m2m',
        db_table='usuario_commodity',
    )
```

> **Nota:** a classe do model de commodity se chama `Comomodity` (duplo "mo") — typo legado. A string de referencia deve usar esse nome exato. Renomear a classe para `Commodity` deve ser feito em refatoracao futura e separada.

Django gera automaticamente a tabela `usuario_commodity` com colunas `usuario_id` e `commodity_id`.

**Acesso nas views:** o usuario autenticado chega via `request.user`; o perfil e acessado via `request.user.usuarios` (pelo `related_name="usuarios"` do `OneToOneField`); as commodities via `request.user.usuarios.commodities`.

### 4.2 Migration

Nova migration em `backend/usuario/migrations/` gerada por `makemigrations usuario`.

### 4.3 Endpoints necessarios

| Metodo | Rota | Descricao |
|--------|------|-----------|
| `GET` | `/api/v1/usuario/commodities/` | Retorna IDs das commodities selecionadas pelo usuario autenticado |
| `PUT` | `/api/v1/usuario/commodities/` | Substitui a selecao completa do usuario (lista de IDs) |
| `GET` | `/api/v1/commodities/` | Ja existe — adicionar paginacao, busca e autenticacao |

#### 4.3.1 Novo endpoint: `GET /PUT /api/v1/usuario/commodities/`

**Roteamento:** registrar em `backend/usuario/urls.py` e incluir em `backend/core/urls.py`:

```python
# backend/usuario/urls.py
from django.urls import path
from .views import UserCommoditiesView

urlpatterns = [
    path('usuario/commodities/', UserCommoditiesView.as_view(), name='usuario-commodities'),
]
```

```python
# backend/core/urls.py — adicionar ao urlpatterns existente
path('api/v1/', include('usuario.urls')),
```

**View:** usar `APIView` com metodos `get` e `put`:

```python
# backend/usuario/views.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

class UserCommoditiesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        perfil = request.user.usuarios  # related_name="usuarios" no OneToOneField
        ids = list(perfil.commodities.values_list('id', flat=True))
        return Response({'commodity_ids': ids})

    def put(self, request):
        ids = request.data.get('commodity_ids', [])
        # validar: se qualquer ID nao existir na tabela Comomodity, retornar 400
        # IDs invalidos nao sao ignorados silenciosamente
        from commodities.models import Comomodity
        if not isinstance(ids, list) or not all(isinstance(i, int) for i in ids):
            return Response({'detail': 'commodity_ids deve ser lista de inteiros.'}, status=status.HTTP_400_BAD_REQUEST)
        existing_ids = set(Comomodity.objects.filter(id__in=ids, ativo=True).values_list('id', flat=True))
        invalid = [i for i in ids if i not in existing_ids]
        if invalid:
            return Response({'detail': f'IDs invalidos: {invalid}'}, status=status.HTTP_400_BAD_REQUEST)
        perfil = request.user.usuarios  # related_name="usuarios" no OneToOneField
        perfil.commodities.set(ids)
        return Response({'commodity_ids': ids}, status=status.HTTP_200_OK)
```

**Request/Response:**

```json
// PUT — body
{ "commodity_ids": [1, 3] }

// PUT — response 200
{ "commodity_ids": [1, 3] }

// GET — response 200
{ "commodity_ids": [1, 3] }
```

#### 4.3.2 Ajustes em `GET /api/v1/commodities/`

O `ComomodityViewSet` atual nao tem autenticacao nem paginacao. Adicionar:

```python
# backend/commodities/views.py
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

class CommodityPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'

class ComomodityViewSet(viewsets.ModelViewSet):
    queryset = Comomodity.objects.filter(ativo=True).order_by('nome')
    serializer_class = CommoditySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CommodityPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['nome', 'bolsa']
```

Query params suportados:
- `?search=<termo>` — filtra por nome ou bolsa (server-side)
- `?page=<n>` — pagina (default: 1, 10 por pagina)

> **Seguranca (OWASP A01):** o viewset atual expoe `POST`, `PUT`, `DELETE` sem autenticacao — vulnerabilidade ativa. Adicionar `permission_classes = [IsAuthenticated]` corrige isso.

### 4.4 Autorizacao (OWASP A01)

- Ambos os endpoints exigem autenticacao JWT (`IsAuthenticated`)
- `UserCommoditiesView` opera exclusivamente sobre `request.user.usuarios` — nunca aceita `user_id` como parametro externo
- IDs de commodity validados como inteiros pelo DRF antes de chegar ao `set()`

---

## 5. Frontend

### 5.1 Nova rota

`frontend/src/app/dashboard/commodities/page.tsx`

### 5.2 Estrutura da pagina

```
<DashboardLayout>          // sidebar + ml-[17rem], padrao do projeto
  <PageHeader>             // eyebrow "Configuracoes" + titulo + descricao
  <AlertBanner?>           // exibido apenas se nenhuma commodity estiver ativa
  <SearchBar>              // input, dispara nova query server-side, debounce 300ms
  <ResultCount>            // "Mostrando 1–10 de N commodities"
  <CardGrid>               // grid-cols-2, gap-4
    <CommodityCard />      // CardHeader + toggle + CardContent com badges
    ...
  </CardGrid>
  <Pagination>             // "Pagina X de Y" + Anterior/Proxima + numeros
  <SaveRow>                // hint de alteracoes nao salvas + botao "Salvar selecao"
</DashboardLayout>
```

### 5.3 CommodityCard

- `CardHeader`: nome da commodity (`font-semibold`) + bolsa · moeda (`text-xs text-muted-foreground`)
- Toggle switch alinhado a direita no header: controla selecao local antes de salvar
- `CardContent`: badge NCM (`variant="outline"`) + badge "Ativa" (cor `--success`) quando selecionada
- Sem icones ou emojis

### 5.4 Busca e paginacao

- Busca sempre **server-side** via `?search=<termo>` — filtra apenas a pagina atual seria incoerente com paginacao server-side
- Debounce de 300ms ao digitar; ao iniciar nova busca reiniciar para pagina 1
- Paginacao: `GET /api/v1/commodities/?page=N&page_size=10`

### 5.5 Estado e persistencia

```ts
// Estado local na pagina
const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
const [savedIds, setSavedIds]       = useState<Set<number>>(new Set())
const isDirty = /* selectedIds != savedIds */
```

- Inicializar `selectedIds` e `savedIds` com a resposta de `GET /api/v1/usuario/commodities/`
- Toggle altera apenas `selectedIds` (sem salvar)
- Botao "Salvar selecao": dispara `PUT /api/v1/usuario/commodities/` com array de IDs; apos 200 redirect para `/dashboard`
- Botao desabilitado se `selectedIds` estiver vazio (obrigatorio ao menos 1)
- Hint de rodape: "N commodities ativas · alteracoes nao salvas" visivel apenas quando `isDirty`

### 5.6 Redirect de primeiro acesso

Em `frontend/src/app/dashboard/page.tsx`, apos autenticacao, buscar as commodities do usuario via `GET /api/v1/usuario/commodities/`. Enquanto a resposta nao chegar, exibir estado de loading (ja existente na pagina). Apos resposta:

```ts
useEffect(() => {
  if (!isLoading && isAuthenticated && userCommodities !== null) {
    if (userCommodities.length === 0) {
      router.push('/dashboard/commodities')
    }
  }
}, [isLoading, isAuthenticated, userCommodities, router])
```

`userCommodities` e buscado localmente na `DashboardPage` via `useEffect` + `fetch` — nao entra no `AuthContext` (contexto de auth nao deve carregar dados de preferencia).

### 5.7 Design tokens

Todos os valores de cor via CSS custom properties do projeto (`--primary`, `--success`, `--border`, etc.). Sem hex hardcoded. Dark mode suportado via `.dark`.

---

## 6. Seguranca (OWASP)

| Item | Mitigacao |
|------|-----------|
| A01 - Broken Access Control | Endpoints operam apenas sobre o usuario autenticado; sem `user_id` exposto; `ComomodityViewSet` passa a exigir `IsAuthenticated` |
| A03 - Injection | IDs validados como inteiros pelo DRF; ORM Django para todas as queries — sem SQL raw |
| A07 - Auth Failures | JWT obrigatorio em todos os endpoints; rate limiting no endpoint de autenticacao ja existente |

---

## 7. Fora de escopo (neste ciclo)

- Graficos e cards no dashboard (dependem desta feature, implementados no proximo ciclo)
- Ordenacao de commodities selecionadas
- Limite maximo de commodities por usuario
- Renomear `Comomodity` para `Commodity` (refatoracao separada)
