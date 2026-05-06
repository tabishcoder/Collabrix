# Chats — architecture and flow (plain English)

This document explains **how Collabrix chats work** from a user click through the database and back to the screen, without assuming you have already read the code.

---

## 1. What the feature is for

Users pick a **project** in the header. Under **Chats** they see:

- **General** — one automatic channel per project; everyone who can access the project can read and post.
- **Direct messages (DMs)** — two people, tied to that project context.
- **Groups** — named rooms with several people, still tied to the project.

Messages are stored in MongoDB, delivered in real time with **Socket.IO**, and the web app keeps a **Redux** cache so the UI feels instant (including optimistic “pending” sends).

---

## 2. Routing (where the UI lives)

| Path | Component | Notes |
|------|-----------|--------|
| `/chats` | `ChatsPage` | Wrapped in `AppLayout` (nav + main sidebar + **Chats** sub-sidebar). |
| | `ProjectScopedModule` | If no project is selected in the header, shows “pick a project”. |
| | `ChatThread` | Left list is **not** in this file — it is `ChatsSubSidebar` beside the main outlet. |

So: **one route**, two UI regions — list in the sub-sidebar, thread + composer in the main column.

---

## 3. Data you should know about

### Chat (`Chat`)

Represents a conversation: `kind` (`project` | `direct` | `group`), `participants`, optional `projectId`, `lastMessageText` / `lastMessageAt` for fast list rendering, etc. The **General** row is `kind: "project"` with one document per project.

### Message (`Message`)

One row per line of chat: `sender`, `content`, `clientMessageId` (optional, for idempotent resend), `deliveredTo` (who has acked receipt on the socket), soft delete via `deletedAt`.

### UserChatState

Per **user + chat**: `unreadCount`, `lastReadAt`. Used for badges in the list and to compute **read** receipts for messages you sent (everyone else has read past that timestamp).

---

## 4. Typical flows (step by step)

### A. Opening Chats

1. User selects a project in the **header** (Redux `activeProject`).
2. Navigating to `/chats` runs an effect on `ChatsPage`: clears chat UI if the project id changed, then `GET /api/chats?projectId=...` and refreshes the project (for member lists / space population).
3. The **sub-sidebar** reads the chat list from Redux and highlights the active thread.
4. Choosing a chat sets `activeChatId` and `ChatThread` loads messages with `GET /api/chats/:id/messages` and calls **mark read**.

### B. Sending a message

1. User types in the composer; **Enter** sends (Shift+Enter = newline).
2. Redux adds an **optimistic** row with a temporary `_id` so the bubble appears immediately.
3. `POST /api/chats/:chatId/messages` saves the row; response replaces the optimistic bubble with the real server message.
4. The server emits **`chat:message`** to everyone in the Socket room `chat-<chatId>`, and **`chat:inbox`** to each participant’s `user-<id>` room so sidebars can update previews and unread counts.
5. Other users’ clients **merge** socket payloads with what they already have so nothing disappears during race conditions.

### C. Delivered vs read (ticks in the UI)

This mirrors familiar chat apps:

- **Sent** — your message reached the server (single tick, **red** tint on the indigo bubble).
- **Delivered** — every **other** participant has been recorded as having received that message on the socket (`deliveredTo` filled via **`chat:ack-delivered`** from their browser).
- **Read** — every other participant’s `lastReadAt` for that chat is **at or after** that message’s time (they opened the thread or marked read).

The UI component `MessageReceiptTicks` shows **one ✓** vs **two ✓✓** and switches colour from red → amber → green.

### D. Notifications

When someone sends a message, the server can create a **`chat_message`** notification for each recipient (except the sender). The same payload is pushed over the existing **`notification`** socket event so the bell updates; marking notifications read uses the normal notifications API.

### E. Deleting

- **Message:** sender only, soft delete; others see “This message was deleted”.
- **Chat:** DMs (any participant) or groups (creator or project manager); **not** the project General channel. Deletes messages + states + chat document, then **`chat:removed`** so all clients drop it from the list.

---

## 5. Socket.IO (names only)

| Event | Direction | Purpose |
|-------|-----------|---------|
| `join-chat` / `leave-chat` | Client → server | Join / leave `chat-<id>` after access check. |
| `chat:message` | Server → clients in room | New or synced message body. |
| `chat:inbox` | Server → `user-<id>` | Sidebar preview + unread bump when appropriate. |
| `chat:ack-delivered` | Client → server | Batch of message ids the client has displayed; updates `deliveredTo`. |
| `chat:message-status` | Server → room | Refreshed delivery/read-derived status for a message. |
| `chat:read-updated` | Server → room | Someone’s `lastReadAt` moved; clients merge into `readReceipts`. |
| `chat:message-deleted` | Server → room | Tombstone / updated message. |
| `chat:removed` | Server → `user-<id>` | Conversation deleted. |

`ChatSocketBridge` (mounted in `AppLayout`) subscribes once while logged in. On **connect** / **reconnect** it refetches the **active** chat’s messages so a flaky network does not leave the thread empty.

---

## 6. Layout note (full-height thread)

The app shell uses a flex column (`h-dvh`). The main column and `ChatsPage` use **`flex-1 min-h-0`** so the thread can grow to the **remaining viewport** under the nav. The scrollable region is the middle block; the header and composer stay fixed heights so an **empty** chat still shows a tall message area and a **comfortable** composer (minimum height, not a single-line box).

---

## 7. Security (high level)

- Every HTTP handler checks the cookie session.
- For each chat, the server checks **either** project-level access (for `kind: "project"`) **or** membership in `participants` (for DMs/groups).
- Socket `join-chat` repeats the same checks so users cannot subscribe to arbitrary room names.

---

## 8. Where to change things later

| Goal | Likely touch points |
|------|---------------------|
| New message type (e.g. image) | `Message` schema, upload route, `ChatThread` bubble renderer. |
| Mentions | Parse `content` on send, extra notification type, optional `meta.mentions`. |
| E2E encryption | Would sit **above** this stack (keys, client crypto) — not in the current design. |

For HTTP details, keep `docs/apis/chats.md` in sync when you add or change routes.
