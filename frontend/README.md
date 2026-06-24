# GitHub Search — Frontend

React + TypeScript + Redux Toolkit SPA for searching GitHub users and repositories.

## Quick start

```bash
npm install
npm run dev
```

Requires the Django backend on http://localhost:8000 (or use `docker compose up` from repo root).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 5173 |
| `npm run build` | Type-check + production build |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | ESLint (TypeScript + React hooks) |
| `npm run preview` | Preview production build |

## Node.js

Requires **Node.js >= 20.19.0** (Vite 8 requirement).

## Testing

```bash
npm run test           # unit + component tests (Vitest + Testing Library)
npm run test:coverage  # same with coverage report
```

Tests live next to source files (`*.test.ts`, `*.test.tsx`). Shared helpers: `src/test/testUtils.tsx`.
