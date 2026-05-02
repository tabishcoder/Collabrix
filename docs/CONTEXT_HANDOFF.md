# Collabrix — Developer Context Handoff
**Date:** April 24, 2026  
**Branch:** `fe-pm`  
**Purpose:** Paste this file at the start of a new chat to restore full context.

---

## 1. Project Overview

**Collabrix** is an AI-powered remote team collaboration platform (currently AI features are out of scope). It is a full-stack monorepo:

```
Collabrix/
├── frontend/   React 19 + Vite 7 SPA
└── backend/    Express + MongoDB + Socket.IO API
```

**Running locally:**
- Backend: `npm run start` in `/backend` → port 5000
- Frontend: `npm run dev` in `/frontend` → port 5173
- Vite proxies `/api` → `localhost:5000`

---

## 2. Tech Stack

### Frontend
- React 19, Vite 7, React Router DOM v7
- Redux Toolkit (slices + `createAsyncThunk`, no RTK Query)
- TailwindCSS v4
- Axios (central instance at `frontend/src/services/api.js` with 401 refresh interceptor)
- react-hook-form + zod (auth forms)
- @dnd-kit (Kanban drag/drop)
- react-hot-toast

### Backend
- Express.js, Node.js
- MongoDB + Mongoose
- Socket.IO (rooms: `space-{id}`, `project-{id}`)
- JWT cookie-based auth (access + refresh tokens)
- bcryptjs, nodemailer, crypto

---

## 3. Architecture

### Auth flow
- Cookies: `accessToken` (short-lived) + `refreshToken` (long-lived)
- Middleware: `backend/middleware/auth.js` — verifies access token, attaches `req.user`
- 401 interceptor in Axios automatically calls `/api/auth/refresh` and retries

### App flow
1. `ProtectedRoute` checks `isAuthenticated` → dispatches `fetchSpaces`
2. `WorkspaceGate` shows if no `activeSpace` → user picks/creates workspace
3. `ProjectsSubSidebar` shows projects for active workspace
4. `TasksBoard` shows kanban/list for active project

### Socket.IO
- Backend: authenticated via cookie JWT in `io.use()` middleware
- Join handlers: `join-space`, `join-project` — check membership before joining rooms
- Frontend: **NO socket client yet** (socket.io-client not installed, no listeners)

---

## 4. Models

### User (`backend/models/User.js`)
```
_id, name, email, passwordHash, avatar, isVerified, meta{resendCount, lastSentAt, hourWindowStart}
```

### Space (`backend/models/Space.js`) — UPDATED
```
_id, name,
owner: ObjectId (ref User),
members: [{ user: ObjectId, role: 'admin'|'member', joinedAt }]
```
- `owner` is NOT in `members[]` — checked separately
- Indexes on `owner` and `members.user`

### Project (`backend/models/Project.js`) — UPDATED
```
_id, name, spaceId,
members: [{ user: ObjectId, role: 'manager'|'contributor'|'viewer', addedAt }],
tasks: [ObjectId],
boardColumns: [{ key: String, name: String, order: Number }]
  // default: [{key:'todo',name:'To Do',order:0}, {key:'in_progress',...}, {key:'done',...}]
```

### Task (`backend/models/Task.js`) — NOT YET ENRICHED
```
_id, title, description, status (string = column key), projectId, assignee, createdBy
```
**Missing fields** (planned but NOT yet added): `priority`, `dueDate`, `labels`

### Invite (`backend/models/Invite.js`) — NEW
```
_id, workspaceId, email, role('admin'|'member'), tokenHash, status('pending'|'accepted'|'revoked'),
invitedBy, acceptedBy, expiresAt (3 days, TTL index)
```

### History (`backend/models/History.js`)
```
entityType: 'task'|'project'|'member'|'space'
action: 'created'|'updated'|'moved'|'deleted'|'assigned'|'added'|'removed'|
        'role_changed'|'invite_sent'|'invite_accepted'|'columns_updated'
```

### Other models (unchanged)
- `Chat`, `Message`, `Token`, `Verification`

---

## 5. RBAC System

### Roles
**Workspace (Space) roles:**
- `owner` — full control, stored in `space.owner` field (not in members[])
- `admin` — manage workspace, invite, create/archive projects
- `member` — participate in projects they're added to

**Project roles:**
- `manager` — edit board, manage project members
- `contributor` — create/edit/move tasks
- `viewer` — read-only

### Role propagation rule
Space `owner` → implicit `owner` in all projects  
Space `admin` → implicit `admin` (manager-level) in all projects  
Otherwise: check `project.members[].role`

### Key files
- `backend/utils/rbac.js` — `getSpaceRole(spaceId, userId)`, `getProjectRole(projectId, userId)`
- `backend/middleware/authorize.js` — `requireSpaceRole([...])`, `requireProjectRole([...])`
- `frontend/src/utils/roles.js` — `SPACE_ADMIN_ROLES`, `PROJECT_MANAGE_ROLES`, `PROJECT_WRITE_ROLES`, `canManageSpace()`, `canManageProject()`, `canWriteTasks()`

### Authorization rules
| Action | Required role |
|---|---|
| Delete workspace | `owner` |
| Update workspace / invite / create project | `owner\|admin` |
| Delete/update/board-columns / manage project members | `owner\|admin\|manager` |
| Create/edit/move tasks | `owner\|admin\|manager\|contributor` |
| Read project/tasks | any project member |

---

## 6. API Endpoints

### Auth (`/api/auth`)
POST /register, /login, /logout, /verify-otp, /resend-otp, /request-reset-password, /reset-password, /refresh  
GET /api/users/me

### Spaces (`/api/spaces`)
GET / — list user's spaces (includes `myRole`)  
GET /:id — single space  
POST / — create  
PUT /:id — update (owner|admin)  
DELETE /:id — delete (owner)  
GET /:id/members — list members  
POST /:id/members — add member `{userId, role}` (owner|admin)  
PUT /:id/members/:userId/role — change role `{role}` (owner|admin)  
DELETE /:id/members/:userId — remove member (owner|admin)  

### Projects (`/api/projects`)
GET /space/:spaceId — list projects (includes `myRole`)  
GET /:id — single project  
POST / — create `{name, spaceId}` (space owner|admin)  
PUT /:id — update name (manager+)  
DELETE /:id — delete (manager+)  
PUT /:id/board-columns — replace columns `{columns:[{key,name,order}]}` (manager+)  
POST /:id/members — add `{userId, role}` (manager+)  
PUT /:id/members/:userId/role — change role (manager+)  
DELETE /:id/members/:userId — remove member (manager+)  

### Tasks (`/api/tasks`)
GET /project/:projectId — list tasks  
GET /:id — single task  
POST / — create `{title, projectId, description?, status?, assignee?}` (contributor+)  
PUT /:id — update (contributor+); `status` validated against `boardColumns`  
DELETE /:id — delete (contributor+)  

### Invites (`/api/invites`)
GET /token/:token — public, get invite info  
POST /workspace — send `{workspaceId, email, role}` (owner|admin)  
POST /token/:token/accept — accept (auth required, email must match)  
GET /workspace/:workspaceId/pending — list pending (owner|admin)  
DELETE /:inviteId — revoke (owner|admin)  

### Chats (`/api/chats`) — backend only, no frontend yet
Routes exist, mounted in index.js, auth fixed.

---

## 7. Frontend State (Redux)

### `auth` slice
```js
{ user, isAuthenticated, loading, error }
```
Thunks: `login`, `register`, `logout`, `getMe`

### `spaces` slice — UPDATED
```js
{ spaces[], activeSpace, activeSpaceRole, loading, initialized, error }
```
- `activeSpaceRole`: `'owner'|'admin'|'member'|null` — set from `space.myRole`
- `setActiveSpace(space)` reducer also sets `activeSpaceRole`

### `projects` slice
```js
{ projects[], activeProject, loading, error }
```
- `activeProject` has `myRole` field from API
- `setActiveProject(project)` reducer
- Thunks: `fetchProjectsBySpace`, `fetchProjectById`, `createProject`, `updateProject`, `deleteProject`

### `tasks` slice
```js
{ tasks[], isLoading, isError, message }
```
- `optimisticStatusUpdate({ taskId, status })` reducer (used for drag/drop rollback)
- Thunks: `getProjectTasks`, `addTask`, `editTask`, `removeTask`

---

## 8. Key Frontend Files

```
frontend/src/
├── app/store.js
├── services/api.js                          # Axios + refresh interceptor
├── utils/roles.js                           # Role constants + helpers
├── routes/
│   ├── AppRoutes.jsx                        # All routes (fixed duplicates)
│   ├── ProtectedRoute.jsx
│   └── PublicRoutes.jsx
├── layouts/
│   ├── AppLayout.jsx                        # Sidebar + SubSidebar + main
│   └── PublicLayout.jsx
├── components/
│   ├── Sidebar.jsx
│   ├── TopNavbar.jsx                        # Has workspace dropdown + Invite Members button
│   ├── LogoutButton.jsx
│   └── subsidebars/
│       ├── ProjectsSubSidebar.jsx           # Real projects, role-gated New Project
│       ├── ChatsSubSidebar.jsx
│       ├── MeetingsSubSidebar.jsx
│       ├── AISubSidebar.jsx
│       └── SubSidebarSwitch.jsx
├── features/
│   ├── auth/
│   │   ├── authSlice.js, authApi.js
│   │   ├── auth.validation.js
│   │   ├── components/ (AuthInput, AuthButton, AuthLayout)
│   │   └── pages/ (Login, Register, VerifyOtp, ForgotPassword, ResetPassword)
│   ├── spaces/
│   │   ├── spaceSlice.js, spaceApi.js
│   │   └── WorkspaceGate.jsx
│   ├── projects/
│   │   ├── projectSlice.js, projectApi.js
│   │   └── ProjectsPage.jsx
│   ├── tasks/
│   │   ├── tasksSlice.js, tasksApi.js
│   │   ├── TasksBoard.jsx                   # Kanban + List view, role-gated
│   │   ├── Column.jsx                       # Droppable column (uses column.key)
│   │   ├── TaskCard.jsx                     # Draggable card (NEEDS REDESIGN)
│   │   ├── TaskListRow.jsx                  # List view row with status dropdown
│   │   ├── AddTaskModal.jsx                 # Column picker + toast
│   │   └── BoardColumnsEditor.jsx           # Add/rename/reorder/remove columns
│   └── invites/
│       ├── inviteApi.js
│       ├── InviteModal.jsx                  # Send invite with role picker + copy link
│       └── JoinWorkspace.jsx                # Public page: token preview → accept
```

---

## 9. What Was Built in This Session

### Bugs fixed (from previous session)
- `backend/middleware/auth.js` — `decoded._id` fix
- `frontend/src/features/auth/authSlice.js` — `getMe` rejectWithValue fix
- `backend/index.js` — socket auth + membership checks
- `backend/routes/chats.routes.js` — auth import fix
- `backend/controller/chats.controller.js` — IDOR fix
- `backend/models/History.js` — added `role_changed`, `invite_sent`, `invite_accepted`, `columns_updated` to action enum
- `backend/controller/projects.controller.js` — `deleteProject` now uses `PROJECT_MANAGE_ROLES` (not `SPACE_ADMIN_ROLES`)
- `backend/controller/projects.controller.js` — `addProjectMember` `userId.toString()` comparison fix

### Features built
1. **RBAC schema** — Space/Project members restructured to `{user, role, joinedAt}`
2. **RBAC middleware** — `authorize.js` with `requireSpaceRole()` / `requireProjectRole()`
3. **Workspace invites** — full backend (Invite model, controller, routes, email)
4. **JoinWorkspace page** — token preview, login/register redirect, accept flow
5. **InviteModal** — role picker, copy link, shown in TopNavbar (admin+ only)
6. **Dynamic board columns** — stored on Project, editor UI, validated in tasks controller
7. **Kanban + List view** — toggle in TasksBoard
8. **ProjectsSubSidebar** — real data from Redux, role-gated New Project button
9. **Migration script** — `backend/scripts/migrate-members.js` (run once for existing data)
10. **`frontend/src/utils/roles.js`** — shared role constants

---

## 10. What's Remaining (Priority Order)

### HIGH — implement next

#### A. Task Detail Modal (highest impact)
- Click any TaskCard → opens `TaskDetailModal.jsx`
- Left: inline title edit, description textarea
- Right sidebar: assignee picker (from project members), priority select, due date, column/status
- Requires: add `priority` (`none|low|medium|high|urgent`), `dueDate`, `labels[]` to `Task` model + controller
- Files to create: `frontend/src/features/tasks/TaskDetailModal.jsx`
- Files to update: `backend/models/Task.js`, `backend/controller/tasks.controller.js`, `frontend/src/features/tasks/TaskCard.jsx`, `tasksSlice.js`

#### B. Workspace Members Modal
- Opened from TopNavbar workspace dropdown ("Manage Members" button)
- Tabs: Members list (avatar/name/email/role + change role + remove) | Pending Invites (revoke) | Invite tab
- All backend APIs already exist — frontend only
- Files to create: `frontend/src/features/spaces/WorkspaceMembersModal.jsx`
- Files to update: `frontend/src/components/TopNavbar.jsx`

#### C. TaskCard redesign
- Priority color dot, due date chip (red if overdue), assignee avatar
- Hide delete button for viewers (`canManageProject(myProjectRole)`)
- Files to update: `frontend/src/features/tasks/TaskCard.jsx`

### MEDIUM

#### D. Project Member Management Panel
- Tab/panel inside `ProjectsPage.jsx` (manager+ only)
- List members with roles, "Add Member" form (space members not yet in project + role picker)
- All backend APIs already exist
- Files to create: `frontend/src/features/projects/ProjectMembersPanel.jsx`

#### E. Task filtering/search
- Filter bar above board: by assignee, priority, due date, text search
- Client-side only (uses loaded tasks array)
- Files to create: `frontend/src/features/tasks/TaskFilters.jsx`

#### F. Project archive
- Add `status: 'active'|'archived'` to Project model
- `PUT /api/projects/:id/archive` endpoint
- Sidebar groups: Active | Archived

### LOW
- Self-leave workspace / project endpoints
- Viewer "Read Only" badge on board

---

## 11. Pending One-Time Operations

```bash
# Run once to migrate existing MongoDB data (flat ObjectId[] → {user, role} structure)
node backend/scripts/migrate-members.js
```

---

## 12. Environment Variables

**`backend/.env`**
```
MONGO_URI=...
ACCESS_TOKEN_SECRET=...
REFRESH_TOKEN_SECRET=...
RESET_TOKEN_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...   # Use Gmail App Password, NOT account password
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**`frontend/.env`** (if exists)
```
VITE_API_URL=/api
```

> Gmail SMTP: Go to Google Account → Security → 2-Step Verification → App Passwords → generate one. Use that as `SMTP_PASS`.

---

## 13. Git Status

- Branch: `fe-pm`
- All changes on this branch are NOT yet merged to main
- Commit message suggestion for current state:
  ```
  feat: RBAC, workspace invites, dynamic kanban + role management
  
  - Space/Project members: ObjectId[] → [{user, role}] schema
  - authorize.js middleware: requireSpaceRole/requireProjectRole
  - Workspace invites: Invite model, send/accept/revoke endpoints + email
  - JoinWorkspace page + InviteModal in TopNavbar
  - Dynamic board columns: editor UI + backend validation
  - Kanban ↔ List view toggle
  - ProjectsSubSidebar: real data + role-gated actions
  - History model: added new action enum values
  - Fixed: deleteProject auth, userId.toString() comparison, ESLint
  - Migration script for existing data
  ```

---

## 14. Known Limitations / Not Built Yet

| Item | Status |
|---|---|
| Frontend socket client | Not started — `socket.io-client` not installed |
| Chat frontend UI | Not started — backend routes exist, no frontend |
| Meetings module | Placeholder only |
| Task priority / due date / labels | Model not updated yet |
| Task detail modal | Not built |
| Workspace members modal | Not built |
| Project member panel UI | Not built |
| Task filters | Not built |
| Project archive | Not built |
| Self-leave workspace/project | Not built |
