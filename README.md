# Saka Homes Inventory

Full-stack inventory dashboard for Saka Homes — Express/MongoDB API and React + Tailwind UI.

## Structure

```
backend/    Node.js + Express + MongoDB REST API
frontend/   React (Vite) + Tailwind CSS dashboard
```

## Prerequisites

Install these on your computer before running the app:

1. **Git** — https://git-scm.com/downloads  
2. **Node.js 18+ (LTS)** — https://nodejs.org  
3. **MongoDB** — easiest option is **Docker Desktop**: https://www.docker.com/products/docker-desktop/

After installing Node.js, open a new terminal and check:

```bash
node -v
npm -v
```

Both commands should print a version number.

---

## Quick start (Windows beginners)

### 1. Clone the repo

Open **PowerShell** or **Cursor Terminal**, then run:

```powershell
git clone https://github.com/Edward-Asare/Saka-Homes-Inventory.git
cd Saka-Homes-Inventory
```

If the app code is still on the feature branch (before it is merged to `main`):

```powershell
git checkout cursor/saka-homes-inventory-cf6f
```

Open this folder in Cursor: **File → Open Folder**.

### 2. Start MongoDB with Docker

1. Open **Docker Desktop** and wait until it is running.  
2. In the terminal:

```powershell
docker run -d --name saka-mongo -p 27017:27017 mongo:7
```

Next time you only need:

```powershell
docker start saka-mongo
```

> No Docker? Install [MongoDB Community](https://www.mongodb.com/try/download/community) and make sure the MongoDB service is running, then continue.

### 3. Start the backend (Terminal 1)

```powershell
cd backend
copy .env.example .env
npm install
npm run seed
npm run dev
```

`npm run seed` creates the demo login account and leaves inventory **empty** so you can add your own items.

Leave this terminal open.  
You should see: `API listening on http://localhost:5000`

### 4. Start the frontend (Terminal 2)

Open a second terminal (**Terminal → New Terminal**):

```powershell
cd frontend
npm install
npm run dev
```

Leave this terminal open too.  
You should see something like: `http://localhost:5173`

### 5. Open the app

In Chrome or Edge, go to:

**http://localhost:5173**

### Demo login

- Email: `admin@sakahomes.com`
- Password: `password123`

Prices and totals are shown in **Ghana Cedis (GHS)**.

---

## Mac / Linux quick start

```bash
# MongoDB via Docker
docker run -d --name saka-mongo -p 27017:27017 mongo:7

# Backend
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173

---

## Every time you want to run it again

1. Start Docker Desktop (if you use it)  
2. `docker start saka-mongo`  
3. Terminal 1: `cd backend` → `npm run dev`  
4. Terminal 2: `cd frontend` → `npm run dev`  
5. Open http://localhost:5173

You only need `npm install` again after a fresh clone. Run `npm run seed` only when you want to reset the database (clears all items and recreates the demo login).

---

## Environment variables (`backend/.env`)

Copied from `.env.example`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `5000` | API port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/saka-homes-inventory` | Database connection |
| `JWT_SECRET` | (change in production) | Signs auth tokens |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Frontend origin for CORS |

---

## API overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Current user |
| GET | `/api/items` | Yes | List items (`?search=&category=`) |
| GET | `/api/items/stats` | Yes | Dashboard stats |
| GET | `/api/items/:id` | Yes | Get one item |
| POST | `/api/items` | Yes | Create item |
| PUT | `/api/items/:id` | Yes | Update item |
| DELETE | `/api/items/:id` | Yes | Delete item |

Item fields: `name`, `sku`, `category`, `quantity`, `unitPrice`, `location`, `lastUpdated`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `npm` is not recognized | Reinstall Node.js LTS, then fully close and reopen Cursor/terminal |
| `docker: command not found` | Install/start Docker Desktop, or install MongoDB Community instead |
| `EADDRINUSE` / port already in use | Close old terminals running the app, or restart your computer |
| Cannot connect to MongoDB | Make sure Docker Desktop is running and `saka-mongo` is started |
| Frontend loads but login fails | Make sure the backend terminal is still running on port 5000 |
| PowerShell blocks `npm` scripts | Run: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |

---

## App features

- Login / register with JWT auth  
- Sidebar layout dashboard  
- Stat cards: total items, low stock alerts, inventory value  
- Searchable / filterable inventory table  
- Stock color coding: red (low), amber (warning), green (healthy)  
- Slide-over panel to add / edit items  
