# GitHub Search Application

A fullstack single-page application for searching GitHub users and repositories, built with **React.js** + **TypeScript** + **Django DRF** + **Redis**.

---

## Architecture

```
┌─────────────────┐        ┌───────────────────────┐        ┌──────────────────┐
│   React SPA     │──POST──▶   Django DRF Backend   │──GET──▶   GitHub API      │
│  (port 5173)    │        │      (port 8000)        │        │  api.github.com  │
└─────────────────┘        └──────────┬────────────-─┘        └──────────────────┘
                                      │ cache set/get
                                      ▼
                             ┌─────────────────┐
                             │   Redis Cache   │
                             │  (2h TTL)       │
                             └─────────────────┘
```

### Key Decisions

| Decision | Reason |
|---|---|
| **Redis via django-redis** | Production-grade caching with `django.core.cache` interface; easy to swap in tests with `LocMemCache` |
| **Cache key = `github_search:{type}:{query_lowercase}`** | Case-insensitive deduplication — "Django" and "django" hit the same cache entry |
| **24 results per page (`per_page=24`)** | Fits a 3-column grid cleanly; avoids over-fetching |
| **Pagination (bonus)** | `page` param on `/api/search/`; each page cached separately; Prev/Next on the frontend |
| **`min_length=3` on query serializer** | Mirrors frontend debounce rule at the API level — rejects short queries before hitting GitHub |
| **`drf-spectacular` (Swagger)** | Auto-generated OpenAPI docs from existing serializers with zero extra maintenance |
| **CORS via `django-cors-headers`** | Allows React dev server (port 5173) to call the API without browser CORS errors |
| **Redux Toolkit + redux-persist** | Client-side cache with 2h TTL; no repeat API calls for the same query + entity type |
| **Vite dev proxy (`/api` → backend)** | No hardcoded API URL in development; avoids CORS issues locally |
| **No React Router** | Single-page search UI with no routes — router adds unnecessary complexity |

---

## Frontend

### Stack

- **React 19** + **TypeScript** + **Vite 8**
- **Sass** (CSS Modules) — no CSS frameworks
- **Redux Toolkit** + **redux-persist** — client cache (2h TTL, composite key `type:query`)
- **lodash/debounce** — 400ms debounce before search

### Running locally

**Prerequisites:** Node.js >= 20.19, backend running on port 8000

```bash
cd frontend
cp .env.example .env   # optional
npm install
npm run dev
```

Open http://localhost:5173 — API calls go to `/api/search/` via Vite proxy.

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | *(empty)* | Production API origin (set at **build** time). Empty = relative `/api` paths |
| `VITE_PROXY_TARGET` | `http://localhost:8000` | Vite dev server proxy target (Docker: `http://backend:8000`) |

### Manual test checklist

1. Initial screen — form centered
2. Type `ab` (2 chars) — centered, no API call
3. Type `django` — debounced search, 3-column grid (desktop)
4. Repeat `django` — no second API call (client cache)
5. Switch User → Repository — new results
6. Clear input — centered empty screen
7. Resize to <=768px — 2-column grid
8. Backend down / rate limit — error message + Retry
9. Search with 100+ results — pagination appears; Next/Prev loads page 2 (cached on repeat)

---

## Backend

### Stack
- **Django 4.2** + **Django REST Framework**
- **Redis 7** (via `django-redis`)
- **drf-spectacular** — Swagger/OpenAPI docs
- **pytest** + **pytest-django** — unit tests

### Endpoints

| Method | URL | Description |
|---|---|---|
| `POST` | `/api/search/` | Search GitHub users or repositories |
| `POST` | `/api/clear-cache/` | Clear all cached results from Redis |
| `GET` | `/api/docs/` | Swagger UI |
| `GET` | `/api/schema/` | OpenAPI schema (JSON) |

#### `POST /api/search/`

**Request body:**
```json
{
  "query": "django",
  "search_type": "repositories"
}
```
- `query` — string, min 3 chars, max 256 chars (**required**)
- `search_type` — `"users"`, `"repositories"`, or `"issues"` (**required**)

**Response 200:**
```json
{
  "results": [...],
  "total_count": 42150,
  "cached": false,
  "search_type": "repositories",
  "query": "django"
}
```

**Error responses:**

| Status | Meaning |
|---|---|
| `400` | Validation error (query too short / invalid type) |
| `429` | GitHub API rate limit exceeded |
| `504` | GitHub API timeout |
| `502` | GitHub API unreachable |

---

## Running Locally

### Prerequisites
- Python 3.10+
- Node.js >= 20.19
- Redis running on `localhost:6379` (or via Docker)

### Backend setup

```bash
git clone <your-repo-url>
cd tdj/backend

python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Set GITHUB_TOKEN for higher rate limits (5000 req/h vs 60)

python manage.py runserver
```

### Frontend setup

```bash
cd ../frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Swagger: http://localhost:8000/api/docs/

### With Docker Compose

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and set your GITHUB_TOKEN

docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000

---

## Running Tests

### Backend

```bash
cd backend
pytest -v
```

All backend tests use mocks — **no Redis or GitHub API connection needed**.

### Frontend

```bash
cd frontend
npm run test
npm run test:coverage
```

Vitest + Testing Library. Test helpers live in `frontend/src/test/testUtils.tsx`. The test store uses plain reducers (no `redux-persist`) for reliable unit tests.

---

## Deploy

| Component | Suggested platform | Notes |
|---|---|---|
| Frontend | Vercel / Netlify | Set `VITE_API_BASE_URL=https://your-api.example.com` in build env |
| Backend + Redis | Render / Railway / Fly | Set `GITHUB_TOKEN`, `REDIS_URL` |

Push to a **public GitHub repository** and share the live URLs.

---

## Environment Variables

### Backend

| Variable | Default | Description |
|---|---|---|
| `DJANGO_SECRET_KEY` | `fallback-dev-key` | Django secret key |
| `DJANGO_DEBUG` | `True` | Debug mode |
| `GITHUB_TOKEN` | *(empty)* | GitHub Personal Access Token (raises rate limit to 5000/h) |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection URL |
| `CACHE_TTL` | `7200` | Cache TTL in seconds (2 hours) |

### Frontend

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | *(empty)* | API origin for production builds |
| `VITE_PROXY_TARGET` | `http://localhost:8000` | Dev proxy target (Docker: `http://backend:8000`) |
