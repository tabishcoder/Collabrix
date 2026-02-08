# Tasks API Documentation

## Task Management APIs

---

## 1. GET `/api/tasks/project/:projectId`

### Description
- Retrieves all tasks within a specific project.
- User must be a project member to access.
- Returns tasks sorted by creation date (newest first).
- Private route - requires authentication.

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | String | Project ID (MongoDB ObjectId) |

### Success Response
```json
[
  {
    "_id": "692d7eb14df1f59216e34492",
    "title": "Design homepage",
    "description": "Create a modern and responsive homepage design",
    "status": "todo",
    "projectId": "692d7eb14df1f59216e34491",
    "assignee": {
      "_id": "692d7eb14df1f59216e34490",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "avatar": "https://example.com/avatar2.jpg"
    },
    "createdBy": {
      "_id": "692d7eb14df1f59216e3448f",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://example.com/avatar.jpg"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### Error Responses
| Status | Message |
|--------|---------|
| 401 | Not authorized, token failed |
| 403 | Access denied. Project member required. |
| 500 | Server error |

---

## 2. GET `/api/tasks/:id`

### Description
- Retrieves a specific task by ID.
- User must be a project member to access.
- Private route - requires authentication.

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Task ID (MongoDB ObjectId) |

### Success Response
```json
{
  "_id": "692d7eb14df1f59216e34492",
  "title": "Design homepage",
  "description": "Create a modern and responsive homepage design",
  "status": "todo",
  "projectId": {
    "_id": "692d7eb14df1f59216e34491",
    "name": "Website Redesign",
    "spaceId": "692d7eb14df1f59216e3448e"
  },
  "assignee": {
    "_id": "692d7eb14df1f59216e34490",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "avatar": "https://example.com/avatar2.jpg"
  },
  "createdBy": {
    "_id": "692d7eb14df1f59216e3448f",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://example.com/avatar.jpg"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 401 | Not authorized, token failed |
| 403 | Access denied. Project member required. |
| 404 | Task not found |
| 500 | Server error |

---

## 3. POST `/api/tasks`

### Description
- Creates a new task within a project.
- User must be a project member to create tasks.
- Assignee (if provided) must be a project member.
- Task is automatically added to the project's tasks array.
- Emits Socket.io events: `task-created` to `space-{spaceId}` and `project-{projectId}` rooms.
- Private route - requires authentication.

### Request Body
```json
{
  "title": "Design homepage",
  "description": "Create a modern and responsive homepage design",
  "projectId": "692d7eb14df1f59216e34491",
  "assignee": "692d7eb14df1f59216e34490"
}
```

**Note:** `description` and `assignee` are optional fields. If `assignee` is not provided, the task will be unassigned.

### Success Response
```json
{
  "_id": "692d7eb14df1f59216e34492",
  "title": "Design homepage",
  "description": "Create a modern and responsive homepage design",
  "status": "todo",
  "projectId": {
    "_id": "692d7eb14df1f59216e34491",
    "name": "Website Redesign",
    "spaceId": "692d7eb14df1f59216e3448e"
  },
  "assignee": {
    "_id": "692d7eb14df1f59216e34490",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "avatar": "https://example.com/avatar2.jpg"
  },
  "createdBy": {
    "_id": "692d7eb14df1f59216e3448f",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://example.com/avatar.jpg"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 400 | Task title and projectId are required / Assignee must be a project member |
| 401 | Not authorized, token failed |
| 403 | Access denied. Project member required. |
| 500 | Server error |

---

## 4. PUT `/api/tasks/:id`

### Description
- Updates task details (title, description, status, assignee).
- User must be a project member to update tasks.
- Status must be one of: `todo`, `in_progress`, or `done`.
- Assignee (if provided) must be a project member. Set `assignee` to `null` to unassign.
- Status changes are logged as "moved" action in history.
- Assignee changes are logged as "assigned" action in history.
- Other updates are logged as "updated" action in history.
- Emits Socket.io events: `task-updated` to `space-{spaceId}` and `project-{projectId}` rooms.
- Private route - requires authentication.

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Task ID (MongoDB ObjectId) |

### Request Body
```json
{
  "title": "Updated task title",
  "description": "Updated description",
  "status": "in_progress",
  "assignee": "692d7eb14df1f59216e34490"
}
```

**Note:** All fields are optional. Only include the fields you want to update.

### Success Response
```json
{
  "_id": "692d7eb14df1f59216e34492",
  "title": "Updated task title",
  "description": "Updated description",
  "status": "in_progress",
  "projectId": {
    "_id": "692d7eb14df1f59216e34491",
    "name": "Website Redesign",
    "spaceId": "692d7eb14df1f59216e3448e"
  },
  "assignee": {
    "_id": "692d7eb14df1f59216e34490",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "avatar": "https://example.com/avatar2.jpg"
  },
  "createdBy": {
    "_id": "692d7eb14df1f59216e3448f",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://example.com/avatar.jpg"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 400 | Invalid status. Must be todo, in_progress, or done / Assignee must be a project member |
| 401 | Not authorized, token failed |
| 403 | Access denied. Project member required. |
| 404 | Task not found |
| 500 | Server error |

---

## 5. DELETE `/api/tasks/:id`

### Description
- Deletes a task permanently.
- User must be a project member to delete tasks.
- Task is automatically removed from the project's tasks array.
- Emits Socket.io events: `task-deleted` to `space-{spaceId}` and `project-{projectId}` rooms before deletion.
- Private route - requires authentication.

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Task ID (MongoDB ObjectId) |

### Success Response
```json
{
  "message": "Task deleted successfully"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 401 | Not authorized, token failed |
| 403 | Access denied. Project member required. |
| 404 | Task not found |
| 500 | Server error |

---

## Task Status Values

| Status | Description |
|--------|-------------|
| `todo` | Task is not yet started (default) |
| `in_progress` | Task is currently being worked on |
| `done` | Task has been completed |

---

## Socket.io Events

### Server → Client Events

#### `task-created`
Emitted when a new task is created.
```json
{
  "_id": "692d7eb14df1f59216e34492",
  "title": "Design homepage",
  "description": "Create a modern and responsive homepage design",
  "status": "todo",
  "projectId": {...},
  "assignee": {...},
  "createdBy": {...},
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### `task-updated`
Emitted when a task is updated.
```json
{
  "_id": "692d7eb14df1f59216e34492",
  "title": "Updated task title",
  "description": "Updated description",
  "status": "in_progress",
  "projectId": {...},
  "assignee": {...},
  "createdBy": {...},
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

#### `task-deleted`
Emitted when a task is deleted.
```json
{
  "taskId": "692d7eb14df1f59216e34492",
  "projectId": "692d7eb14df1f59216e34491"
}
```
