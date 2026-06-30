# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Carteira** is a single-user (no auth — just me) investment portfolio tracker for the Brazilian stock market (B3). It imports B3 transaction spreadsheets (`.xlsx`), consolidates positions per asset (quantity, average price, invested amount, dividends, profitability), and syncs market quotes from Yahoo Finance. The frontend (React/Vite) proxies all `/api` calls to the backend (FastAPI), which persists data in PostgreSQL.

## Development Commands

### Local Development

```bash
# Postgres (local ou via docker run)
# Backend: criar backend/.env (copiar de backend/.env.example)

cd backend
alembic upgrade head                       # aplica migrações
uvicorn src.main:app --reload --port 8000  # http://localhost:8000

cd frontend
npm run dev                                # http://localhost:5173 (proxy /api → :8000)
```

### Quote sync worker (yfinance)

```bash
cd backend
python -m src.jobs.run_stock_sync --once --force   # sincroniza uma vez (ignora janela de mercado)
python -m src.jobs.run_stock_sync                  # roda agendado (a cada 30 min, em pregão)
```

### Build & Lint

```bash
cd frontend && npm run build     # tsc + vite → dist/
cd frontend && npm run lint      # ESLint
```

### Docker (full stack)

```bash
cp .env.example .env
docker-compose up --build        # http://localhost:8080 (WEB_PORT no .env)
```

No Docker, o container do backend roda `alembic upgrade head`, sobe o worker de cotações em background e serve a API com uvicorn.

## Architecture

### Data Flow

```
Browser → Vite dev proxy (ou Nginx em prod)
        → FastAPI backend (:8000, prefixo /api/v1)
        → PostgreSQL
        ↘ Yahoo Finance (yfinance, externo) — via worker de cotações
```

### Backend (`backend/src/`)

Arquitetura modular limpa: cada feature em `modules/<Feature>/` com `router → service → repository → model/schema`.

- **`main.py`** — app FastAPI, CORS, registro de routers, `GET /health`
- **`core/config.py`** — `Settings` (pydantic-settings): DB, `SINGLE_USER_ID`, parâmetros do sync
- **`core/database.py`** — engine/sessão async do SQLAlchemy (`get_db`)
- **`core/security.py`** — `get_current_user_id()` retorna `settings.SINGLE_USER_ID` (app sem autenticação)
- **`core/exceptions.py`** — `BusinessException` + handlers globais
- **`modules/Upload/`** — importação de Excel da B3 (`b3_parser_service.py` com openpyxl; hash SHA256 anti-duplicado)
- **`modules/Portfolio/`** — cálculo da carteira (`portfolio_service.py`: agrupa por ticker, custo médio, dividendos, rentabilidade) + lançamento manual
- **`modules/MarketData/`** — cotações via `yfinance_client.py`; `stock_sync_service.py` + `stock_sync_scheduler.py` (worker)
- **`jobs/run_stock_sync.py`** — entrypoint do worker (`--once`, `--force`)
- **`alembic/`** — migrações versionadas (rodar `alembic upgrade head`)

### Frontend (`frontend/src/`)

- **`App.tsx`** — `BrowserRouter` + layout (Sidebar + content); rotas `/investimentos` e `/gastos`
- **`components/Sidebar/`** — menu lateral padrão (colapsável, nav inferior no mobile), ícones SVG inline em `Sidebar.icons.tsx`
- **`pages/InvestmentsPage/`** — dashboard da carteira (envolve `PortfolioProvider`)
- **`pages/ExpensesPage/`** — placeholder "Em breve" (Controle de Gastos virá depois)
- **`components/`** — `PortfolioActions`, `BigNumbers`, `Charts`, `AssetsTable`
- **`context/PortfolioContext.tsx`** — estado global da carteira
- **`services/api.ts`** — `fetch` para `import.meta.env.VITE_API_URL ?? '/api/v1'`
- **`styles/global.css`** — design tokens (`--color-*`) e keyframes globais

### API Endpoints

- `POST /api/v1/upload/` — importa Excel da B3 (multipart `file`)
- `GET /api/v1/uploads` — lista uploads
- `DELETE /api/v1/uploads/:id` — remove upload (e transações em cascata)
- `GET /api/v1/portfolio/` — resumo consolidado da carteira
- `POST /api/v1/portfolio/manual` — lançamento manual
- `GET /api/v1/portfolio/:ticker` — detalhe de um ativo
- `GET /health` — healthcheck

### Database Schema

`uploads` — `id` PK, `user_id`, `filename`, `file_hash`, `created_at`
`transactions` — `id` PK, `upload_id` FK→uploads (cascade), `user_id`, `ticker`, `operation_type`, `entry_side`, `date`, `quantity`, `unit_price`, `operation_value`
`stock_prices` — `(ticker, date)` PK, `open`, `high`, `low`, `close`, `volume`, `created_at`

> App de usuário único: `user_id` é sempre `settings.SINGLE_USER_ID` (`"local"`). As colunas existem mas não há escopo multiusuário.

## Key Conventions

### Language

- **Code** (variáveis, funções, tipos, arquivos): English
- **User-facing strings** (mensagens de API, UI): Português

### Python (backend)

- FastAPI assíncrono; SQLAlchemy async (asyncpg). Migrações via Alembic — não criar tabelas em runtime.
- Imports absolutos por pacote: `from src.core.config import settings`
- Estrutura por módulo: `router → service → repository → model/schema`. Routers são finos.
- Validação com Pydantic (schemas em `modules/<Feature>/schemas/`).

### TypeScript (frontend)

- Strict mode — sem `any`
- `moduleResolution: bundler` (sem extensão em imports, exceto `.tsx` quando necessário)

### Styling

- CSS Modules (`.module.css`) por componente — sem bibliotecas de UI
- Sempre usar os tokens de `styles/global.css` (cores, spacing, radius, sombras) — nunca hardcode

### State Management

- React hooks + Context API (`useState`, `useContext`, `useReducer`) — sem Redux/Zustand
- Sem comentários no código

### HTTP Status Codes

- `201` create, `204` delete, `400` validação, `404` not found, `409` conflito, `500` erro

## External Integration: Yahoo Finance

- Cotações via `yfinance`; os tickers são derivados das transações da carteira (sufixo `.SA` para B3) — só busca o que o usuário possui
- Busca em **lote único** (`yf.download`) por execução; o preço atual vem do close intraday do candle do dia
- Worker roda **a cada 30 min** dentro da janela de pregão (`STOCK_SYNC_START_HOUR`–`END_HOUR`, timezone `America/Sao_Paulo`)

## Environment Variables

`backend/.env` (copiar de `backend/.env.example`):

```
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
SINGLE_USER_ID (default "local")
ALLOWED_ORIGINS, MARKET_DATA_TIMEZONE, STOCK_SYNC_*
```

`.env` na raiz (Docker, copiar de `.env.example`):

```
POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, WEB_PORT
```

## Fluxo de trabalho

- Para tarefas que envolvam mais de um arquivo, apresente um plano e aguarde aprovação antes de editar.
- Tarefas simples (1 arquivo, mudança pequena) pode executar direto.
