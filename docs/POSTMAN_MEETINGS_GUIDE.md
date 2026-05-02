# Postman Guide: Testing Meetings APIs

---

## 1. Prerequisites Setup

### 1.1 Install & Start Backend
```bash
cd backend
npm install
npm start
```
✅ Server should run on `http://localhost:5000`

### 1.2 MongoDB Connection
Ensure `MONGO_URI` in `.env` is set (e.g., `mongodb://localhost:27017/collabrix`)

### 1.3 Azure Communication Services
Set `AZURE_CONNECTION_STRING` in `.env` with your Azure credentials

---

## 2. Postman Collection Setup

### 2.1 Create New Collection
1. Open Postman
2. Click **+ New** → **Collection**
3. Name it: `Collabrix - Meetings API`
4. Click **Create**

### 2.2 Set Up Environment Variables
1. Click **Environments** (bottom left)
2. Click **+ Create New Environment**
3. Name: `Collabrix Local`
4. Add these variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `http://localhost:5000/api` | `http://localhost:5000/api` |
| `accessToken` | (empty) | (will be filled after login) |
| `meetingId` | (empty) | (will be filled after create) |
| `userId` | (empty) | (will be filled after login) |
| `projectId` | (empty) | (get from your project) |

5. Click **Save**
6. **Select** this environment in the top right dropdown

---

## 3. Step-by-Step API Testing

### 3.1 Step 1: Register/Login User

#### 3.1.1 Register New User
**Method**: POST  
**URL**: `{{base_url}}/auth/register`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "name": "Test User",
  "email": "testuser@example.com",
  "password": "TestPassword123!"
}
```

**Expected Response** (201):
```json
{
  "message": "User registered successfully. Check your email for verification.",
  "user": {
    "_id": "65a1234567890abcdef12345",
    "name": "Test User",
    "email": "testuser@example.com"
  }
}
```

#### 3.1.2 Login User
**Method**: POST  
**URL**: `{{base_url}}/auth/login`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "email": "testuser@example.com",
  "password": "TestPassword123!"
}
```

**Expected Response** (200):
```json
{
  "message": "Login successful",
  "user": {
    "_id": "65a1234567890abcdef12345",
    "name": "Test User",
    "email": "testuser@example.com"
  }
}
```

**⚠️ IMPORTANT**: After login, a `accessToken` cookie is automatically set. Postman **automatically manages cookies** from responses.

**Save Token to Environment**:
1. Go to **Response** → **Cookies** tab
2. Copy the `accessToken` value
3. Go back to **Environments**
4. Set `accessToken` variable to this value
5. Or use Postman's **Tests** tab (see section 3.9)

---

### 3.2 Step 2: Get/Create Project (if needed)

#### Get Active Project
**Method**: GET  
**URL**: `{{base_url}}/projects?spaceId=YOUR_SPACE_ID`

**Headers**:
```
Cookie: accessToken={{accessToken}}
Content-Type: application/json
```

**Response**: Will show `projectId` you need

---

### 3.3 Step 3: Create Meeting

**Method**: POST  
**URL**: `{{base_url}}/meetings/create`

**Headers**:
```
Cookie: accessToken={{accessToken}}
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "title": "Team Sync Meeting",
  "projectId": "{{projectId}}"
}
```

**Expected Response** (201):
```json
{
  "meeting": {
    "_id": "65b5a1234567890abcdef999",
    "title": "Team Sync Meeting",
    "status": "active",
    "groupId": "550e8400-e29b-41d4-a716-446655440000",
    "projectId": "65a1111111111111111aaaaa",
    "createdBy": "65a1234567890abcdef12345",
    "participants": [
      {
        "_id": "65b5a1234567890abcdef001",
        "user": "65a1234567890abcdef12345",
        "role": "host",
        "joinedAt": "2026-05-02T10:30:00.000Z",
        "leftAt": null
      }
    ],
    "createdAt": "2026-05-02T10:30:00.000Z",
    "updatedAt": "2026-05-02T10:30:00.000Z"
  },
  "acs": {
    "groupId": "550e8400-e29b-41d4-a716-446655440000",
    "communicationUserId": "8:acs:1234567890abcdef",
    "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ...",
    "expiresOn": "2026-05-02T11:30:00.000Z"
  }
}
```

**Save Meeting ID**:
1. In **Tests** tab, add:
```javascript
var jsonData = pm.response.json();
pm.environment.set("meetingId", jsonData.meeting._id);
```
2. Click **Send** again
3. Now `{{meetingId}}` variable is available

---

### 3.4 Step 4: Get Meeting Details

**Method**: GET  
**URL**: `{{base_url}}/meetings/{{meetingId}}`

**Headers**:
```
Cookie: accessToken={{accessToken}}
Content-Type: application/json
```

**Expected Response** (200):
```json
{
  "meeting": {
    "_id": "65b5a1234567890abcdef999",
    "title": "Team Sync Meeting",
    "status": "active",
    "groupId": "550e8400-e29b-41d4-a716-446655440000",
    "projectId": "65a1111111111111111aaaaa",
    "createdBy": "65a1234567890abcdef12345",
    "participants": [
      {
        "_id": "65b5a1234567890abcdef001",
        "user": "65a1234567890abcdef12345",
        "role": "host",
        "joinedAt": "2026-05-02T10:30:00.000Z",
        "leftAt": null
      }
    ],
    "createdAt": "2026-05-02T10:30:00.000Z",
    "updatedAt": "2026-05-02T10:30:00.000Z"
  }
}
```

---

### 3.5 Step 5: Join Meeting (Using Different User)

**Create 2nd User**: Follow Step 3.1 with different email

**Method**: POST  
**URL**: `{{base_url}}/meetings/{{meetingId}}/join`

**Headers**:
```
Cookie: accessToken={{accessToken_User2}}
Content-Type: application/json
```

**Body**: Empty or `{}`

**Expected Response** (200):
```json
{
  "meeting": {
    "_id": "65b5a1234567890abcdef999",
    "title": "Team Sync Meeting",
    "status": "active",
    "participants": [
      {
        "_id": "65b5a1234567890abcdef001",
        "user": "65a1234567890abcdef12345",
        "role": "host",
        "joinedAt": "2026-05-02T10:30:00.000Z",
        "leftAt": null
      },
      {
        "_id": "65b5a1234567890abcdef002",
        "user": "65a9999999999999999bbbbb",
        "role": "participant",
        "joinedAt": "2026-05-02T10:35:00.000Z",
        "leftAt": null
      }
    ]
  },
  "acs": {
    "groupId": "550e8400-e29b-41d4-a716-446655440000",
    "communicationUserId": "8:acs:9876543210fedcba",
    "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjIifQ...",
    "expiresOn": "2026-05-02T11:35:00.000Z"
  }
}
```

✅ Notice: Participants count increases, new user has role "participant"

---

### 3.6 Step 6: Leave Meeting

**Method**: POST  
**URL**: `{{base_url}}/meetings/{{meetingId}}/leave`

**Headers**:
```
Cookie: accessToken={{accessToken_User2}}
Content-Type: application/json
```

**Body**: Empty or `{}`

**Expected Response** (200):
```json
{
  "meeting": {
    "_id": "65b5a1234567890abcdef999",
    "title": "Team Sync Meeting",
    "status": "active",
    "participants": [
      {
        "_id": "65b5a1234567890abcdef001",
        "user": "65a1234567890abcdef12345",
        "role": "host",
        "joinedAt": "2026-05-02T10:30:00.000Z",
        "leftAt": null
      },
      {
        "_id": "65b5a1234567890abcdef002",
        "user": "65a9999999999999999bbbbb",
        "role": "participant",
        "joinedAt": "2026-05-02T10:35:00.000Z",
        "leftAt": "2026-05-02T10:40:00.000Z"  ← Now has leftAt
      }
    ]
  }
}
```

✅ User still in participants array but with `leftAt` timestamp

---

### 3.7 Step 7: End Meeting (Host Only)

**Method**: POST  
**URL**: `{{base_url}}/meetings/{{meetingId}}/end`

**Headers**:
```
Cookie: accessToken={{accessToken}}
Content-Type: application/json
```

**Body**: Empty or `{}`

**Expected Response** (200):
```json
{
  "meeting": {
    "_id": "65b5a1234567890abcdef999",
    "title": "Team Sync Meeting",
    "status": "ended",  ← Changed from "active"
    "groupId": "550e8400-e29b-41d4-a716-446655440000",
    "projectId": "65a1111111111111111aaaaa",
    "createdBy": "65a1234567890abcdef12345",
    "participants": [...],
    "endedAt": "2026-05-02T10:45:00.000Z",  ← Now has endedAt
    "createdAt": "2026-05-02T10:30:00.000Z",
    "updatedAt": "2026-05-02T10:45:00.000Z"
  }
}
```

---

## 4. Error Testing

### 4.1 Test: No Authentication Token

**Method**: POST  
**URL**: `{{base_url}}/meetings/create`

**Headers** (without token):
```
Content-Type: application/json
```

**Body**:
```json
{
  "title": "Test Meeting",
  "projectId": "123"
}
```

**Expected Response** (401):
```json
{
  "message": "Not authorized"
}
```

---

### 4.2 Test: Invalid Meeting ID

**Method**: GET  
**URL**: `{{base_url}}/meetings/invalid_id_123`

**Headers**:
```
Cookie: accessToken={{accessToken}}
Content-Type: application/json
```

**Expected Response** (404 or 400):
```json
{
  "message": "Meeting not found"
}
```

---

### 4.3 Test: Missing Required Field

**Method**: POST  
**URL**: `{{base_url}}/meetings/create`

**Headers**:
```
Cookie: accessToken={{accessToken}}
Content-Type: application/json
```

**Body** (missing title):
```json
{
  "projectId": "65a1111111111111111aaaaa"
}
```

**Expected Response** (400):
```json
{
  "message": "Title is required"
}
```

---

### 4.4 Test: Non-Host Tries to End Meeting

**Method**: POST  
**URL**: `{{base_url}}/meetings/{{meetingId}}/end`

**Headers** (Using User2 who joined, not host):
```
Cookie: accessToken={{accessToken_User2}}
Content-Type: application/json
```

**Expected Response** (403):
```json
{
  "message": "Only the meeting host can end the meeting"
}
```

---

## 5. Advanced: Postman Automation Scripts

### 5.1 Auto-capture Meeting ID in Tests Tab

Add to **Tests** tab of Create Meeting request:

```javascript
// Capture meeting ID from response
if (pm.response.code === 201) {
  var jsonData = pm.response.json();
  pm.environment.set("meetingId", jsonData.meeting._id);
  console.log("Meeting ID saved:", jsonData.meeting._id);
}
```

### 5.2 Validate Response Structure

```javascript
pm.test("Response has meeting object", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property('meeting');
  pm.expect(jsonData.meeting).to.have.property('_id');
  pm.expect(jsonData.meeting).to.have.property('title');
  pm.expect(jsonData.meeting).to.have.property('status', 'active');
});
```

### 5.3 Validate ACS Credentials

```javascript
pm.test("ACS credentials present", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.acs).to.have.property('groupId');
  pm.expect(jsonData.acs).to.have.property('communicationUserId');
  pm.expect(jsonData.acs).to.have.property('token');
  pm.expect(jsonData.acs).to.have.property('expiresOn');
});
```

---

## 6. Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **401 Unauthorized** | Make sure `accessToken` is set in Environment. Login first. |
| **Cookie not sent** | Check Postman → Settings → Accept cookies. Ensure Cookie header is set. |
| **404 Meeting not found** | Verify `meetingId` is correct. Check database if meeting exists. |
| **Azure error** | Ensure `AZURE_CONNECTION_STRING` is set in backend `.env` |
| **CORS error** | CORS is already configured in backend to allow localhost:5173 |

---

## 7. Testing Workflow Summary

**Complete Flow**:
1. ✅ Register User 1 → Get accessToken
2. ✅ Create Meeting → Save meetingId
3. ✅ Get Meeting Details → Verify created
4. ✅ Register User 2 → Get 2nd accessToken
5. ✅ User 2 Joins Meeting → Check participants
6. ✅ Get Meeting (verify 2 participants)
7. ✅ User 2 Leaves → Check leftAt timestamp
8. ✅ User 1 Ends Meeting → Status = "ended"
9. ✅ Get Meeting → Verify final state

---

## 8. Import Postman Collection (Optional)

To import a pre-built collection, save this as `Collabrix-Meetings.json`:

```json
{
  "info": {
    "name": "Collabrix - Meetings API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth - Register",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"name\": \"Test User\", \"email\": \"test@example.com\", \"password\": \"Test123!\"}"
        },
        "url": {
          "raw": "{{base_url}}/auth/register",
          "host": ["{{base_url}}"],
          "path": ["auth", "register"]
        }
      }
    },
    {
      "name": "Meetings - Create",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Cookie",
            "value": "accessToken={{accessToken}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"title\": \"Team Meeting\", \"projectId\": \"{{projectId}}\"}"
        },
        "url": {
          "raw": "{{base_url}}/meetings/create",
          "host": ["{{base_url}}"],
          "path": ["meetings", "create"]
        }
      }
    }
  ]
}
```

---

## 9. Next Steps

After testing APIs in Postman:
- ✅ Verify all endpoints work correctly
- ✅ Note any errors or edge cases
- ✅ Then integrate into frontend with Redux + Socket.IO
