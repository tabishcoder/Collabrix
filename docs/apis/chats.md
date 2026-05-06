# Chats API Documentation

Base path: `/api/chats`  
All routes require authentication (`Cookie: accessToken` or equivalent session).

---

## 1. GET `/api/chats?projectId=<id>`

### Description
Lists every conversation tied to the given project for the current user: the auto-created **General** (project) channel, direct messages, and groups that share the same `projectId`. Ensures the General channel exists before returning.

### Query parameters
| Parameter   | Type   | Required | Description                          |
|------------|--------|----------|--------------------------------------|
| projectId  | string | Yes      | MongoDB ObjectId of the project      |

### Success response
JSON array of chat objects. Each item includes `kind` (`direct` | `group` | `project`), `participants`, `lastMessageText`, `lastMessageAt`, `unreadCount`, `lastActivityLabel`, etc.

### Errors
| Status | Typical body                          |
|--------|----------------------------------------|
| 400    | `{ "error": "projectId query is required" }` |
| 403    | `{ "error": "Access denied" }`         |
| 500    | `{ "error": "..." }`                  |

---

## 2. POST `/api/chats/private`

### Description
Finds or creates a **direct** chat between the logged-in user and another user, scoped to a project.

### Body
```json
{
  "userId": "<other user's ObjectId>",
  "projectId": "<project ObjectId>"
}
```

### Rules
The other user must be allowed for project-scoped chats: on the project roster **or** in the parent workspace (owner + space members), so members can reach workspace admins.

### Success
Single chat object (with `unreadCount`, etc.).

---

## 3. POST `/api/chats/group`

### Description
Creates a **group** chat linked to a project.

### Body
```json
{
  "name": "Design sync",
  "participantIds": ["<id>", "<id>"],
  "projectId": "<project ObjectId>"
}
```

At least one other `participantIds` entry is required (creator is added automatically).

---

## 4. GET `/api/chats/:chatId/messages`

### Description
Paginated message history. Includes soft-deleted tombstones (`deletedAt` set, empty `content`).

### Query parameters
| Parameter | Type   | Description                                      |
|-----------|--------|--------------------------------------------------|
| limit     | number | Optional, default 40, max 100                    |
| before    | string | Optional message `_id` cursor for older pages    |

### Success response
```json
{
  "messages": [ /* oldest → newest in this page */ ],
  "hasMore": true,
  "readReceipts": {
    "<userId>": "2025-05-02T12:00:00.000Z"
  }
}
```

Each message from **you** may include `receiptStatus`: `"sent"` | `"delivered"` | `"read"` (derived from `deliveredTo` + `UserChatState.lastReadAt`).

---

## 5. POST `/api/chats/:chatId/messages`

### Description
Sends a message. Persists first, then broadcasts over Socket.IO.

### Body
```json
{
  "content": "Hello",
  "clientMessageId": "optional-uuid-for-idempotency"
}
```

### Success
`201` Created — populated message (with `sender`). Duplicate `clientMessageId` returns the existing message (`200`).

Side effects: unread increments for other participants, `chat:message` + `chat:inbox` socket events, optional `chat_message` **notifications** for recipients.

---

## 6. POST `/api/chats/:chatId/read`

### Description
Marks the conversation read for the current user (`unreadCount` → 0, `lastReadAt` → now). Emits `chat:read` and `chat:read-updated` on the socket.

---

## 7. DELETE `/api/chats/:chatId/messages/:messageId`

### Description
Soft-deletes a message (sender only). Emits `chat:message-deleted`.

---

## 8. DELETE `/api/chats/:chatId`

### Description
Deletes a **direct** or **group** chat (messages + `UserChatState` + chat document). **Project** channel cannot be deleted (`403`).

### Permissions
- **Direct:** any participant.
- **Group:** group creator **or** project manager / owner / admin role on that project.

Emits `chat:removed` to each participant’s private socket room (`user-<id>`).

---

## Deprecated / legacy

### GET `/api/chats` (no `projectId`)
Returns all chats where the user is in `participants`. Prefer the project-scoped query for the Collabrix UI.

---

## Related documentation

- Architecture and end-to-end flow: `docs/chats/architecture-and-flow.md`
- Socket events (same folder) are listed there in one place for frontend and backend authors.
