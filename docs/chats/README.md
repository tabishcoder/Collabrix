# Collabrix — Chats documentation

This folder describes the **real-time messaging** feature: models, HTTP API, sockets, Redux on the web app, and how they fit together.

| Document | Purpose |
|----------|---------|
| [architecture-and-flow.md](./architecture-and-flow.md) | Plain-English behaviour, routing, sync, receipts, notifications |
| [../apis/chats.md](../apis/chats.md) | REST endpoints, bodies, and responses |

### Source code map (quick)

| Area | Location |
|------|----------|
| HTTP routes | `backend/routes/chats.routes.js` |
| Controllers | `backend/controller/chats.controller.js` |
| Access helpers | `backend/services/chatService.js` |
| Models | `backend/models/Chat.js`, `Message.js`, `UserChatState.js` |
| Socket.IO (join / ack) | `backend/index.js` |
| Redux + thunks | `frontend/src/features/chats/chatSlice.js` |
| API client | `frontend/src/features/chats/chatApi.js` |
| Global socket listeners | `frontend/src/features/chats/ChatSocketBridge.jsx` |
| Thread UI | `frontend/src/features/chats/ChatThread.jsx` |
| Receipt ticks UI | `frontend/src/features/chats/MessageReceiptTicks.jsx` |
| Sidebar | `frontend/src/components/subsidebars/ChatsSubSidebar.jsx` |
| Page shell | `frontend/src/features/modules/ChatsPage.jsx`, `project-scope/ProjectScopedModule.jsx` |
