# Saka Homes Inventory

Full-stack inventory dashboard for Saka Homes — Express/MongoDB API and React + Tailwind UI.

## Structure

```
backend/    Node.js + Express + MongoDB REST API
frontend/   React (Vite) + Tailwind CSS dashboard
```

## Prerequisites

- Node.js 18+
- MongoDB running locally (default `mongodb://127.0.0.1:27017`)

## Backend

```bash
cd backend
cp .env.example .env   # edit JWT_SECRET / MONGODB_URI as needed
npm install
npm run seed           # demo user + sample items
npm run dev            # http://localhost:5000
```

### Demo credentials

- Email: `admin@sakahomes.com`
- Password: `password123`

### API

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

## Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173 (proxies /api → :5000)
```

UI includes login/register, sidebar layout, stat cards, searchable/filterable table, stock color coding (red / amber / green), and a slide-over form for add/edit.
