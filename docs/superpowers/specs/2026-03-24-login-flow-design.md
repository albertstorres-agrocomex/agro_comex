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
- Implementar silent refresh ao inicializar o `AuthProvider`
- Exibir feedback de erro no formulario
- Criar pagina placeholder `/dashboard`

Fora do escopo: protecao de rotas generica, pagina de recuperacao de senha, perfil do usuario, integracao com interceptor axios existente.

---

## Arquitetura

### Arquivos a criar

| Arquivo | Responsabilidade |
|---------|-----------------|
| `frontend/src/services/authService.ts` | Chamadas HTTP de autenticacao (login, refresh, logout) |
| `frontend/src/contexts/AuthContext.tsx` | Estado global de autenticacao; expoe `useAuth()` |
| `frontend/src/app/providers.tsx` | Client Component wrapper para `AuthProvider` (necessario pois `layout.tsx` e Server Component) |
| `frontend/src/app/dashboard/page.tsx` | Placeholder do dashboard com verificacao de sessao e logout |

### Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `frontend/src/app/layout.tsx` | Importa e usa `<Providers>` ao redor do `{children}` |
| `frontend/src/app/page.tsx` | Adicionar `"use client"` no topo; usar `useAuth`, `useState`, `useRouter` de `next/navigation` |
| `frontend/src/components/system/auth/LoginCard.tsx` | Adicionar prop `error?: string`; remover `noValidate` do `<form>` |

### Sem novas dependencias

Tudo implementado com React, Next.js e `fetch` nativo.

---

## Separacao de responsabilidades: token vs. perfil

```ts
// Resposta bruta da API (authService interno)
interface LoginResponse {
  access: string       // JWT — vai para authStore via setAccessToken(), nunca exposto pelo context
  group: string
  primeiro_nome: string
}

// Perfil armazenado no AuthContext (sem token)
interface UserProfile {
  group: string
  primeiro_nome: string
}
```

---

## Constraint: Server Components e Client Components

`layout.tsx` e um Server Component (exporta `metadata`). Context providers exigem `"use client"`. A solucao e um wrapper:

```
app/
  layout.tsx          ← Server Component, importa <Providers>
  providers.tsx       ← "use client" — renderiza <AuthProvider>
  page.tsx            ← adicionar "use client" (usa useAuth, useState, useRouter)
```

`page.tsx` usa `useRouter` de `next/navigation` (App Router). Importacoes de imagens estaticas (`import bgImage from ...`) funcionam normalmente em Client Components no Next.js 14 — nenhuma mudanca necessaria nessa parte.

---

## Fluxo de dados

### Inicializacao do AuthProvider

`isLoading` deve ser inicializado como `true`. O `AuthProvider` tenta o refresh silencioso imediatamente ao montar:

```
AuthProvider monta
  isLoading = true  ← valor inicial
  → authService.refreshToken() → POST /api/auth/token/refresh/
    → se OK:
        setAccessToken(data.access)             // authStore em memoria
        setUser({ group: data.group, primeiro_nome: data.primeiro_nome })
    → se falhar (401/network):
        user = null  (nao redireciona — apenas nao autentica)
  → isLoading = false
```

### Login

```
LoginCard.onSubmit({ email, password })
  → useAuth().login()
    → authService.login() → POST /api/auth/token/
      ← { access, group, primeiro_nome } + cookie refresh (HttpOnly)
    → setAccessToken(data.access)
    → setUser({ group: data.group, primeiro_nome: data.primeiro_nome })
  → router.push('/dashboard')   // useRouter de next/navigation
```

### Logout — best-effort

O logout e best-effort: independentemente da resposta do servidor, o estado local e sempre limpo.
`router.push` e responsabilidade do componente chamador (ex: Dashboard), nao do `AuthContext`, pois `useRouter` nao pode ser chamado dentro de um provider.

```
// Dentro do AuthContext — apenas limpa estado
useAuth().logout()
  → authService.logout() → POST /api/auth/logout/  (pode falhar — ignorado)
  → clearAccessToken()    // sempre executado
  → setUser(null)         // sempre executado

// No componente (ex: Dashboard) — faz o redirecionamento
await logout()
router.push('/')          // useRouter do next/navigation, chamado no componente
```

---

## Contratos de interface

### `authService.ts`

Todas as chamadas usam `credentials: 'include'` para envio automatico do cookie HttpOnly.
`API_BASE_URL` e importado de `../config/apiConfig` (relativo a `src/services/authService.ts`).

```ts
import { API_BASE_URL } from '../config/apiConfig'

login(email: string, password: string): Promise<LoginResponse>
refreshToken(): Promise<LoginResponse>
logout(): Promise<void>
```

### `AuthContext`

```ts
interface UserProfile {
  group: string
  primeiro_nome: string
}

interface AuthContextValue {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean           // inicia como true; false apos tentativa de refresh inicial
  login(email: string, password: string): Promise<void>  // lanca excecao em caso de erro; o chamador (page.tsx) faz try/catch e define o estado de erro
  logout(): Promise<void>      // apenas limpa estado local; nao faz router.push
}
```

`useAuth()` deve ter guard de null: `createContext<AuthContextValue | null>(null)` com throw se usado fora de `AuthProvider`.

### `LoginCard` — mudancas

```ts
// Nova prop
error?: string  // mensagem de erro exibida com role="alert" e cor --destructive

// Remover noValidate do <form> — validacao nativa do browser fica ativa
```

O elemento de erro deve ter `role="alert"` para ser anunciado por leitores de tela. Exibido entre o botao "Entrar" e o rodape do card, empurrando o layout (sem overlay).

---

## Tratamento de erros no login

| Situacao | Mensagem ao usuario |
|----------|---------------------|
| 401 — credenciais invalidas | "Email ou senha incorretos." |
| 429 — rate limit | "Muitas tentativas. Aguarde alguns instantes." |
| 5xx / network error | "Servico indisponivel. Tente novamente." |
| Campos vazios | Validacao nativa do browser (`required`) — funciona apos remocao de `noValidate` |

---

## Dashboard placeholder

```
dashboard monta
  → isLoading verdadeiro? → exibir loading spinner (evita flash)
  → isLoading false e isAuthenticated false → router.push('/')
  → isLoading false e isAuthenticated true → renderizar conteudo
```

Conteudo:
- `user.primeiro_nome` e `user.group`
- Botao "Sair" que chama `useAuth().logout()`

---

## Seguranca (OWASP)

| Item | Medida |
|------|--------|
| A02 — Cryptographic Failures | Access token somente em memoria (authStore). `AuthContext.user` nunca expoe o token JWT. |
| A07 — Auth Failures | Rate limiting no backend (ScopedRateThrottle); erros 429 tratados no frontend |
| A05 — Security Misconfiguration | Refresh token em cookie HttpOnly/Secure/SameSite=Lax configurado no backend |
| A01 — Broken Access Control | Dashboard verifica `isAuthenticated` apos `isLoading = false`; redireciona se invalido |
| A02 — fetch credentials | Todas as chamadas do `authService` usam `credentials: 'include'` |
| A04 — Insecure Design | Logout e best-effort: estado local sempre limpo, independente da resposta do servidor |
