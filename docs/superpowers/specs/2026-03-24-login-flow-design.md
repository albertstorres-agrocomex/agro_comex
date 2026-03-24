# Design: Fluxo de Login — AgroComex

**Data:** 2026-03-24
**Status:** Aprovado

---

## Contexto

O backend de autenticacao JWT esta completo. O frontend tem `LoginCard`, `authStore` e `apiConfig` prontos, mas desconectados. O objetivo e ligar essas pecas para que o login funcione de ponta a ponta.

---

## Escopo

- Conectar o formulario de login ao backend
- Armazenar o access token em memoria
- Redirecionar para `/dashboard` apos login bem-sucedido
- Implementar silent refresh ao montar o dashboard
- Exibir feedback de erro no formulario
- Criar pagina placeholder `/dashboard`

Fora do escopo: protecao de rotas generica, pagina de recuperacao de senha, perfil do usuario.

---

## Arquitetura

### Arquivos a criar

| Arquivo | Responsabilidade |
|---------|-----------------|
| `frontend/src/services/authService.ts` | Chamadas HTTP de autenticacao (login, refresh, logout) |
| `frontend/src/contexts/AuthContext.tsx` | Estado global de autenticacao; expoe `useAuth()` |
| `frontend/src/app/dashboard/page.tsx` | Placeholder do dashboard com silent refresh e logout |

### Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `frontend/src/app/layout.tsx` | Envolve o app com `AuthProvider` |
| `frontend/src/app/page.tsx` | Passa `onSubmit`, `isLoading` e `error` para `LoginCard` |
| `frontend/src/components/system/auth/LoginCard.tsx` | Adiciona prop `error?: string` com exibicao visual |

### Sem novas dependencias

Tudo implementado com React, Next.js e `fetch` nativo.

---

## Fluxo de dados

### Login

```
LoginCard.onSubmit({ email, password })
  → useAuth().login()
    → authService.login() → POST /api/auth/token/
      ← { access, group, primeiro_nome } + cookie refresh (HttpOnly)
    → setAccessToken(access)            // authStore em memoria
    → setUser({ group, primeiro_nome }) // AuthContext state
  → router.push('/dashboard')
```

### Silent refresh (ao montar o dashboard)

```
dashboard monta
  → useAuth().refresh()
    → authService.refreshToken() → POST /api/auth/token/refresh/
      ← { access, group, primeiro_nome }  (refresh lido do cookie automaticamente)
    → setAccessToken(access)
    → setUser({ group, primeiro_nome })
  → se falhar (401) → router.push('/')  // sessao expirada, volta ao login
```

### Logout

```
usuario clica em sair
  → useAuth().logout()
    → authService.logout() → POST /api/auth/logout/
    → clearAccessToken()
    → setUser(null)
  → router.push('/')
```

---

## Contratos de interface

### `authService.ts`

```ts
login(email: string, password: string): Promise<AuthUser>
refreshToken(): Promise<AuthUser>
logout(): Promise<void>

interface AuthUser {
  access: string
  group: string
  primeiro_nome: string
}
```

### `AuthContext`

```ts
interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login(email: string, password: string): Promise<void>
  logout(): Promise<void>
  refresh(): Promise<boolean>  // retorna false se sessao expirada
}
```

### `LoginCard` — nova prop

```ts
error?: string  // mensagem de erro exibida abaixo do botao
```

---

## Tratamento de erros

| Situacao | Mensagem ao usuario |
|----------|---------------------|
| 401 — credenciais invalidas | "Email ou senha incorretos." |
| 429 — rate limit | "Muitas tentativas. Aguarde alguns instantes." |
| 5xx / network error | "Servico indisponivel. Tente novamente." |
| Campos vazios | Validacao nativa do browser (`required`) |

---

## Dashboard placeholder

Conteudo minimo:
- Nome do usuario (`primeiro_nome`) e grupo (`group`)
- Botao "Sair" que chama `useAuth().logout()`
- Estado de carregamento enquanto o silent refresh esta em andamento (evita flash de conteudo)
- Se o refresh falhar, redireciona para `/` automaticamente

---

## Seguranca (OWASP)

| Item | Medida |
|------|--------|
| A02 — Cryptographic Failures | Access token somente em memoria (authStore), nunca em localStorage ou cookie nao-HttpOnly |
| A07 — Auth Failures | Rate limiting ja implementado no backend (ScopedRateThrottle); erros 429 tratados no frontend |
| A05 — Security Misconfiguration | Refresh token em cookie HttpOnly/Secure/SameSite=Lax ja configurado no backend |
| A01 — Broken Access Control | Dashboard verifica sessao via silent refresh; redireciona se invalida |
