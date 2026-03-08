# Spaces API Documentation

## Spaces Management APIs

---

## 1. GET `/api/spaces`

### Description
- Retrieves all spaces where the authenticated user is either the owner or a member.
- Returns spaces sorted by creation date (newest first).
- Private route - requires authentication.

### Success Response
```json
[
  {
    "_id": "692d7eb14df1f59216e3448e",
    "name": "Development Team",
    "owner": {
      "_id": "692d7eb14df1f59216e3448f",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://example.com/avatar.jpg"
    },
    "members": [
      {
        "_id": "692d7eb14df1f59216e34490",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "avatar": "https://example.com/avatar2.jpg"
      }
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
| 500 | Server error |

---

## 2. GET `/api/spaces/:id`

### Description
- Retrieves a specific space by ID.
- User must be a space member (owner or regular member) to access.
- Private route - requires authentication.

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Space ID (MongoDB ObjectId) |

### Success Response
```json
{
  "_id": "692d7eb14df1f59216e3448e",
  "name": "Development Team",
  "owner": {
    "_id": "692d7eb14df1f59216e3448f",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://example.com/avatar.jpg"
  },
  "members": [
    {
      "_id": "692d7eb14df1f59216e34490",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "avatar": "https://example.com/avatar2.jpg"
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
| 403 | Access denied. Space member required. |
| 404 | Space not found |
| 500 | Server error |

---

## 3. POST `/api/spaces`

### Description
- Creates a new space.
- The authenticated user automatically becomes the space owner.
- Emits Socket.io event: `space-created` to `space-{spaceId}` room.
- Private route - requires authentication.

### Request Body
```json
{
  "name": "Development Team"
}
```

### Success Response
```json
{
  "_id": "692d7eb14df1f59216e3448e",
  "name": "Development Team",
  "owner": {
    "_id": "692d7eb14df1f59216e3448f",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://example.com/avatar.jpg"
  },
  "members": [],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 400 | Space name is required |
| 401 | Not authorized, token failed |
| 500 | Server error |

---

## 4. PUT `/api/spaces/:id`

### Description
- Updates space details (currently only name).
- Only the space owner can update the space.
- Emits Socket.io event: `space-updated` to `space-{spaceId}` room.
- Private route - requires authentication.

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Space ID (MongoDB ObjectId) |

### Request Body
```json
{
  "name": "Updated Space Name"
}
```

### Success Response
```json
{
  "_id": "692d7eb14df1f59216e3448e",
  "name": "Updated Space Name",
  "owner": {
    "_id": "692d7eb14df1f59216e3448f",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://example.com/avatar.jpg"
  },
  "members": [
    {
      "_id": "692d7eb14df1f59216e34490",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "avatar": "https://example.com/avatar2.jpg"
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 401 | Not authorized, token failed |
| 403 | Access denied. Space Owner required. |
| 404 | Space not found |
| 500 | Server error |

---

## 5. DELETE `/api/spaces/:id`

### Description
- Deletes a space permanently.
- Only the space owner can delete the space.
- Emits Socket.io event: `space-deleted` to `space-{spaceId}` room before deletion.
- Private route - requires authentication.

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Space ID (MongoDB ObjectId) |

### Success Response
```json
{
  "message": "Space deleted successfully"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 401 | Not authorized, token failed |
| 403 | Access denied. Space Owner required. |
| 404 | Space not found |
| 500 | Server error |

---

## 6. POST `/api/spaces/:id/members`

### Description
- Adds a user as a member to the space.
- Only the space owner can add members.
- User cannot be added if they are already a member or the owner.
- Emits Socket.io event: `member-added` to `space-{spaceId}` room.
- Private route - requires authentication.

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Space ID (MongoDB ObjectId) |

### Request Body
```json
{
  "userId": "692d7eb14df1f59216e34490"
}
```

### Success Response
```json
{
  "_id": "692d7eb14df1f59216e3448e",
  "name": "Development Team",
  "owner": {
    "_id": "692d7eb14df1f59216e3448f",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://example.com/avatar.jpg"
  },
  "members": [
    {
      "_id": "692d7eb14df1f59216e34490",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "avatar": "https://example.com/avatar2.jpg"
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 400 | User ID is required / User is already a member of this space |
| 401 | Not authorized, token failed |
| 403 | Access denied. Space Owner required. |
| 404 | Space not found |
| 500 | Server error |

---

## 7. DELETE `/api/spaces/:id/members/:userId`

### Description
- Removes a user from the space members list.
- Only the space owner can remove members.
- Cannot remove the space owner.
- Emits Socket.io event: `member-removed` to `space-{spaceId}` room.
- Private route - requires authentication.

### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Space ID (MongoDB ObjectId) |
| userId | String | User ID to remove (MongoDB ObjectId) |

### Success Response
```json
{
  "_id": "692d7eb14df1f59216e3448e",
  "name": "Development Team",
  "owner": {
    "_id": "692d7eb14df1f59216e3448f",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://example.com/avatar.jpg"
  },
  "members": [],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 400 | Cannot remove space owner |
| 401 | Not authorized, token failed |
| 403 | Access denied. Space Owner required. |
| 404 | Space not found |
| 500 | Server error |

---

## Socket.io Events

### Client → Server Events

#### `join-space`
Join a space room to receive real-time updates.
```javascript
socket.emit('join-space', spaceId);
```

#### `leave-space`
Leave a space room.
```javascript
socket.emit('leave-space', spaceId);
```

### Server → Client Events

#### `space-created`
Emitted when a new space is created.
```json
{
  "_id": "692d7eb14df1f59216e3448e",
  "name": "Development Team",
  "owner": {...},
  "members": [...],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### `space-updated`
Emitted when a space is updated.
```json
{
  "_id": "692d7eb14df1f59216e3448e",
  "name": "Updated Space Name",
  "owner": {...},
  "members": [...],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

#### `space-deleted`
Emitted when a space is deleted.
```json
{
  "spaceId": "692d7eb14df1f59216e3448e"
}
```

#### `member-added`
Emitted when a member is added to a space.
```json
{
  "space": {...},
  "userId": "692d7eb14df1f59216e34490"
}
```

#### `member-removed`
Emitted when a member is removed from a space.
```json
{
  "space": {...},
  "userId": "692d7eb14df1f59216e34490"
}
```
