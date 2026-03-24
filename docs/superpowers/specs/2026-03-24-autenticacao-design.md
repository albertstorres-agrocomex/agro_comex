# Spec: Correcao e Documentacao da Autenticacao JWT

**Data:** 2026-03-24
**Status:** Aprovado
**Escopo:** Correcao da implementacao de autenticacao existente (backend + servico frontend). UI de login excluida deste escopo.

---

## Contexto

O projeto AgroComex possui dois tipos de usuario:

- **Usuarios** — tabela existente (`usuario` app), cliente e publico-alvo do sistema. Realiza login e executa analises.
- **Administradores** — nao modelado ainda. Sera adicionado ao final do projeto. Responsavel por cadastrar commodities, gerenciar Usuarios e configuracoes gerais.

A autenticacao foi parcialmente implementada com JWT via `djangorestframework-simplejwt`. O backend tem a estrutura correta mas varios problemas de configuracao impedem o funcionamento. O frontend tem um `api.ts` com axios mas depende de arquivos que nao existem.

---

## Estrategia de Tokens (OWASP A02 / A07)

- **Access token**: retornado no corpo da resposta. Armazenado em memoria no frontend (modulo closure). Nunca em `localStorage`.
- **Refresh token**: armazenado em cookie HttpOnly + Secure + SameSite. Inacessivel ao JavaScript. Enviado automaticamente em requisicoes com `withCredentials: true`.

---

## Backend

### Dependencias a adicionar (`requirements.txt`)

| Pacote | Motivo |
|--------|--------|
| `djangorestframework-simplejwt` | Geração, refresh e blacklist de JWT |
| `django-cors-headers` | Permitir requisicoes cross-origin do frontend |

### INSTALLED_APPS (`core/settings.py`)

Adicionar:
```python
'corsheaders',
'authentication',
'rest_framework_simplejwt.token_blacklist',
```

### MIDDLEWARE (`core/settings.py`)

Adicionar no topo:
```python
'corsheaders.middleware.CorsMiddleware',
```

### Configuracoes a adicionar (`core/settings.py`)

Adicionar no topo de `settings.py` (se ainda nao presente):
```python
from datetime import timedelta
```

**Bloco SIMPLE_JWT:**
```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
}
```

**Variaveis de cookie JWT:**
```python
JWT_REFRESH_COOKIE_NAME = "refresh_token"
JWT_REFRESH_COOKIE_PATH = "/api/v1/authentication/"
JWT_REFRESH_COOKIE_HTTPONLY = True
JWT_REFRESH_COOKIE_SECURE = not DEBUG  # True em producao
JWT_REFRESH_COOKIE_SAMESITE = "Lax"
JWT_REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 7 dias
JWT_REFRESH_COOKIE_PARTITIONED = False
```

**CORS:**
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
CORS_ALLOW_CREDENTIALS = True
```

**Throttling:**
```python
REST_FRAMEWORK = {
    ...
    "DEFAULT_THROTTLE_CLASSES": ["rest_framework.throttling.ScopedRateThrottle"],
    "DEFAULT_THROTTLE_RATES": {
        "auth": "10/min",
    },
}
```

### URLs (`core/urls.py`)

Adicionar:
```python
path("api/v1/authentication/", include("authentication.urls")),
```

### Bugs a corrigir nos serializers (`authentication/serializers.py`)

1. Import errado: `AuthenticationField` → `AuthenticationFailed` (`from rest_framework.exceptions import AuthenticationFailed`)
2. `flat=true` → `flat=True` (Python e case-sensitive)
3. Renomear classe de `CustomTokenObtainPairSerializer` (era `CustomObtainPairSerializer`) — alinha com importacao nas views
4. Comentar com `#` os blocos `elif grupo == 'Administradores':` e quaisquer referencias a `Administradores.DoesNotExist`, marcando com `# TODO: descomentar apos criar a app administradores`

### Bugs a corrigir nas views (`authentication/views.py`)

1. `CustomTokenRefreshView.post()`: variavel `first_name` nao existe — deve ser `primeiro_nome`
2. `MeuPerfilView._get_grupo_e_perfil()`: `values_list('first_name', flat=True)` em queryset de `Group` — o campo correto e `'name'`

### Views — comentar referencias ao Administradores (`authentication/views.py`)

Comentar com `#` os seguintes blocos, marcando com `# TODO: descomentar apos criar a app administradores`:
- Branch `elif grupo == 'Administradores':` em `_get_grupo_e_perfil()`
- Qualquer acesso ao related name `user.administradores` no perfil do usuario

### Correcao de URL prefix (`authentication/urls.py`)

Os paths definidos no arquivo incluem o prefixo `authentication/` duplicado (ex: `'authentication/token/'`). Como o include em `core/urls.py` ja monta sob `api/v1/authentication/`, os paths internos devem ser apenas `'token/'`, `'token/refresh/'`, `'token/verify/'`, `'logout/'`, `'me/'`.

### Migrations

Rodar apos todas as correcoes de settings:
```
python manage.py makemigrations authentication
python manage.py migrate
```

---

## Frontend

### Dependencias a adicionar (`package.json`)

| Pacote | Motivo |
|--------|--------|
| `axios` | Cliente HTTP ja referenciado em `api.ts` |

### Arquivo novo: `frontend/src/config/apiConfig.ts`

```typescript
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
```

### Arquivo novo: `frontend/src/authStore.ts`

Modulo com closure encapsulando o access token em memoria:

```typescript
let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(token: string): void {
  _accessToken = token;
}

export function clearAccessToken(): void {
  _accessToken = null;
}
```

Caracteristicas:
- Sem dependencia de React — funciona dentro e fora de componentes
- Sem `localStorage` — token some ao recarregar a pagina (intencional por seguranca)
- Compativel com a importacao existente em `services/api.ts`

### Correcao e adicao: `frontend/services/api.ts`

Manter o interceptor de request existente (adiciona header `Authorization: Bearer`).

Adicionar interceptor de **resposta** com logica de refresh automatico:

```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // O cookie HttpOnly e enviado automaticamente via withCredentials
        const { data } = await axios.post(
          `${API_BASE_URL}/api/v1/authentication/token/refresh/`,
          {},
          { withCredentials: true }
        );
        setAccessToken(data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch {
        clearAccessToken();
        // A UI tratara o redirecionamento para login quando existir
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
```

### Arquivo novo: `frontend/.env.local` (nao comitado)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Adicionar `frontend/.env.local` ao `.gitignore`.

---

## Endpoints de Autenticacao (referencia)

| Metodo | Path | Descricao |
|--------|------|-----------|
| POST | `/api/v1/authentication/token/` | Login. Retorna `access`, `group`, `primeiro_nome`. Seta cookie de refresh. |
| POST | `/api/v1/authentication/token/refresh/` | Renova access token via cookie. |
| POST | `/api/v1/authentication/token/verify/` | Verifica validade de um access token. |
| POST | `/api/v1/authentication/logout/` | Blacklista o refresh token e apaga o cookie. |
| GET/PATCH | `/api/v1/authentication/me/` | Perfil do usuario autenticado. |

---

## Fora de escopo

- UI de login (pagina `/login`, formulario, redirecionamento) — proxima iteracao
- Model e app `Administradores` — adicionado ao final do projeto
- Testes automatizados de autenticacao

---

## Checklist de verificacao pre-conclusao

- [ ] `python manage.py check` sem erros
- [ ] `python manage.py migrate` sem erros
- [ ] Endpoint `POST /api/v1/authentication/token/` retorna 200 com credentials validas
- [ ] Endpoint `POST /api/v1/authentication/token/refresh/` retorna novo access token
- [ ] Endpoint `POST /api/v1/authentication/logout/` retorna 200 e apaga cookie
- [ ] Frontend compila sem erros (`npm run build`)
- [ ] `api.ts` envia `Authorization: Bearer` corretamente
- [ ] Interceptor de 401 retenta a requisicao apos refresh bem-sucedido
- [ ] `GET /api/v1/authentication/me/` retorna 401 (nao 404) com token invalido — confirma prefix correto
