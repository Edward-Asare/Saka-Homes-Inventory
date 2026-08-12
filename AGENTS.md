# Saka Homes Inventory

Full-stack inventory dashboard: Express/MongoDB API (`backend/`) + React + Vite + Tailwind UI (`frontend/`). See `README.md` for the app overview, API routes, and demo credentials.

## Cursor Cloud specific instructions

### Services

| Service | Dir | Dev command | URL | Notes |
|---------|-----|-------------|-----|-------|
| MongoDB | – | see below | `mongodb://127.0.0.1:27017` | Required by the backend; must be started manually |
| Backend API | `backend/` | `npm run dev` | http://localhost:5000 | Express + Mongoose, `node --watch` hot reload |
| Frontend | `frontend/` | `npm run dev` | http://localhost:5173 | Vite; proxies `/api` → `:5000` (see `frontend/vite.config.js`) |

### MongoDB is not managed by systemd

MongoDB Community 8.0 is installed in the VM image, but there is no systemd/service manager, so `mongod` does NOT auto-start. Start it manually before running the backend or seeding (a `data/` dir persists across snapshots):

```bash
mkdir -p "$HOME/mongodb-data"
mongod --dbpath "$HOME/mongodb-data" --port 27017 --bind_ip 127.0.0.1
```

Run it in a background/tmux session and confirm it is up with `mongosh --quiet --eval 'db.runCommand({ping:1})'`.

### Backend env + seeding

- The backend reads `backend/.env` (via `dotenv`). If missing, `cp backend/.env.example backend/.env` — the defaults point at the local MongoDB and work as-is for dev.
- Seed the demo user + sample items with `npm run seed --prefix backend` (this wipes and reseeds `users`/`items`). Demo login: `admin@sakahomes.com` / `password123`. Only needed after a fresh/empty database.

### Lint / build / test

- Frontend lint: `npm run lint --prefix frontend` (oxlint). A single `react(only-export-components)` warning on `AuthContext.jsx` is pre-existing and non-blocking.
- Frontend build: `npm run build --prefix frontend` (vite build).
- There are no automated test suites and no backend lint script in this repo.

### Gotchas

- The frontend talks to the backend only through the Vite dev-proxy, so the backend must be running on `:5000` or all `/api` calls fail.
- Node 22 is installed and satisfies the README's "Node 18+" requirement (`node --watch` is used for backend hot reload).
