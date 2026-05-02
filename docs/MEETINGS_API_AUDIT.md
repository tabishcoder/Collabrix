# Meetings Module API Audit & Testing Guide

**Date**: May 2, 2026  
**Status**: Backend ✅ Implemented | Frontend ⚠️ Partial (Routing only)

---

## 1. Backend Implementation Status

### ✅ Fully Implemented Components

#### 1.1 Meeting Model (`backend/models/Meeting.js`)
```javascript
{
  _id: ObjectId,
  title: String (required, trimmed),
  createdBy: ObjectId (ref: User, indexed),
  projectId: ObjectId (ref: Project, indexed, nullable),
  groupId: UUID (required, for Azure ACS),
  participants: [{
    user: ObjectId (ref: User),
    role: 'host' | 'participant',
    joinedAt: Date,
    leftAt: Date | null,
  }],
  status: 'active' | 'ended' (indexed),
  endedAt: Date | null,
  createdAt: Date,
  updatedAt: Date,
}
```

#### 1.2 API Endpoints
All endpoints require authentication via `auth` middleware.

| Method | Endpoint | Handler | Purpose |
|--------|----------|---------|---------|
| POST | `/api/meetings/create` | `createMeeting` | Create new meeting |
| POST | `/api/meetings/:id/join` | `joinMeeting` | Join existing meeting |
| POST | `/api/meetings/:id/leave` | `leaveMeeting` | Leave meeting |
| POST | `/api/meetings/:id/end` | `endMeeting` | End meeting |
| GET | `/api/meetings/:id` | `getMeetingById` | Get meeting details |

**Routes File**: `backend/routes/meetings.routes.js`  
**Mounted in**: `backend/index.js` at line 98: `app.use('/api/meetings', meetingRoutes)`

#### 1.3 Controller Logic (`backend/controller/meetings.controller.js`)

**createMeeting()**
- Input: `{ title, projectId? }`
- Logic:
  - Validates title is present
  - If projectId provided, validates user has project access
  - Creates meeting with calling user as 'host'
  - Issues Azure ACS token for VoIP/video
  - Emits `meeting:started` socket event
- Response: `{ meeting: {...}, acs: { groupId, communicationUserId, token, expiresOn } }`

**joinMeeting()**
- Input: Meeting ID (via URL param)
- Logic:
  - Validates user can read meeting (via `canReadMeeting()`)
  - Adds user to participants if not already present
  - Issues Azure ACS token
  - Emits `meeting:user-joined` socket event with alreadyPresent flag
- Response: Same as createMeeting

**leaveMeeting()**
- Input: Meeting ID
- Logic:
  - Finds active participant entry
  - Sets `leftAt` timestamp
  - Emits `meeting:user-left` socket event
- Response: Updated meeting

**endMeeting()**
- Input: Meeting ID
- Logic:
  - Only host can end meeting (enforced in service)
  - Sets meeting status to 'ended'
  - Sets endedAt timestamp
  - Emits `meeting:ended` socket event
- Response: Updated meeting

**getMeetingById()**
- Input: Meeting ID
- Logic:
  - Validates user can read meeting
- Response: `{ meeting: {...} }`

#### 1.4 Meeting Service (`backend/services/communication/meetingService.js`)

**Access Control Functions**
```javascript
assertUserCanAccessProject(projectId, userId)
  // Checks: space owner OR space member OR project member
  // Throws 403 if denied

canReadMeeting(meeting, userId)
  // Allows: host, active members, anyone if meeting active
  // Link-style access

getActiveParticipantEntry(meeting, userId)
  // Returns active participant or null
```

**Main Functions**
```javascript
createMeeting(userId, { title, projectId })
joinMeeting(meetingId, userId)
leaveMeeting(meetingId, userId)
endMeeting(meetingId, userId)  // Host only
getMeetingById(meetingId, userId)
userMaySubscribeMeetingRoom(meetingId, userId)  // For Socket.IO auth
```

#### 1.5 Azure Communication Services Integration

**File**: `backend/services/communication/acsService.js`

- Uses `@azure/communication-identity` npm package
- Requires env var: `AZURE_CONNECTION_STRING`
- Function: `getTokenForUser(userId)` 
  - Returns: `{ communicationUserId, token, expiresOn }`
  - Used for WebRTC/video call credentials

#### 1.6 Socket.IO Integration

**Handlers in `backend/index.js`** (lines 115-135)
```javascript
socket.on('join-meeting', async (meetingId) => {
  // Validates user access via meetingService.userMaySubscribeMeetingRoom()
  // Joins `meeting-${meetingId}` room
})

socket.on('leave-meeting', (meetingId) => {
  // Leaves meeting room
})
```

**Backend Emits** (from controller)
- `meeting:started` → { meetingId, user, meeting }
- `meeting:user-joined` → { meetingId, user, alreadyPresent, meeting }
- `meeting:user-left` → { meetingId, user, meeting }
- `meeting:ended` → { meetingId, user, meeting }

---

## 2. Frontend Implementation Status

### ✅ Implemented
- **Route**: `/meetings` defined in `frontend/src/routes/AppRoutes.jsx`
- **Sidebar Navigation**: Meetings link in `frontend/src/components/Sidebar.jsx`
- **Page Component**: `frontend/src/features/modules/MeetingsPage.jsx`
- **Sub-sidebar**: `frontend/src/components/subsidebars/MeetingsSubSidebar.jsx` (shows placeholder)

### ⚠️ Partially Implemented
- **Module Wrapper**: `ProjectScopedModule` guards meetings page with project context check
- **Icon in Navigation**: Uses FaUsers icon

### ❌ Missing - Required for Full Frontend Implementation

#### 2.1 Redux State Management
**File to Create**: `frontend/src/features/meetings/meetingsSlice.js`

Should include:
```javascript
const meetingsSlice = createSlice({
  name: 'meetings',
  initialState: {
    meetings: [],
    activeMeeting: null,
    loading: false,
    error: null,
    acsCredentials: null, // { groupId, communicationUserId, token, expiresOn }
  },
  extraReducers: (builder) => {
    // Handle async thunks
  },
});
```

#### 2.2 API Service Layer
**File to Create**: `frontend/src/services/meetingsApi.js`

Should export:
```javascript
export const meetingsApi = {
  createMeeting: (title, projectId) => api.post('/meetings/create', { title, projectId }),
  joinMeeting: (meetingId) => api.post(`/meetings/${meetingId}/join`),
  leaveMeeting: (meetingId) => api.post(`/meetings/${meetingId}/leave`),
  endMeeting: (meetingId) => api.post(`/meetings/${meetingId}/end`),
  getMeeting: (meetingId) => api.get(`/meetings/${meetingId}`),
};
```

#### 2.3 Redux Thunks
**File**: `frontend/src/features/meetings/meetingsSlice.js` (or separate api file)

```javascript
export const createMeeting = createAsyncThunk(
  'meetings/createMeeting',
  async ({ title, projectId }, { rejectWithValue }) => {
    // Call meetingsApi.createMeeting()
  }
);
// Similar for join, leave, end, get
```

#### 2.4 Socket.IO Client Integration
**Files to Update**:
- Create: `frontend/src/hooks/useSocketMeeting.js` (custom hook for Socket.IO events)
- Update: `frontend/src/services/socket.js` (if exists) or create it

Should listen for:
- `meeting:started`
- `meeting:user-joined`
- `meeting:user-left`
- `meeting:ended`

Should emit:
- `join-meeting` when entering meeting
- `leave-meeting` when exiting

#### 2.5 UI Components
**Files to Create**:
- `frontend/src/features/meetings/components/MeetingsList.jsx` - Display active meetings
- `frontend/src/features/meetings/components/MeetingDetail.jsx` - Meeting details
- `frontend/src/features/meetings/components/CreateMeetingModal.jsx` - Form to create meeting
- `frontend/src/features/meetings/pages/MeetingRoom.jsx` - Live meeting interface

#### 2.6 Azure Communication Services Client
**Dependency**: Need to install `@azure/communication-react` or `@azure/communication-calling`

```javascript
npm install @azure/communication-calling @azure/communication-react
```

---

## 3. API Testing Guide

### 3.1 Prerequisites
1. Backend running on `http://localhost:5000`
2. MongoDB connected
3. User authenticated (with accessToken cookie)
4. Azure Communication Services configured (env var set)

### 3.2 Test Scenarios

#### Test 1: Create Meeting (POST /api/meetings/create)
```bash
curl -X POST http://localhost:5000/api/meetings/create \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -d '{
    "title": "Team Sync",
    "projectId": "PROJECT_ID_HERE"
  }'
```

**Expected Response (201)**:
```json
{
  "meeting": {
    "_id": "...",
    "title": "Team Sync",
    "status": "active",
    "groupId": "uuid-here",
    "projectId": "...",
    "createdBy": "...",
    "participants": [
      {
        "user": "...",
        "role": "host",
        "joinedAt": "2026-05-02T...",
        "leftAt": null
      }
    ],
    "createdAt": "2026-05-02T...",
    "updatedAt": "2026-05-02T..."
  },
  "acs": {
    "groupId": "uuid-here",
    "communicationUserId": "8:acs:...",
    "token": "eyJhbGc...",
    "expiresOn": "2026-05-02T..."
  }
}
```

#### Test 2: Join Meeting (POST /api/meetings/:id/join)
```bash
curl -X POST http://localhost:5000/api/meetings/MEETING_ID/join \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_TOKEN"
```

**Expected Response (200)**: Same structure as create, with `alreadyPresent` flag in socket emit

#### Test 3: Get Meeting (GET /api/meetings/:id)
```bash
curl http://localhost:5000/api/meetings/MEETING_ID \
  -H "Cookie: accessToken=YOUR_TOKEN"
```

**Expected Response (200)**:
```json
{
  "meeting": { ... }
}
```

#### Test 4: Leave Meeting (POST /api/meetings/:id/leave)
```bash
curl -X POST http://localhost:5000/api/meetings/MEETING_ID/leave \
  -H "Cookie: accessToken=YOUR_TOKEN"
```

**Expected Response (200)**: Meeting with user's `leftAt` timestamp set

#### Test 5: End Meeting (POST /api/meetings/:id/end)
```bash
Only host can end. Response: Meeting with status='ended', endedAt timestamp.
```

### 3.3 Error Scenarios

| Scenario | Expected Status | Error Message |
|----------|-----------------|---------------|
| No auth token | 401 | "Not authorized" |
| Invalid meeting ID | 404 | "Meeting not found" |
| User not in project (create) | 403 | "Access denied for this project" |
| Missing title (create) | 400 | "Title is required" |
| Non-host tries to end | 403 | "Only host can end meeting" |
| No Azure credentials | 503 | "Azure Communication Services error" |

---

## 4. Known Issues & Improvements

### Issues Found
1. **Missing Frontend Socket.IO Client**: No `socket.io-client` in frontend package.json
   - Status: Not installed yet, required for real-time features

2. **Azure ACS Required**: Without Azure credentials in .env, meeting creation will fail
   - Fix: Must set `AZURE_CONNECTION_STRING` env var

### Recommended Improvements
1. **Add meeting list endpoint**: `GET /api/meetings?projectId=...&status=active`
2. **Add update meeting endpoint**: `PATCH /api/meetings/:id` (title, etc.)
3. **Add participant management**: Admin controls (kick user, etc.)
4. **Recording support**: Store recording metadata when available
5. **Presence indicator**: Real-time participant count via Socket.IO

---

## 5. Checklist for Frontend Development

- [ ] Install `socket.io-client`, `@azure/communication-calling`, `@azure/communication-react`
- [ ] Create meetings Redux slice with initial state
- [ ] Create API service file with all endpoints
- [ ] Implement Socket.IO event listeners
- [ ] Build CreateMeetingModal component
- [ ] Build MeetingRoom component with ACS integration
- [ ] Add meeting list UI to MeetingsPage
- [ ] Test with real meeting flow
- [ ] Handle participant join/leave UI updates
- [ ] Test error scenarios and edge cases
