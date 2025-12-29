# Authentication & Verification API Documentation

## Authentication APIs

---

## 1. POST `/api/auth/register`

### Description
- Register a new user.
- Sends OTP for email verification.
- Publicly accessible.

### Request Body
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "StrongPassword@123"
}
```

### Success Response
```json
{
  "message": "User registered. OTP sent to email",
  "userId": "692d7eb14df1f59216e3448e"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 400 | Missing essential fields / Email already in use |
| 500 | Failed to send verification email / Server error |

---

## 2. POST `/api/auth/login`

### Description
- Login user with email and password.
- Requires email verification.
- Publicly accessible.

### Request Body
```json
{
  "email": "john@example.com",
  "password": "StrongPassword@123"
}
```

### Success Response
```json
{
  "_id": "692d7eb14df1f59216e3448e",
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Logged in Successfully"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 400 | Missing fields / Invalid credentials |
| 403 | Email not verified |
| 500 | Server error |

---

## 3. POST `/api/auth/logout`

### Description
- Logs out the user and clears cookies.
- Private route.

### Success Response
```json
{
  "message": "Logged out successfully"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 500 | Logout failed |

---

## 4. POST `/api/auth/refresh`

### Description
- Refreshes the access token using a valid refresh token in cookies.
- Private route.

### Success Response
```json
{
  "message": "Access token refreshed"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 402 | No refresh token provided |
| 403 | Refresh token invalid or expired |

---

## 5. POST `/api/auth/verify-otp`

### Description
- Verifies OTP for **email verification** or **password reset**.
- Publicly accessible.

### Request Body
```json
{
  "userId": "692d7eb14df1f59216e3448e",
  "otp": "745216"
}
```

### Success Responses

#### Email Verification
```json
{
  "success": true,
  "type": "email_verification",
  "next": "dashboard",
  "message": "Email verified successfully"
}
```

#### Password Reset OTP Verified
```json
{
  "success": true,
  "type": "password_reset",
  "next": "reset_password",
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "OTP verified. You may reset your password."
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 400 | Missing fields / Invalid OTP / OTP expired |
| 429 | Too many incorrect attempts |
| 500 | Verification failed |

---

## 6. POST `/api/auth/resend-otp`

### Description
- Resends OTP for **email verification**.
- Rate limited: 1 per minute, max 3 per hour.
- Publicly accessible.

### Request Body
```json
{
  "email": "john@example.com"
}
```

### Success Response
```json
{
  "message": "OTP sent"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 400 | Email required / User already verified |
| 404 | User not found |
| 429 | Rate limit exceeded |
| 500 | Failed to resend OTP |

---

## 7. POST `/api/auth/request-reset-password`

### Description
- Requests OTP for password recovery.
- Always returns generic response to avoid email enumeration.
- Publicly accessible.

### Request Body
```json
{
  "email": "john@example.com"
}
```

### Success Response
```json
{
  "userId": "692d7eb14df1f59216e3448e",
  "message": "OTP sent for password reset"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 400 | Email required |
| 500 | Failed to send OTP |

---

## 8. POST `/api/auth/reset-password`

### Description
- Resets password using **resetToken** obtained after OTP verification.
- Publicly accessible.

### Request Body
```json
{
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "StrongPassword@123"
}
```

### Success Response
```json
{
  "message": "Password reset successful"
}
```

### Error Responses
| Status | Message |
|--------|---------|
| 400 | Missing fields |
| 401 | Invalid or expired token |
| 404 | User not found |
| 500 | Failed to reset password |
