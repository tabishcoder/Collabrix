# Meeting API Exact Request Bodies

## 1. CREATE MEETING
**Endpoint**: `POST /api/meetings/create`

**Headers**:
```
Content-Type: application/json
Cookie: accessToken=YOUR_ACCESS_TOKEN
```

**Request Body** (Exact):
```json
{
  "title": "Team Sync Meeting",
  "projectId": "65a1111111111111111aaaaa"
}
```

**Alternative (No Project)**:
```json
{
  "title": "General Meeting"
}
```

---

## 2. JOIN MEETING
**Endpoint**: `POST /api/meetings/65b5a1234567890abcdef999/join`

**Headers**:
```
Content-Type: application/json
Cookie: accessToken=YOUR_ACCESS_TOKEN
```

**Request Body** (Exact):
```json
{}
```

**OR Empty Body** (Also works):
```

```

---

## 3. LEAVE MEETING
**Endpoint**: `POST /api/meetings/65b5a1234567890abcdef999/leave`

**Headers**:
```
Content-Type: application/json
Cookie: accessToken=YOUR_ACCESS_TOKEN
```

**Request Body** (Exact):
```json
{}
```

**OR Empty Body**:
```

```

---

## 4. END MEETING
**Endpoint**: `POST /api/meetings/65b5a1234567890abcdef999/end`

**Headers**:
```
Content-Type: application/json
Cookie: accessToken=YOUR_ACCESS_TOKEN
```

**Request Body** (Exact):
```json
{}
```

**OR Empty Body**:
```

```

---

## 5. GET MEETING
**Endpoint**: `GET /api/meetings/65b5a1234567890abcdef999`

**Headers**:
```
Content-Type: application/json
Cookie: accessToken=YOUR_ACCESS_TOKEN
```

**Request Body**: 
**NONE** (GET requests don't have body)

---

## 6. Quick Copy-Paste Guide

### For Postman - Create Meeting
```json
{
  "title": "Team Standup",
  "projectId": "YOUR_PROJECT_ID_HERE"
}
```

### For Postman - Join Meeting
```json
{}
```

### For Postman - Leave Meeting
```json
{}
```

### For Postman - End Meeting
```json
{}
```

### For Postman - Get Meeting
**No body needed**

---

## 7. Real Example Values

### Example 1: Create Meeting
```json
{
  "title": "Sprint Planning",
  "projectId": "65a9f1234567890abc123456"
}
```

### Example 2: Create Meeting (No Project)
```json
{
  "title": "General Team Meeting"
}
```

### Example 3: Join Any Meeting
```json
{}
```

---

## 8. Variable Substitution (Postman)

If using Postman with environment variables:

### Create Meeting
```json
{
  "title": "My Meeting Title",
  "projectId": "{{projectId}}"
}
```

### Join Meeting URL
```
{{base_url}}/meetings/{{meetingId}}/join
```

### Join Meeting Body
```json
{}
```

---

## 9. cURL Examples (Terminal)

### Create Meeting
```bash
curl -X POST http://localhost:5000/api/meetings/create \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -d '{
    "title": "Team Meeting",
    "projectId": "65a1111111111111111aaaaa"
  }'
```

### Join Meeting
```bash
curl -X POST http://localhost:5000/api/meetings/MEETING_ID/join \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -d '{}'
```

### Leave Meeting
```bash
curl -X POST http://localhost:5000/api/meetings/MEETING_ID/leave \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -d '{}'
```

### End Meeting
```bash
curl -X POST http://localhost:5000/api/meetings/MEETING_ID/end \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -d '{}'
```

### Get Meeting
```bash
curl -X GET http://localhost:5000/api/meetings/MEETING_ID \
  -H "Cookie: accessToken=YOUR_TOKEN"
```

---

## 10. JavaScript/Axios Examples

### Create Meeting
```javascript
axios.post('/api/meetings/create', {
  title: "Team Sync",
  projectId: "65a1111111111111111aaaaa"
})
```

### Join Meeting
```javascript
axios.post('/api/meetings/65b5a1234567890abcdef999/join', {})
```

### Leave Meeting
```javascript
axios.post('/api/meetings/65b5a1234567890abcdef999/leave', {})
```

### End Meeting
```javascript
axios.post('/api/meetings/65b5a1234567890abcdef999/end', {})
```

### Get Meeting
```javascript
axios.get('/api/meetings/65b5a1234567890abcdef999')
```

---

## Summary Table

| Action | Method | Endpoint | Body |
|--------|--------|----------|------|
| Create | POST | `/api/meetings/create` | `{"title":"...", "projectId":"..."}` |
| Join | POST | `/api/meetings/:id/join` | `{}` |
| Leave | POST | `/api/meetings/:id/leave` | `{}` |
| End | POST | `/api/meetings/:id/end` | `{}` |
| Get | GET | `/api/meetings/:id` | None |

---

## Notes
- Replace `YOUR_ACCESS_TOKEN` with actual token from login
- Replace `65a1111111111111111aaaaa` with actual project ID
- Replace `65b5a1234567890abcdef999` with actual meeting ID
- `projectId` is optional in Create Meeting
- All POST requests to join/leave/end take empty `{}` body
