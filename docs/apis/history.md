# History API Documentation

## History & Audit Logs Management APIs

---

## 1. GET `/api/history/space/:spaceId`

### Description
- Retrieves the complete history/audit log for a space.
- Includes history for the space itself, all projects within the space, all tasks in those projects, and member-related activities.
- User must be a space member to access.
- Returns up to 100 most recent history entries, sorted by timestamp (newest first).
- Private route - requires authentication.

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| spaceId | String | Space ID (MongoDB ObjectId) |

### Success Response
```json
[
  {
    "_id": "692d7eb14df1f59216e34494",
    "entityType": "space",
    "entityId": "692d7eb14df1f59216e3448e",
    "action": "created",
    "performedBy": {
      "_id": "692d7eb14df1f59216e3448f",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://example.com/avatar.jpg"
    },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "details": {
      "name": "Development Team"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "_id": "692d7eb14df1f59216e34495",
    "entityType": "project",
    "entityId": "692d7eb14df1f59216e34491",
    "action": "created",
    "performedBy": {
      "_id": "692d7eb14df1f59216e3448f",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://example.com/avatar.jpg"
    },
    "timestamp": "2024-01-15T10:35:00.000Z",
    "details": {
      "name": "Website Redesign",
      "spaceId": "692d7eb14df1f59216e3448e"
    },
    "createdAt": "2024-01-15T10:35:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  },
  {
    "_id": "692d7eb14df1f59216e34496",
    "entityType": "task",
    "entityId": "692d7eb14df1f59216e34492",
    "action": "moved",
    "performedBy": {
      "_id": "692d7eb14df1f59216e34490",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "avatar": "https://example.com/avatar2.jpg"
    },
    "timestamp": "2024-01-15T11:00:00.000Z",
    "details": {
      "oldStatus": "todo",
      "newStatus": "in_progress"
    },
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  {
    "_id": "692d7eb14df1f59216e34497",
    "entityType": "member",
    "entityId": "692d7eb14df1f59216e34490",
    "action": "added",
    "performedBy": {
      "_id": "692d7eb14df1f59216e3448f",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://example.com/avatar.jpg"
    },
    "timestamp": "2024-01-15T10:40:00.000Z",
    "details": {
      "spaceId": "692d7eb14df1f59216e3448e",
      "spaceName": "Development Team"
    },
    "createdAt": "2024-01-15T10:40:00.000Z",
    "updatedAt": "2024-01-15T10:40:00.000Z"
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

## 2. GET `/api/history/project/:projectId`

### Description
- Retrieves the complete history/audit log for a project.
- Includes history for the project itself, all tasks within the project, and member-related activities.
- User must be a project member to access.
- Returns up to 100 most recent history entries, sorted by timestamp (newest first).
- Private route - requires authentication.

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | String | Project ID (MongoDB ObjectId) |

### Success Response
```json
[
  {
    "_id": "692d7eb14df1f59216e34495",
    "entityType": "project",
    "entityId": "692d7eb14df1f59216e34491",
    "action": "created",
    "performedBy": {
      "_id": "692d7eb14df1f59216e3448f",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://example.com/avatar.jpg"
    },
    "timestamp": "2024-01-15T10:35:00.000Z",
    "details": {
      "name": "Website Redesign",
      "spaceId": "692d7eb14df1f59216e3448e"
    },
    "createdAt": "2024-01-15T10:35:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  },
  {
    "_id": "692d7eb14df1f59216e34498",
    "entityType": "task",
    "entityId": "692d7eb14df1f59216e34492",
    "action": "created",
    "performedBy": {
      "_id": "692d7eb14df1f59216e3448f",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://example.com/avatar.jpg"
    },
    "timestamp": "2024-01-15T10:45:00.000Z",
    "details": {
      "title": "Design homepage",
      "projectId": "692d7eb14df1f59216e34491",
      "assignee": "692d7eb14df1f59216e34490"
    },
    "createdAt": "2024-01-15T10:45:00.000Z",
    "updatedAt": "2024-01-15T10:45:00.000Z"
  },
  {
    "_id": "692d7eb14df1f59216e34499",
    "entityType": "member",
    "entityId": "692d7eb14df1f59216e34490",
    "action": "added",
    "performedBy": {
      "_id": "692d7eb14df1f59216e3448f",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://example.com/avatar.jpg"
    },
    "timestamp": "2024-01-15T10:50:00.000Z",
    "details": {
      "projectId": "692d7eb14df1f59216e34491",
      "projectName": "Website Redesign"
    },
    "createdAt": "2024-01-15T10:50:00.000Z",
    "updatedAt": "2024-01-15T10:50:00.000Z"
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

## 3. GET `/api/history/task/:taskId`

### Description
- Retrieves the complete history/audit log for a specific task.
- Includes all actions performed on the task (created, updated, moved, assigned, deleted).
- User must be a project member to access.
- Returns all history entries for the task, sorted by timestamp (newest first).
- Private route - requires authentication.

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| taskId | String | Task ID (MongoDB ObjectId) |

### Success Response
```json
[
  {
    "_id": "692d7eb14df1f59216e34498",
    "entityType": "task",
    "entityId": "692d7eb14df1f59216e34492",
    "action": "created",
    "performedBy": {
      "_id": "692d7eb14df1f59216e3448f",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://example.com/avatar.jpg"
    },
    "timestamp": "2024-01-15T10:45:00.000Z",
    "details": {
      "title": "Design homepage",
      "projectId": "692d7eb14df1f59216e34491",
      "assignee": "692d7eb14df1f59216e34490"
    },
    "createdAt": "2024-01-15T10:45:00.000Z",
    "updatedAt": "2024-01-15T10:45:00.000Z"
  },
  {
    "_id": "692d7eb14df1f59216e34496",
    "entityType": "task",
    "entityId": "692d7eb14df1f59216e34492",
    "action": "moved",
    "performedBy": {
      "_id": "692d7eb14df1f59216e34490",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "avatar": "https://example.com/avatar2.jpg"
    },
    "timestamp": "2024-01-15T11:00:00.000Z",
    "details": {
      "oldStatus": "todo",
      "newStatus": "in_progress"
    },
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  {
    "_id": "692d7eb14df1f59216e3449a",
    "entityType": "task",
    "entityId": "692d7eb14df1f59216e34492",
    "action": "assigned",
    "performedBy": {
      "_id": "692d7eb14df1f59216e3448f",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://example.com/avatar.jpg"
    },
    "timestamp": "2024-01-15T10:46:00.000Z",
    "details": {
      "oldAssignee": null,
      "newAssignee": "692d7eb14df1f59216e34490"
    },
    "createdAt": "2024-01-15T10:46:00.000Z",
    "updatedAt": "2024-01-15T10:46:00.000Z"
  },
  {
    "_id": "692d7eb14df1f59216e3449b",
    "entityType": "task",
    "entityId": "692d7eb14df1f59216e34492",
    "action": "updated",
    "performedBy": {
      "_id": "692d7eb14df1f59216e34490",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "avatar": "https://example.com/avatar2.jpg"
    },
    "timestamp": "2024-01-15T11:05:00.000Z",
    "details": {
      "title": "Design homepage",
      "description": "Create a modern and responsive homepage design with animations"
    },
    "createdAt": "2024-01-15T11:05:00.000Z",
    "updatedAt": "2024-01-15T11:05:00.000Z"
  }
]
```

### Error Responses
| Status | Message |
|--------|---------|
| 401 | Not authorized, token failed |
| 403 | Access denied. Project member required. |
| 404 | Task not found |
| 500 | Server error |

---

## 4. GET `/api/history/user/:userId`

### Description
- Retrieves the activity history for a specific user.
- Users can only view their own history.
- Returns up to 100 most recent history entries where the user performed actions, sorted by timestamp (newest first).
- Private route - requires authentication.

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | String | User ID (MongoDB ObjectId) |

### Success Response
```json
[
  {
    "_id": "692d7eb14df1f59216e34494",
    "entityType": "space",
    "entityId": "692d7eb14df1f59216e3448e",
    "action": "created",
    "performedBy": {
      "_id": "692d7eb14df1f59216e3448f",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://example.com/avatar.jpg"
    },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "details": {
      "name": "Development Team"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "_id": "692d7eb14df1f59216e34495",
    "entityType": "project",
    "entityId": "692d7eb14df1f59216e34491",
    "action": "created",
    "performedBy": {
      "_id": "692d7eb14df1f59216e3448f",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://example.com/avatar.jpg"
    },
    "timestamp": "2024-01-15T10:35:00.000Z",
    "details": {
      "name": "Website Redesign",
      "spaceId": "692d7eb14df1f59216e3448e"
    },
    "createdAt": "2024-01-15T10:35:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
]
```

### Error Responses
| Status | Message |
|--------|---------|
| 401 | Not authorized, token failed |
| 403 | Access denied. Can only view own history. |
| 500 | Server error |

---

## History Entity Types

| Entity Type | Description |
|-------------|-------------|
| `space` | History entries related to spaces |
| `project` | History entries related to projects |
| `task` | History entries related to tasks |
| `member` | History entries related to member additions/removals |

---

## History Actions

| Action | Description | Entity Types |
|--------|-------------|--------------|
| `created` | Entity was created | space, project, task |
| `updated` | Entity details were updated | space, project, task |
| `moved` | Task status was changed | task |
| `deleted` | Entity was deleted | space, project, task |
| `assigned` | Task assignee was changed | task |
| `added` | Member was added | member |
| `removed` | Member was removed | member |

---

## History Details Structure

The `details` field in history entries varies based on the action:

### Space Created/Updated
```json
{
  "name": "Space Name"
}
```

### Project Created/Updated
```json
{
  "name": "Project Name",
  "spaceId": "692d7eb14df1f59216e3448e"
}
```

### Task Created
```json
{
  "title": "Task Title",
  "projectId": "692d7eb14df1f59216e34491",
  "assignee": "692d7eb14df1f59216e34490"
}
```

### Task Moved (Status Changed)
```json
{
  "oldStatus": "todo",
  "newStatus": "in_progress"
}
```

### Task Assigned
```json
{
  "oldAssignee": null,
  "newAssignee": "692d7eb14df1f59216e34490"
}
```

### Member Added (Space)
```json
{
  "spaceId": "692d7eb14df1f59216e3448e",
  "spaceName": "Development Team"
}
```

### Member Added (Project)
```json
{
  "projectId": "692d7eb14df1f59216e34491",
  "projectName": "Website Redesign"
}
```

### Member Removed
```json
{
  "spaceId": "692d7eb14df1f59216e3448e",
  "spaceName": "Development Team"
}
```
or
```json
{
  "projectId": "692d7eb14df1f59216e34491",
  "projectName": "Website Redesign"
}
```
