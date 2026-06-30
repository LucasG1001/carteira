# Carteira

Rastreador de carteira de investimentos da **B3** (uso pessoal, usuário único). Importa planilhas de transações da B3 (`.xlsx`), consolida a posição por ativo (quantidade, preço médio, valor investido, dividendos e rentabilidade) e sincroniza cotações do Yahoo Finance.

## Stack

- **Backend:** Python · FastAPI (async) · SQLAlchemy · Alembic · PostgreSQL · openpyxl · yfinance
- **Frontend:** React 19 · TypeScript · Vite · React Router · Recharts
- **Infra:** Docker · Nginx

## Arquitetura

```
Browser → Vite (dev) / Nginx (prod) → FastAPI (:8000, /api/v1) → PostgreSQL
                                                               ↘ Yahoo Finance (worker yfinance)
```

Backend modular: cada feature em `modules/<Feature>/` seguindo `router → service → repository → model/schema`.

## Rodando com Docker (recomendado)

```bash
cp .env.example .env             # ajuste POSTGRES_* e CARTEIRA_DOMAIN
docker network create proxy-net  # uma vez na VPS (rede do proxy reverso central)
docker-compose up --build -d
```

Servido via `https://${CARTEIRA_DOMAIN}` pelo proxy reverso central (Caddy, só na VPN). O `web` serve o build estático com **Caddy** e faz proxy de `/api` → backend; o container do backend aplica as migrações (`alembic upgrade head`), sobe o worker de cotações e serve a API.

## Desenvolvimento local

Pré-requisitos: Python 3.12+, Node 22+, PostgreSQL.

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                 # ajuste as credenciais do banco
alembic upgrade head
uvicorn src.main:app --reload --port 8000            # http://localhost:8000
```

Docs interativas da API: `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev                                          # http://localhost:5173
```

O dev server faz proxy de `/api` para `http://localhost:8000`.

### Worker de cotações

```bash
cd backend
python -m src.jobs.run_stock_sync --once --force     # sincroniza uma vez agora
python -m src.jobs.run_stock_sync                    # roda agendado (a cada 30 min, em pregão)
```

Os tickers são derivados automaticamente das transações da carteira (sufixo `.SA` para a B3); só busca cotação dos ativos que você possui.

## Endpoints

| Método | Rota | Descrição |
| ------ | ---- | --------- |
| POST | `/api/v1/upload/` | Importa Excel da B3 (multipart `file`) |
| GET | `/api/v1/uploads` | Lista uploads |
| DELETE | `/api/v1/uploads/:id` | Remove upload e suas transações |
| GET | `/api/v1/portfolio/` | Resumo consolidado da carteira |
| POST | `/api/v1/portfolio/manual` | Lançamento manual |
| GET | `/api/v1/portfolio/:ticker` | Detalhe de um ativo |
| GET | `/health` | Healthcheck |

## Variáveis de ambiente

**`backend/.env`** (dev local): `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `SINGLE_USER_ID`, `ALLOWED_ORIGINS`, `MARKET_DATA_TIMEZONE`, `STOCK_SYNC_*`.

**`.env`** (raiz, Docker): `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `CARTEIRA_DOMAIN`.

## Estrutura

```
carteira/
├── backend/                # FastAPI + Alembic
│   ├── src/
│   │   ├── core/           # config, database, security, exceptions
│   │   ├── modules/        # Upload, Portfolio, MarketData
│   │   └── jobs/           # worker de cotações
│   └── alembic/            # migrações
├── frontend/               # React + Vite
│   └── src/{components,pages,context,services,styles}
├── docker-compose.yml
└── CLAUDE.md
```

Convenções e detalhes de arquitetura: ver [CLAUDE.md](./CLAUDE.md).
