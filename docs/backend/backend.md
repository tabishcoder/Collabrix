# Backend Overview – Authentication System

This backend is built using **Node.js**, **Express.js**, and **MongoDB**.  
At the current stage of development, the system implements a complete **authentication module** including:

- User Registration  
- User Login  
- Access Token generation  
- Refresh Token rotation  
- Cookie-based authentication  
- Fetching authenticated user profile (`getMe`)  

---

# Requirements

## 1. Node.js
Recommended version: **16+**

## 2. Environment Variables
Create a `.env` file:

```
PORT=5000
MONGO_URI=your_mongodb_url

ACCESS_TOKEN=your_access_token_secret
REFRESH_TOKEN=your_refresh_token_secret

SMTP_USER=email_here
SMTP_PASS=your_password

```

## 3. Install dependencies
```bash
npm install
```

## 4. Start the development server
```bash
npm run dev
```
Or start the server
```bash
npm run start
```

---

# Authentication Flow

## 1. Registration
User signs up → password hashed → stored in DB → success response.

## 2. Login
User provides credentials → validated →  
Server sets:
- `accessToken` (short-lived, HTTP-only cookie)
- `refreshToken` (long-lived, HTTP-only cookie)

## 3. Access Token Usage
Used for protected routes.  
Backend reads token from cookies automatically.

## 4. Refresh Token Logic
When access token expires:

- Client sends `POST /api/auth/refresh`
- Backend verifies refresh token from cookies
- Issues a **new access token**
- Sets new access token in cookies

## 5. Get Authenticated User (getMe)
`GET /api/auth/getMe` reads the access token from cookies and returns user details.

---

# Current Modules Implemented

### ✔ Authentication (Completed)
- Register
- Login
- Refresh Token
- Get Me
- Password Recovery
- Logout

### ❌ Not Implemented Yet (Future Scope)
- Exams module  
- Role-based authorization  
- Admin panels  


# Document Status

**Version:** 1.1 
**Last Updated:** 2025-12-29
**Status:** Authentication Routes + Password Recovery Routes plugged in
**Maintained By:** Backend Team

---

# Changelog

| Date | Version | Changes | Marked By |
|:-----|:--------|:--------|:-----|
| 01-12-2025 | 1.0 | Basic APIs working | Saqlain Mansab |
| 29-12-2025 | 1.1 | Authentication Module Completed | Saqlain Mansab |
