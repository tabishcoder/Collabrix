# Authentication APIs Documentation

## Authentication APIs

---

## 1. `/api/auth/register`

**Description:**  
Registers a **new user** with name, email, and password.

### Request Method  
`POST`

### Request Payload
```json
{
    "name": "abc",
    "email": "abc@gmail.com",
    "password": "12345"
}
```

### Response
```json
{
  "_id": "692d7e3850ce8b3069adf88f",
  "name": "abc",
  "email": "abc@gmail.com",
  "message": "User Registered Successfully"
}
```

---

## 2. `/api/auth/login`

**Description:**  
Logs in an existing user using email and password.  
Returns access & refresh tokens as **HTTP-only cookies**.

### Request Method  
`POST`

### Request Payload
```json
{
    "email": "abc@gmail.com",
    "password": "12345"
}
```

### Response
```json
{
  "_id": "692d7e3850ce8b3069adf88f",
  "name": "abc",
  "email": "abc@gmail.com",
  "message": "Login Successfully"
}
```

---

## 3. `/api/auth/refresh`

**Description:**  
Generates a **new access token** when the previous one expires.  
Uses the **refresh token stored in HTTP-only cookies**.

### Request Method  
`POST`

### Cookies Required  
- `refreshToken` (HTTP-only cookie)

### Response
```json
{
    "message": "Access token refreshed"
}
```

The server verifies the refresh token, issues a new access token, and sets it again in cookies.

---

## 4. `/api/auth/getMe`

**Description:**  
Returns the authenticated user's profile.  
Used to check whether the user is logged in.  
Requires **valid access token** stored in cookies.

### Request Method  
`GET`

### Cookies Required  
- `accessToken` (HTTP-only cookie)

### Response
```json
{
    "_id": "692d7eb14df1f59216e3448e",
    "name": "abc",
    "email": "abc@gmail.com",
    "createdAt": "2025-12-01T11:40:33.166Z",
    "updatedAt": "2025-12-01T11:40:33.166Z",
    "__v": 0
}
```
