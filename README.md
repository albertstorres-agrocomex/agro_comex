# AgroComex

Plataforma de inteligencia de mercado para o agronegocio brasileiro. Consolida dados de commodities, derivativos e comercio exterior para oferecer analises quantitativas e visualizacoes interativas.

---

## Indice

- [Stack](#stack)
- [Estrutura do Repositorio](#estrutura-do-repositorio)
- [Pre-requisitos](#pre-requisitos)
- [Configuracao do Ambiente](#configuracao-do-ambiente)
- [Iniciando o Projeto](#iniciando-o-projeto)
  - [1. Redis](#1-redis)
  - [2. Backend — Django API](#2-backend--django-api)
  - [3. Celery Worker](#3-celery-worker)
  - [4. Celery Beat (Tarefas Agendadas)](#4-celery-beat-tarefas-agendadas)
  - [5. Frontend](#5-frontend)
  - [6. Landing Page](#6-landing-page)
- [Endpoints da API](#endpoints-da-api)
- [Deploy](#deploy)

---

## Stack

### Backend
| Tecnologia | Versao | Funcao |
|-----------|--------|--------|
| Python | 3.12+ | Linguagem principal |
| Django | 6.0.3 | Web framework |
| Django REST Framework | 3.17.0 | API REST |
| Celery | 5.6.2 | Fila de tarefas assincrona |
| Redis | 6.x | Message broker do Celery |
| PostgreSQL | 15+ | Banco de dados relacional |
| django-celery-beat | 2.9.0 | Agendamento de tarefas (cron) |
| django-celery-results | 2.6.0 | Persistencia de resultados de tarefas |

### Frontend
| Tecnologia | Versao | Funcao |
|-----------|--------|--------|
| Next.js | 16.1.6 | React framework (app) |
| React | 19.2.3 | UI library |
| TypeScript | 5 | Tipagem estatica |
| Tailwind CSS | 4 | Estilizacao utilitaria |
| shadcn/ui | 3.8.5 | Componentes base |
| Recharts | 3.8.0 | Graficos |
| react-simple-maps | 3.0.0 | Mapa mundial interativo |

---

## Estrutura do Repositorio

```
agro_comex/
├── backend/                    # Django REST API + Celery
│   ├── core/                   # Configuracoes do projeto (settings, urls, celery)
│   ├── commodities/            # Catalogo de commodities
│   ├── tipos_derivativo/       # Tipos de derivativos e parametros
│   ├── meses_contrato_futuro/  # Calendarios de contratos futuros
│   ├── dados/                  # Cache de dados de mercado
│   ├── analises/               # Solicitacoes e resultados de analises
│   ├── usuario/                # Perfil de usuario
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/                   # Aplicacao principal (Next.js)
│   └── src/
│       ├── app/                # Paginas e rotas
│       ├── components/         # Componentes visuais e ui/
│       └── lib/                # Utilitarios
└── landing_page/               # Site de marketing (Next.js)
```

---

## Arquitetura

### Visao geral das camadas

```
┌──────────────────────────────────────────────────────────────┐
│  APRESENTACAO                                                │
│  Next.js + React + Tailwind + Recharts + react-simple-maps  │
│  Vercel (frontend) / Vercel (landing page)                  │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP REST (JSON)
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  API                                                         │
│  Django REST Framework — /api/v1/                           │
│  CRUD de todos os modelos + disparo de tarefas async        │
│  Render                                                      │
└──────────┬──────────────────────────────────────────────────┘
           │ enfileira via .delay()
           ▼
┌──────────────────────────────────────────────────────────────┐
│  MESSAGE BROKER                                              │
│  Redis — redis://localhost:6379/0                           │
│  Fila de tarefas Celery + cache de resultados               │
└──────────┬─────────────────────────────┬────────────────────┘
           │                             │
           ▼                             ▼
┌─────────────────────┐     ┌────────────────────────────────┐
│  CELERY WORKER      │     │  CELERY BEAT                   │
│  Executa tarefas    │     │  Agendador de tarefas          │
│  assincromas        │     │  periodicas (cron)             │
│  (analises,         │     │  (coleta diaria de precos:     │
│   coleta de dados)  │     │   BCB, B3, CEPEA)              │
└─────────┬───────────┘     └────────────┬───────────────────┘
          │                              │
          └──────────────┬───────────────┘
                         │ leitura / escrita
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  PERSISTENCIA                                                │
│  PostgreSQL                                                  │
│  Modelos de dominio + resultados de tarefas (celery-results) │
│  + agendamentos (celery-beat)                               │
└──────────────────────────────────────────────────────────────┘
```

### Fluxo de dados — Solicitacao de analise

```
1. Frontend  →  POST /api/v1/solicitacao_analise/
               (commodity, tipo_derivativo, parametros)

2. API       →  cria SolicitacaoAnalise [status: aguardando]
            →  enfileira processar_analise.delay(id)

3. Redis     →  armazena a tarefa na fila

4. Worker    →  consume a tarefa
            →  atualiza status para [processando]
            →  executa calculo de preco/volatilidade
            →  cria ResultadoAnalise no banco
            →  atualiza status para [concluido] ou [erro]

5. Frontend  →  consulta GET /api/v1/solicitacao_analise/{id}/
            →  exibe resultado quando status == concluido
```

### Fluxo de dados — Coleta periodica de mercado

```
1. Celery Beat  →  dispara tarefa no horario agendado
                   (ex: 19h BRT para cambio BCB)

2. Worker       →  chama API externa (python-bcb, B3, CEPEA)
               →  normaliza os dados recebidos
               →  faz upsert em CacheDadosMercado

3. PostgreSQL   →  armazena preco de fechamento indexado por
                   (commodity, data_preco, fonte)

4. Worker de    →  le CacheDadosMercado para calcular
   analise         volatilidade historica
```

### Fluxos por tipo de comunicacao

| Tipo | Caminho | Caracteristica |
|------|---------|---------------|
| Sincrono | Frontend -> API -> PostgreSQL | Resposta imediata |
| Assincrono | API -> Redis -> Worker -> PostgreSQL | Frontend consulta status |
| Agendado | Beat -> Redis -> Worker -> APIs externas -> PostgreSQL | Background, sem interacao do usuario |

---

## Pre-requisitos

Instale as seguintes ferramentas antes de prosseguir:

- **Python 3.12+** — [python.org](https://www.python.org/downloads/)
- **Node.js 20+** — [nodejs.org](https://nodejs.org/)
- **PostgreSQL 15+** — [postgresql.org](https://www.postgresql.org/download/)
- **Redis 7+** — [redis.io](https://redis.io/docs/getting-started/installation/)

Verifique as versoes instaladas:

```bash
python --version
node --version
psql --version
redis-cli --version
```

---

## Configuracao do Ambiente

### 1. Clone o repositorio

```bash
git clone <url-do-repositorio>
cd agro_comex
```

### 2. Crie o banco de dados PostgreSQL

```bash
psql -U postgres -c "CREATE DATABASE agro_comex;"
```

### 3. Configure as variaveis de ambiente do backend

```bash
cd backend
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
SECRET_KEY=troque-por-uma-chave-segura-e-longa
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=agro_comex
DB_USER=postgres
DB_PASSWORD=sua-senha-aqui
DB_HOST=localhost
DB_PORT=5432

REDIS_URL=redis://localhost:6379/0
```

### 4. Crie o ambiente virtual Python e instale as dependencias

```bash
# ainda dentro de backend/
python -m venv venv

# Linux / macOS
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install -r requirements.txt
```

### 5. Execute as migracoes do banco de dados

```bash
python manage.py migrate
```

### 6. Crie um superusuario (opcional, para acesso ao admin Django)

```bash
python manage.py createsuperuser
```

---

## Iniciando o Projeto

O projeto requer quatro processos rodando simultaneamente em terminais separados: **Redis**, **Django API**, **Celery Worker** e **Celery Beat**. Abra um terminal para cada.

### 1. Redis

O Redis e o message broker utilizado pelo Celery. Deve ser o primeiro processo a iniciar.

**Linux / macOS:**
```bash
redis-server
```

**Via systemd (se instalado como servico):**
```bash
sudo systemctl start redis
sudo systemctl status redis
```

**Windows (via WSL ou instalacao nativa):**
```bash
redis-server
```

Verifique se o Redis esta respondendo:
```bash
redis-cli ping
# Esperado: PONG
```

---

### 2. Backend — Django API

Em um novo terminal, ative o ambiente virtual e inicie o servidor de desenvolvimento:

```bash
cd backend
source venv/bin/activate   # Linux/macOS
# ou: venv\Scripts\activate no Windows

python manage.py runserver
```

A API estara disponivel em: `http://localhost:8000`

O painel de administracao Django estara em: `http://localhost:8000/admin`

---

### 3. Celery Worker

O Celery Worker processa as tarefas assincromas (analises, coleta de dados de mercado, etc.).

Em um novo terminal:

```bash
cd backend
source venv/bin/activate   # Linux/macOS

celery -A core worker --loglevel=info
```

Opcoes uteis para desenvolvimento:

```bash
# Aumentar verbosidade dos logs
celery -A core worker --loglevel=debug

# Limitar o numero de processos workers (util em maquinas com pouca RAM)
celery -A core worker --loglevel=info --concurrency=2
```

O worker esta pronto quando exibir a mensagem:
```
[tasks]
  . analises.tasks.<nome_da_task>
  ...
[yyyy-mm-dd hh:mm:ss,ms: INFO/MainProcess] celery@<hostname> ready.
```

---

### 4. Celery Beat (Tarefas Agendadas)

O Celery Beat dispara tarefas periodicas (ex: atualizacao automatica de precos de mercado). Requer que o worker ja esteja rodando.

Em um novo terminal:

```bash
cd backend
source venv/bin/activate   # Linux/macOS

celery -A core beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

Os agendamentos sao configurados via painel Django Admin em:
`http://localhost:8000/admin/django_celery_beat/`

---

### 5. Frontend

Em um novo terminal:

```bash
cd frontend
npm install        # somente na primeira vez
npm run dev
```

A aplicacao estara disponivel em: `http://localhost:3000`

O styleguide de componentes e tokens de design esta em: `http://localhost:3000/styleguide`

---

### 6. Landing Page

Em um novo terminal (opcional para desenvolvimento):

```bash
cd landing_page
npm install        # somente na primeira vez
npm run dev
```

A landing page estara disponivel em: `http://localhost:3001` (ou porta alternativa exibida no terminal)

---

### Resumo das portas

| Servico | Porta | URL |
|---------|-------|-----|
| Redis | 6379 | `redis://localhost:6379` |
| Django API | 8000 | `http://localhost:8000` |
| Django Admin | 8000 | `http://localhost:8000/admin` |
| Frontend (app) | 3000 | `http://localhost:3000` |
| Landing Page | 3001 | `http://localhost:3001` |

---

## Endpoints da API

Base URL: `http://localhost:8000/api/v1/`

| Recurso | Endpoint | Metodos |
|---------|----------|---------|
| Usuarios | `/usuario/` | GET, POST, PUT, PATCH, DELETE |
| Commodities | `/commodities/` | GET, POST, PUT, PATCH, DELETE |
| Tipos de Derivativo | `/tipos_derivativo/` | GET, POST, PUT, PATCH, DELETE |
| Meses de Contrato Futuro | `/meses_contrato_futuro/` | GET, POST, PUT, PATCH, DELETE |
| Cache de Dados de Mercado | `/cache_dados_mercado/` | GET, POST, PUT, PATCH, DELETE |
| Solicitacoes de Analise | `/solicitacao_analise/` | GET, POST, PUT, PATCH, DELETE |
| Resultados de Analise | `/resultado_analise/` | GET, POST, PUT, PATCH, DELETE |

---

## Deploy

| Componente | Plataforma | Branch de Producao |
|-----------|-----------|-------------------|
| Backend (API + Celery) | Render | `main` |
| Frontend (app) | Vercel | `main` |
| Landing Page | Vercel | `main` |

O branch `hml` e utilizado como ambiente de homologacao (staging).
