# Collabrix — Full Project Audit (Frontend + Backend)

Date: 2026-04-23  
Scope: Auth, Projects/Tasks (Kanban), Chat, Meetings, Real-time (Sockets). AI features intentionally excluded.

---

## 1) System Understanding (Architecture)

### 1.1 Overall architecture
- **Frontend**: React SPA (**React 19 + Vite 7**) with **React Router DOM v7**, **Redux Toolkit** (slices + async thunks), TailwindCSS.
  - Routing + layouts: `frontend/src/routes/AppRoutes.jsx`, `frontend/src/layouts/AppLayout.jsx`, `frontend/src/layouts/PublicLayout.jsx`
  - State store: `frontend/src/app/store.js`
  - API client: `frontend/src/services/api.js` (Axios instance + refresh interceptor)

- **Backend**: **Express** REST API + **MongoDB (Mongoose)** + **cookie-based JWT auth** (access/refresh) + **Socket.IO**.
  - Server entry + Socket.IO: `backend/index.js`
  - Auth middleware: `backend/middleware/auth.js`
  - JWT util/service: `backend/services/JWTService.js`
  - Controllers: `backend/controller/*.js`
  - Routes: `backend/routes/*.js`
  - Models: `backend/models/*.js`

### 1.2 Tech stack summary
- **Frontend**: React, Vite, Redux Toolkit, React Router, Axios, TailwindCSS, react-hook-form + zod, @dnd-kit (drag/drop), react-hot-toast.
  - Dependencies: `frontend/package.json`
- **Backend**: Express, Socket.IO, Mongoose, cookie-parser, cors, dotenv.

### 1.3 How modules connect (high-level)
- **Auth**: Frontend thunks call API endpoints; backend sets cookies and validates them in `backend/middleware/auth.js`.
- **Spaces/Projects/Tasks**: Protected app flow depends on “active space” and then projects/tasks fetched per space/project.
- **Realtime**: Backend emits Socket.IO events to rooms `space-{id}` and `project-{id}`; frontend currently has **no socket client** to consume them.

---

## 2) Feature-by-Feature Analysis (Done / Partial / Missing / Quality)

### 2.1 Authentication (Login/Register/Roles)

**Fully implemented**
- Frontend auth flows exist: login, register, forgot-password request, OTP verify, reset password.
  - `frontend/src/features/auth/authSlice.js`
  - `frontend/src/features/auth/authApi.js`
  - Pages: `frontend/src/features/auth/pages/*`
- Backend provides auth endpoints and token refresh flow (access + refresh tokens persisted).
  - `backend/controller/auth.controller.js`, `backend/routes/auth.routes.js`, `backend/models/{User,Token,Verification}.js`

**Partially implemented / broken**
- **Frontend critical bug**: `getMe` thunk does not reject on error (missing `return rejectWithValue(...)`).
  - `frontend/src/features/auth/authSlice.js` (`getMe` catch block)
- **Backend critical bug**: auth middleware uses `User.findById(decoded)` instead of `decoded._id`.
  - `backend/middleware/auth.js`

**Missing**
- Rate limiting for login/OTP flows, request body validation standards, and a clear CSRF posture for cookie auth.

**Code quality issues**
- Inconsistent error propagation and user-facing error states across auth flows.

---

### 2.2 Project Management (Boards/Tasks/Kanban)

**Fully implemented**
- Tasks board UI supports drag/drop and optimistic updates with rollback.
  - `frontend/src/features/tasks/TasksBoard.jsx`
- Backend has routes/controllers for spaces/projects/tasks and emits events (space/project/task create/update/delete).
  - `backend/controller/{spaces,projects,tasks}.controller.js`

**Partially implemented**
- Projects slice defines `loading/error` but does not consistently set them (pending/rejected handlers incomplete).
  - `frontend/src/features/projects/projectSlice.js`
- Projects sub-sidebar is hardcoded placeholders instead of real projects from state.
  - `frontend/src/components/subsidebars/ProjectsSubSidebar.jsx`

**Missing**
- First-class “Board” configuration (if desired) vs tasks-by-status only.
- Strong UI empty states, error surfaces, and member/role management UX.

**Code quality issues**
- Inconsistent state patterns between slices (tasks slice more robust than projects slice).

---

### 2.3 Chat System

**Fully implemented (backend-only, and may be unreachable currently)**
- Chat controllers exist: private chat create/find, list chats, fetch messages, create group chat.
  - `backend/controller/chats.controller.js`
  - `backend/routes/chats.routes.js`
  - `backend/models/{Chat,Message}.js`

**Partially implemented / broken**
- **Route middleware import bug**: `backend/routes/chats.routes.js` imports `auth` incorrectly (`require('../middleware/auth')` returns an object).
- **Not mounted**: `backend/index.js` currently does **not** mount `/api/chats` routes, so chat APIs are likely unreachable from the running server.
- **Data leak risk (IDOR)**: `getChatMessages` does not verify requester is a participant of the chat.
  - `backend/controller/chats.controller.js`

**Missing**
- Frontend chat module: pages, slices, API wiring; `/chats` currently routes to a placeholder.
  - `frontend/src/routes/AppRoutes.jsx`
- Message send endpoint (and pagination), plus optional realtime delivery/typing/presence.

**Code quality issues**
- Missing authorization checks on message reads is production-blocking.

---

### 2.4 Meetings Module

**Fully implemented**
- None found.

**Partially implemented**
- Frontend has `/meetings` route but it points to a placeholder, and is duplicated.
  - `frontend/src/routes/AppRoutes.jsx`

**Missing**
- Backend meetings routes/controllers/models + frontend meeting UX.

---

### 2.5 Real-time features (Sockets)

**Fully implemented (backend only)**
- Socket.IO server exists; supports joining/leaving rooms:
  - Rooms: `space-{spaceId}`, `project-{projectId}`
  - `backend/index.js`
- Controllers emit events to those rooms (spaces/projects/tasks).

**Partially implemented / incomplete**
- Frontend has no socket client (`socket.io-client` not present; no `.on/.emit` usage).
- **No socket authZ**: any client can join any room by sending an id.
  - `backend/index.js`

**Missing**
- Socket handshake authentication; membership validation on join.
- Multi-instance scaling (Redis adapter) if horizontal scaling is planned.

---

## 3) Frontend Audit

### 3.1 Structure
- Layout-driven app shell: `AppLayout` with `Sidebar`, `TopNavbar`, and a per-route “SubSidebar”.
  - `frontend/src/layouts/AppLayout.jsx`
  - `frontend/src/components/Sidebar.jsx`
  - `frontend/src/components/subsidebars/SubSidebarSwitch.jsx`

### 3.2 State management
- Redux Toolkit store with slices for auth/spaces/projects/tasks.
  - `frontend/src/app/store.js`
- Pattern is slice + async thunks (no RTK Query). Task slice uses optimistic updates.

### 3.3 API integration
- Axios instance with refresh interceptor:
  - `frontend/src/services/api.js`
- Risk: baseURL is `VITE_API_URL` and Vite proxy is configured for `/api`. If `VITE_API_URL` isn’t set correctly, calls may not route as intended.
  - `frontend/vite.config.js`, `frontend/src/services/api.js`

### 3.4 UX gaps
- Placeholder routing for `/chats`, `/meetings`, `/aiBot`.
- Duplicate `/meetings` route in router.
- Inconsistent loading/error rendering (auth gating exists, others vary).

---

## 4) Backend Audit

### 4.1 API structure
- Mounted routes:
  - `/api/auth`, `/api/users`, `/api/spaces`, `/api/projects`, `/api/tasks`, `/api/history`
  - `backend/index.js`
- Routes/controllers are relatively direct; minimal service layer.

### 4.2 Authentication & security
- Cookie JWT design (access+refresh) exists.
- Production-readiness gaps:
  - Auth middleware bug (`decoded` misuse)
  - No rate limiting / helmet / centralized validation strategy
  - Socket room joins unauthenticated

### 4.3 Database design
- Mongoose models exist for core modules (User/Space/Project/Task + Chat/Message + Token/Verification + History).
- Missing: explicit indexes/constraints review for scaling (not audited in detail here).

### 4.4 Missing validations / edge cases
- Chat message read authorization (IDOR).
- Socket room authorization (data leakage).
- Input validation consistency (ObjectId checks, schema validation per route).

---

## 5) Real-time System Check

### 5.1 What exists
- Socket.IO server + rooms + join/leave.
  - `backend/index.js`
- Emits from spaces/projects/tasks controllers to `space-*` and `project-*`.

### 5.2 What’s incomplete
- No frontend socket client, so realtime is effectively unused.
- No socket authZ; anyone can join any room if they know an id.

### 5.3 Scalability concerns
- Default in-memory adapter: multi-instance scaling will break room broadcasts without an adapter (Redis).
- Some controller emits do extra DB reads to compute `spaceId` (performance under high write volume).

---

## 6) Gap Analysis (Completion Estimate)

### 6.1 Frontend completion (MVP readiness)
- Auth: ~70–80% (bug fix + UX polish needed)
- Projects/Tasks MVP loop: ~55–70% (tasks strong; projects sidebar/state incomplete)
- Chat: ~0–10% (routes placeholder, no UI)
- Meetings: ~0–5% (placeholder)
- Realtime: ~0–10% (no client)
- **Overall frontend**: ~35–45%

### 6.2 Backend completion
- Auth: ~60–75% implemented; **production readiness lower** until middleware/hardening fixed
- Spaces/Projects/Tasks: ~70–85% MVP
- Chat: ~25–50% (exists but mount/import/authZ issues)
- Meetings: ~0%
- Realtime: ~25–40% (emits exist, authZ/scaling missing)
- **Overall backend**: ~55–65% MVP, ~35–45% production-ready

### 6.3 Critical missing for production
- Fix auth correctness (both sides).
- Add request validation + rate limiting + security headers.
- Fix chat mounting/auth import + participant authorization.
- Lock down sockets (auth + membership enforcement).

---

## 7) Execution Roadmap — Highly Actionable Checklist (Fast MVP)

### Phase 1 — Stabilize & unblock (do first)

**Backend**
- [ ] Fix auth middleware to use `decoded._id` (and validate payload shape).
  - File: `backend/middleware/auth.js`
- [ ] Mount chat routes + correct auth import.
  - Files: `backend/index.js`, `backend/routes/chats.routes.js`
- [ ] Fix chat authorization: restrict message reads to participants.
  - File: `backend/controller/chats.controller.js`
- [ ] Add Socket.IO authZ for room joins (minimum viable).
  - File: `backend/index.js`

**Frontend**
- [ ] Fix `getMe` thunk to properly reject on error.
  - File: `frontend/src/features/auth/authSlice.js`
- [ ] Remove duplicate `/meetings` route; align `/aibot` vs `/aiBot`; replace placeholders with explicit “Coming soon” pages or remove nav items.
  - Files: `frontend/src/routes/AppRoutes.jsx`, `frontend/src/components/Sidebar.jsx`

**Exit criteria**
- Auth is reliable; chat endpoints are reachable and not leaking; sockets aren’t a security hole; app navigation isn’t broken.

---

### Phase 2 — Projects/Tasks MVP polish (core value loop)

**Frontend**
- [ ] Replace hardcoded projects list in Projects sub-sidebar with real data from Redux.
  - File: `frontend/src/components/subsidebars/ProjectsSubSidebar.jsx`
- [ ] Add `pending/rejected` handlers for projects thunks to correctly manage `loading/error`.
  - File: `frontend/src/features/projects/projectSlice.js`
- [ ] Ensure user-visible error rendering for tasks/project fetches.
  - Files: `frontend/src/features/tasks/TasksBoard.jsx`, `frontend/src/features/projects/ProjectsPage.jsx`

**Backend**
- [ ] Verify projects/tasks endpoints return the fields needed by UI consistently (populate as required; align response shapes).
  - Files: `backend/controller/projects.controller.js`, `backend/controller/tasks.controller.js`

**Exit criteria**
- “Select workspace → select project → manage tasks board” works smoothly with loading/error/empty states.

---

### Phase 3 — Chat MVP (end-to-end)

**Backend**
- [ ] Add send-message endpoint with membership validation.
  - Files: `backend/routes/chats.routes.js`, `backend/controller/chats.controller.js`, `backend/models/Message.js`
- [ ] Add pagination for message reads.
  - File: `backend/controller/chats.controller.js`

**Frontend**
- [ ] Implement chats feature module (routes + pages + Redux slice/thunks).
  - Files/Dirs: `frontend/src/features/chats/**`, update `frontend/src/routes/AppRoutes.jsx`
- [ ] Minimal chat UI: chat list + thread + composer, optimistic send with error retry.

**Exit criteria**
- Users can chat reliably without realtime extras.

---

### Phase 4 — Realtime (optional MVP+)

**Frontend**
- [ ] Add socket client and join current `space-*` and active `project-*` rooms.
  - Files: `frontend/package.json` (add `socket.io-client`), new `frontend/src/services/socket.js`
- [ ] Subscribe to `task-*`, `project-*`, `space-*` events and update Redux state.
  - Files: relevant slices (`frontend/src/features/tasks/tasksSlice.js`, `frontend/src/features/projects/projectSlice.js`, `frontend/src/features/spaces/spaceSlice.js`)

**Backend**
- [ ] Add Socket.IO handshake auth and enforce membership checks on join events.
  - File: `backend/index.js`
- [ ] If scaling to multiple instances: add Redis adapter.

---

### Phase 5 — Hardening (after MVP works)
- [ ] Add validation library and standardize request validation for auth/tasks/chat.
- [ ] Add rate limiting (auth, OTP endpoints).
- [ ] Add helmet + centralized error handling.
- [ ] Review CORS/cookies/CSRF posture (cookie auth + credentials).

---

## 8) Quick Wins (High Productivity)

### Immediate bug fixes (highest ROI)
- Fix frontend auth restoration rejection path:
  - `frontend/src/features/auth/authSlice.js` (`getMe`)
- Fix backend auth middleware decoded id usage:
  - `backend/middleware/auth.js`
- Mount chat routes + fix incorrect auth import:
  - `backend/index.js`, `backend/routes/chats.routes.js`
- Patch chat message IDOR by verifying participants:
  - `backend/controller/chats.controller.js`
- Remove duplicate `/meetings` route; fix `/aibot` vs `/aiBot` mismatch:
  - `frontend/src/routes/AppRoutes.jsx`, `frontend/src/components/Sidebar.jsx`

### Productivity refactors
- Standardize API response shapes (backend) and thunk parsing (frontend) to one convention.
- Add consistent “loading / error / empty” UI components and reuse them across modules.
- Add a small request validation layer (backend) to eliminate repeated manual checks.

---

## TOP 5 Critical Issues to Fix Before New Feature Work
1) Backend auth middleware uses wrong id (`findById(decoded)`): `backend/middleware/auth.js`  
2) Frontend `getMe` thunk doesn’t reject on error: `frontend/src/features/auth/authSlice.js`  
3) Socket room joins are unauthenticated/unauthorized: `backend/index.js`  
4) Chat routes auth import is wrong + chat routes not mounted: `backend/routes/chats.routes.js`, `backend/index.js`  
5) Chat messages endpoint lacks participant authorization (IDOR): `backend/controller/chats.controller.js`

---

## Remove/Defer to Ship Faster (Recommended)
- **Defer Meetings** entirely for MVP (remove nav/route or mark “Coming soon”).
- **Defer AI module** (already out of scope).
- **Defer advanced chat features** (typing, presence, read receipts, attachments) until chat MVP is stable.
- **Defer realtime beyond tasks** until socket authZ is implemented and verified.

