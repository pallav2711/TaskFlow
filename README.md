# TaskFlow — MERN Task Management System

A full-stack task management application built with **MongoDB, Express.js, React, and Node.js**.  
Features secure JWT authentication, project management, full task CRUD, and an interactive Kanban board with drag-and-drop.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, @dnd-kit, react-hook-form, react-hot-toast |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Validation | express-validator (server), react-hook-form (client) |

---

## Project Structure

```
Barodaweb r-2/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── api/             # Axios instance + API call modules
│   │   ├── components/      # Reusable UI and feature components
│   │   │   ├── kanban/
│   │   │   ├── layout/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   └── ui/
│   │   ├── context/         # AuthContext
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Page components
│   │   ├── routes/          # ProtectedRoute, GuestRoute
│   │   └── utils/           # constants, helpers
│   ├── .env.example
│   └── package.json
│
├── server/                  # Express backend
│   ├── config/              # MongoDB connection
│   ├── controllers/         # Route handlers
│   ├── middleware/          # auth, validate, errorHandler
│   ├── models/              # Mongoose schemas
│   ├── routes/              # Express routers
│   ├── utils/               # generateToken, asyncHandler, AppError
│   ├── .env.example
│   └── server.js
│
├── README.md
└── API_DOCS.md
```

---

## Prerequisites

- **Node.js** v18 or higher
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas)
- **npm** v9 or higher

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd "Barodaweb r-2"
```

### 2. Configure the backend

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and fill in your values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskmanagement
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

Install dependencies:

```bash
npm install
```

### 3. Configure the frontend

```bash
cd ../client
cp .env.example .env
```

`client/.env` (default works with the Vite proxy — no change needed for local dev):

```env
VITE_API_URL=http://localhost:5000/api
```

Install dependencies:

```bash
npm install
```

---

## Running the Application

### Development (two terminals)

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```
Server starts at `http://localhost:5000`

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```
App opens at `http://localhost:5173`

### Production Build

```bash
# Build frontend
cd client
npm run build

# Start backend in production
cd ../server
NODE_ENV=production npm start
```

---

## Features

### Authentication
- Register / Login with JWT
- Passwords hashed with bcryptjs (salt rounds: 12)
- Protected frontend routes and backend APIs
- Auto-logout on token expiry

### Dashboard
- Total, pending, in-progress, completed task counts
- Priority breakdown bars
- Per-project progress percentages
- My tasks breakdown
- Recently updated tasks with overdue highlighting

### Projects
- Create, view, edit, delete projects
- Color-coded project cards
- Add / remove team members
- Project progress bar (% tasks done)
- Owner-only write operations

### Tasks
- Full CRUD with title, description, priority, status, assignee, due date
- Search by title
- Filter by status, priority, project, assignee
- Sort by created date, due date, priority
- Overdue task highlighting
- Pagination

### Kanban Board
- 4 columns: To Do · In Progress · In Review · Done
- Drag-and-drop cards between columns (`@dnd-kit`)
- Optimistic UI updates with automatic rollback on API failure
- Status persisted to MongoDB on every drop
- Filter by project
- Create / edit / delete tasks inline

---

## API Documentation

See [`API_DOCS.md`](./API_DOCS.md) for the full REST API reference.

---

## Environment Variables Reference

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `MONGODB_URI` | **Yes** | MongoDB connection string |
| `JWT_SECRET` | **Yes** | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | No | Token expiry (default: `7d`) |
| `NODE_ENV` | No | `development` or `production` |
| `CLIENT_URL` | No | Frontend URL for CORS (default: `http://localhost:5173`) |

### Client (`client/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend API base URL (default: `/api` via Vite proxy) |

---

## Security Notes

- Passwords are never stored in plain text
- JWT is verified on every protected API call
- All resource-level operations check project membership/ownership
- Helmet sets secure HTTP headers
- Request body size limited to 10kb
- Input validated on both client and server

---

## License

MIT
