# GitHub Search Application

A fullstack single-page application for searching GitHub users and repositories, built with **React.js** + **Django DRF** + **Redis**.

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
| **`min_length=3` on query serializer** | Mirrors frontend debounce rule at the API level — rejects short queries before hitting GitHub |
| **`drf-spectacular` (Swagger)** | Auto-generated OpenAPI docs from existing serializers with zero extra maintenance |
| **CORS via `django-cors-headers`** | Allows React dev server (port 5173) to call the API without browser CORS errors |

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
- Redis running on `localhost:6379` (or via Docker)

### Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd tdj/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and edit environment variables
cp .env.example .env
# → Set GITHUB_TOKEN for higher rate limits (5000 req/h vs 60)

# Run the dev server
python manage.py runserver
```

### With Docker Compose

```bash
# From the repo root
cp backend/.env.example backend/.env
# Edit backend/.env and set your GITHUB_TOKEN

docker compose up --build
```

- Backend: http://localhost:8000
- Swagger: http://localhost:8000/api/docs/

---

## Running Tests

```bash
cd backend
pytest -v
```

All tests use mocks — **no Redis or GitHub API connection needed**.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DJANGO_SECRET_KEY` | `fallback-dev-key` | Django secret key |
| `DJANGO_DEBUG` | `True` | Debug mode |
| `GITHUB_TOKEN` | *(empty)* | GitHub Personal Access Token (raises rate limit to 5000/h) |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection URL |
| `CACHE_TTL` | `7200` | Cache TTL in seconds (2 hours) |
