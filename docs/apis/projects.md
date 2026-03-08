# Projects API Documentation

## Projects Management APIs

---

## 1. GET `/api/projects/space/:spaceId`

### Description
- Retrieves all projects within a specific space.
- User must be a space member to access.
- Returns projects sorted by creation date (newest first).
- Private route - requires authentication.

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| spaceId | String | Space ID (MongoDB ObjectId) |

### Success Response
```json
[
  {
    "_id": "692d7eb14df1f59216e34491",
    "name": "Website Redesign",
    "spaceId": "692d7eb14df1f59216e3448e",
    "members": [
      {
        "_id": "692d7eb14df1f59216e34490",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "avatar": "https://example.com/avatar2.jpg"
      }
    ],
    "tasks": [
      "692d7eb14df1f59216e34492",
      "692d7eb14df1f59216e34493"
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### Error Responses
| Status | Message |
|--------|---------|
| 401 | Not authorized, token failed |
| 403 | Access denied. Space member required. |
| 500 | Server error |

---

## 2. GET `/api/projects/:id`

### Description
- Retrieves a specific project by ID.
- User must be a project member (space owner, space member, or project member) to access.
- Private route - requires authentication.

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Project ID (MongoDB ObjectId) |

### Success Response
```json
{
  "_id": "692d7eb14df1f59216e34491",
  "name": "Website Redesign",
  "spaceId": {
    "_id": "692d7eb14df1f59216e3448e",
    "name": "Development Team",
    "owner": "692d7eb14df1f59216e3448f",
    "members": ["692d7eb14df1f59216e34490"]
  },
  "members": [
    {
      "_id": "692d7eb14df1f59216e34490",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "avatar": "https://example.com/avatar2.jpg"
    }
  ],
  "tasks": [
    {
      "_id": "692d7eb14df1f59216e34492",
      "title": "Design homepage",
      "status": "todo"
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 401 | Not authorized, token failed |
| 403 | Access denied. Project member required. |
| 404 | Project not found |
| 500 | Server error |

---

## 3. POST `/api/projects`

### Description
- Creates a new project within a space.
- User must be a space member to create a project.
- Emits Socket.io events: `project-created` to `space-{spaceId}` and `project-{projectId}` rooms.
- Private route - requires authentication.

### Request Body
```json
{
  "name": "Website Redesign",
  "spaceId": "692d7eb14df1f59216e3448e"
}
```

### Success Response
```json
{
  "_id": "692d7eb14df1f59216e34491",
  "name": "Website Redesign",
  "spaceId": {
    "_id": "692d7eb14df1f59216e3448e",
    "name": "Development Team",
    "owner": "692d7eb14df1f59216e3448f",
    "members": ["692d7eb14df1f59216e34490"]
  },
  "members": [],
  "tasks": [],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 400 | Project name and spaceId are required |
| 401 | Not authorized, token failed |
| 403 | Access denied. Space member required. |
| 500 | Server error |

---

## 4. PUT `/api/projects/:id`

### Description
- Updates project details (currently only name).
- User must be a project member to update.
- Emits Socket.io events: `project-updated` to `space-{spaceId}` and `project-{projectId}` rooms.
- Private route - requires authentication.

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Project ID (MongoDB ObjectId) |

### Request Body
```json
{
  "name": "Updated Project Name"
}
```

### Success Response
```json
{
  "_id": "692d7eb14df1f59216e34491",
  "name": "Updated Project Name",
  "spaceId": {
    "_id": "692d7eb14df1f59216e3448e",
    "name": "Development Team",
    "owner": "692d7eb14df1f59216e3448f",
    "members": ["692d7eb14df1f59216e34490"]
  },
  "members": [
    {
      "_id": "692d7eb14df1f59216e34490",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "avatar": "https://example.com/avatar2.jpg"
    }
  ],
  "tasks": [],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 401 | Not authorized, token failed |
| 403 | Access denied. Project member required. |
| 404 | Project not found |
| 500 | Server error |

---

## 5. DELETE `/api/projects/:id`

### Description
- Deletes a project permanently.
- User must be a project member to delete.
- Emits Socket.io events: `project-deleted` to `space-{spaceId}` and `project-{projectId}` rooms before deletion.
- Private route - requires authentication.

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Project ID (MongoDB ObjectId) |

### Success Response
```json
{
  "message": "Project deleted successfully"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 401 | Not authorized, token failed |
| 403 | Access denied. Project member required. |
| 404 | Project not found |
| 500 | Server error |

---

## 6. POST `/api/projects/:id/members`

### Description
- Adds a user as a member to the project.
- User must be a project member to add other members.
- The user being added must be a space member (owner or regular member).
- User cannot be added if they are already a project member.
- Emits Socket.io events: `project-member-added` to `space-{spaceId}` and `project-{projectId}` rooms.
- Private route - requires authentication.

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Project ID (MongoDB ObjectId) |

### Request Body
```json
{
  "userId": "692d7eb14df1f59216e34490"
}
```

### Success Response
```json
{
  "_id": "692d7eb14df1f59216e34491",
  "name": "Website Redesign",
  "spaceId": {
    "_id": "692d7eb14df1f59216e3448e",
    "name": "Development Team",
    "owner": "692d7eb14df1f59216e3448f",
    "members": ["692d7eb14df1f59216e34490"]
  },
  "members": [
    {
      "_id": "692d7eb14df1f59216e34490",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "avatar": "https://example.com/avatar2.jpg"
    }
  ],
  "tasks": [],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 400 | User ID is required / User must be a space member to be added to project / User is already a member of this project |
| 401 | Not authorized, token failed |
| 403 | Access denied. Project member required. |
| 404 | Project not found |
| 500 | Server error |

---

## 7. DELETE `/api/projects/:id/members/:userId`

### Description
- Removes a user from the project members list.
- User must be a project member to remove other members.
- Emits Socket.io events: `project-member-removed` to `space-{spaceId}` and `project-{projectId}` rooms.
- Private route - requires authentication.

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Project ID (MongoDB ObjectId) |
| userId | String | User ID to remove (MongoDB ObjectId) |

### Success Response
```json
{
  "_id": "692d7eb14df1f59216e34491",
  "name": "Website Redesign",
  "spaceId": {
    "_id": "692d7eb14df1f59216e3448e",
    "name": "Development Team",
    "owner": "692d7eb14df1f59216e3448f",
    "members": ["692d7eb14df1f59216e34490"]
  },
  "members": [],
  "tasks": [],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 401 | Not authorized, token failed |
| 403 | Access denied. Project member required. |
| 404 | Project not found |
| 500 | Server error |

---

## Socket.io Events

### Client → Server Events

#### `join-project`
Join a project room to receive real-time updates.
```javascript
socket.emit('join-project', projectId);
```

#### `leave-project`
Leave a project room.
```javascript
socket.emit('leave-project', projectId);
```

### Server → Client Events

#### `project-created`
Emitted when a new project is created.
```json
{
  "_id": "692d7eb14df1f59216e34491",
  "name": "Website Redesign",
  "spaceId": {...},
  "members": [...],
  "tasks": [],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### `project-updated`
Emitted when a project is updated.
```json
{
  "_id": "692d7eb14df1f59216e34491",
  "name": "Updated Project Name",
  "spaceId": {...},
  "members": [...],
  "tasks": [],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

#### `project-deleted`
Emitted when a project is deleted.
```json
{
  "projectId": "692d7eb14df1f59216e34491"
}
```

#### `project-member-added`
Emitted when a member is added to a project.
```json
{
  "project": {...},
  "userId": "692d7eb14df1f59216e34490"
}
```

#### `project-member-removed`
Emitted when a member is removed from a project.
```json
{
  "project": {...},
  "userId": "692d7eb14df1f59216e34490"
}
```
