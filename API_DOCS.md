# TaskFlow — API Documentation

Base URL: `http://localhost:5000/api`

All protected routes require the header:
```
Authorization: Bearer <token>
```

Responses follow this envelope:
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Error description" }
```

---

## Authentication `/api/auth`

### POST `/auth/register`
Register a new user.

**Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "secret123",
  "role": "developer"
}
```
`role` must be `manager` or `developer` and defaults to `developer`.

**Response `201`:**
```json
{
  "success": true,
  "token": "<jwt>",
  "user": { "_id": "...", "name": "Jane Smith", "email": "jane@example.com", "role": "developer" }
}
```

---

### POST `/auth/login`
Login with existing credentials.

**Body:**
```json
{ "email": "jane@example.com", "password": "secret123" }
```

**Response `200`:** Same as register.

---

### GET `/auth/me` 🔒
Get the currently authenticated user.

**Response `200`:**
```json
{ "success": true, "user": { "_id": "...", "name": "...", "email": "...", "role": "..." } }
```

---

### PUT `/auth/me` 🔒
Update own profile (name and/or avatar URL).

**Body:**
```json
{ "name": "Jane Doe", "avatar": "https://..." }
```

---

### PUT `/auth/change-password` 🔒
Change own password.

**Body:**
```json
{ "currentPassword": "old", "newPassword": "new123" }
```

---

## Projects `/api/projects` 🔒

### GET `/projects`
Get all projects where user is owner or member.

**Response `200`:**
```json
{
  "success": true, "count": 2,
  "data": [ { "_id": "...", "title": "...", "owner": {...}, "members": [...], "taskCount": 5 } ]
}
```

---

### POST `/projects`
Create a new project (manager only).

**Body:**
```json
{
  "title": "Website Redesign",
  "description": "Optional description",
  "status": "active",
  "color": "#6366f1"
}
```

---

### GET `/projects/:id`
Get a single project (must be owner or member).

---

### PUT `/projects/:id`
Update project (manager project owner only). Accepts any of: `title`, `description`, `status`, `color`.

---

### DELETE `/projects/:id`
Delete project and all its tasks (manager project owner only).

---

### DELETE `/projects/:id/members/:userId`
Remove a member from the project (manager project owner only). Members join through accepted invites.

---

## Invites `/api/invites` 🔒

### POST `/invites`
Send a project invite to an email address (manager project owner only).

**Body:** `{ "projectId": "<projectId>", "email": "developer@example.com" }`

### GET `/invites/sent?projectId=<projectId>`
List invites for a project (manager project owner only).

### GET `/invites/inbox`
List the current developer's pending invites.

### PATCH `/invites/:id/accept`
Accept a pending invite and join its project (invitee developer only).

### PATCH `/invites/:id/decline`
Decline a pending invite (invitee developer only).

### DELETE `/invites/:id`
Cancel a pending invite (sending manager only).

---

## Tasks `/api/tasks` 🔒

### GET `/tasks`
Get tasks (scoped to projects the user belongs to).

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| `project` | ObjectId | Filter by project |
| `status` | string | Comma-separated: `To Do,In Progress,In Review,Done` |
| `priority` | string | Comma-separated: `Low,Medium,High,Urgent` |
| `assignee` | ObjectId | Filter by assignee |
| `search` | string | Full-text search on title + description |
| `sortBy` | string | `createdAt` (default), `updatedAt`, `dueDate`, `priority`, `title` |
| `order` | string | `asc` or `desc` (default) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 50, max: 100) |

**Response `200`:**
```json
{
  "success": true, "count": 10, "total": 42, "page": 1, "pages": 5,
  "data": [ { "_id": "...", "title": "...", "status": "To Do", "priority": "High", ... } ]
}
```

---

### POST `/tasks`
Create a task (manager project owner only).

**Body:**
```json
{
  "title": "Design landing page",
  "description": "Optional",
  "priority": "High",
  "status": "To Do",
  "project": "<projectId>",
  "assignee": "<userId>",
  "dueDate": "2025-03-01"
}
```

---

### GET `/tasks/:id`
Get a single task (must have project access).

---

### PUT `/tasks/:id`
Update a task (manager project owner may edit all task fields; a developer may change only the status of a task assigned to them).

---

### PATCH `/tasks/:id/status`
Update only the task status — managers who own the project may update any task; developers may update only tasks assigned to them.

**Body:** `{ "status": "In Progress" }`

---

### DELETE `/tasks/:id`
Delete a task (manager project owner only).

---

## Dashboard `/api/dashboard` 🔒

### GET `/dashboard/stats`
Returns aggregated statistics for the current user.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "tasks": {
      "total": 42,
      "byStatus": { "To Do": 10, "In Progress": 8, "In Review": 4, "Done": 20 },
      "byPriority": { "Low": 5, "Medium": 15, "High": 12, "Urgent": 10 },
      "overdue": 3
    },
    "myTasks": {
      "total": 12,
      "byStatus": { "To Do": 3, "In Progress": 4, "In Review": 2, "Done": 3 }
    },
    "projects": {
      "total": 5,
      "list": [
        { "_id": "...", "title": "...", "color": "#6366f1", "total": 8, "done": 4, "percentage": 50 }
      ]
    },
    "recentTasks": [ { "_id": "...", "title": "...", "status": "...", "updatedAt": "..." } ]
  }
}
```

---

## Users `/api/users` 🔒

### GET `/users`
Get all users (for assignee/member dropdowns).

**Query params:**
- `search` — filter by name or email (case-insensitive)

**Response `200`:**
```json
{ "success": true, "count": 12, "data": [ { "_id": "...", "name": "...", "email": "...", "avatar": "..." } ] }
```

---

### GET `/users/:id`
Get a single user by ID.

---

## Error Responses

| Status | Meaning |
|--------|---------|
| `400` | Bad request / invalid input |
| `401` | Unauthenticated (missing or invalid token) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Resource not found |
| `409` | Conflict (e.g. duplicate email) |
| `422` | Validation failed |
| `500` | Internal server error |

**Error body:**
```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [ { "field": "email", "msg": "Please provide a valid email" } ]
}
```
