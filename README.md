# RentalSphere 🚗

> A secure, full-stack vehicle rental platform built with the MERN stack, designed with security-by-design principles for academic and production use.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [System Architecture](#system-architecture)
4. [Role-Based Access Control](#role-based-access-control)
5. [Security Implementation](#security-implementation)
6. [Payment Integration](#payment-integration)
7. [Getting Started](#getting-started)
8. [Environment Variables](#environment-variables)
9. [API Reference](#api-reference)
10. [How Each Security Control Protects the System](#how-each-security-control-protects-the-system)

---

## Overview

RentalSphere is a vehicle rental platform that allows users to browse, book, and pay for cars and bikes online. It was built with **security by design** — every feature has been engineered with confidentiality, integrity, and availability in mind.

**Key capabilities:**
- Browse and filter a fleet of vehicles (cars & bikes)
- Book vehicles with date selection and insurance add-ons
- Pay via Khalti, eSewa (Nepali payment gateways), Card, PayPal, or Cash
- Manage bookings from a personal dashboard
- Admin panel for fleet and booking management
- Superadmin panel for security logs, user management, and IP blocking

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, TanStack Router, TanStack Query, Framer Motion |
| **Backend** | Node.js, Express.js, TypeScript, tsx (dev) |
| **Database** | MongoDB (local via MongoDB Compass) |
| **ODM** | Mongoose |
| **Authentication** | JWT (httpOnly cookies), bcryptjs, Google OAuth2 |
| **MFA** | TOTP via `speakeasy` + QR via `qrcode` |
| **Security** | Helmet, express-mongo-sanitize, hpp, custom middleware |
| **Email** | Nodemailer |
| **Payments** | Khalti API v2, eSewa ePay v2 |

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Client)                  │
│  React + TanStack Router + TanStack Query            │
│  Port: 5173 (dev)                                    │
└───────────────────────────┬─────────────────────────┘
                            │ HTTP /api/*  (proxied)
┌───────────────────────────▼─────────────────────────┐
│                 Express.js API Server                │
│  Port: 5001                                          │
│                                                      │
│  Middleware Stack (in order):                        │
│  1. Helmet (security headers)                        │
│  2. CORS (localhost:5173 only)                       │
│  3. IP Block Check                                   │
│  4. express-mongo-sanitize (NoSQL injection)         │
│  5. hpp (HTTP param pollution)                       │
│  6. express.json (body parsing, 10kb limit)          │
│  7. Custom request validation                        │
│                                                      │
│  Routes:                                             │
│  /api/auth   → Authentication + OAuth               │
│  /api/mfa    → TOTP MFA management                  │
│  /api/users  → Profile, export, admin management    │
│  /api/vehicles → Fleet catalogue                     │
│  /api/bookings → Booking CRUD                       │
│  /api/payment  → Khalti/eSewa verification          │
│  /api/admin    → Admin statistics                   │
│  /api/queries  → Customer support queries           │
└───────────────────────────┬─────────────────────────┘
                            │ Mongoose ODM
┌───────────────────────────▼─────────────────────────┐
│                 MongoDB (localhost:27017)             │
│  Database: rentalsphere                              │
│                                                      │
│  Collections:                                        │
│  - users          (auth, MFA, profile)               │
│  - vehicles       (fleet catalogue)                  │
│  - bookings       (reservations)                     │
│  - auditlogs      (security events, 90-day TTL)      │
│  - tokenblacklists (invalidated JWTs, auto-expire)  │
│  - notifications  (in-app alerts)                    │
│  - queries        (support tickets)                  │
└─────────────────────────────────────────────────────┘
```

---

## Role-Based Access Control

RentalSphere implements a **3-tier RBAC model**:

### 👤 User (default)
- Browse all vehicles
- Make bookings and payments
- Manage own profile, avatar, password
- View own booking history
- Set up / disable TOTP MFA
- Export own data (GDPR-aligned)
- Submit support queries

### 🛡️ Admin
All user capabilities plus:
- View and manage **all bookings** (approve, cancel, update status)
- Add, edit, and delete **vehicles** from the fleet
- View and reply to **customer support queries**
- View **overview statistics** (revenue, bookings, users)
- View and manage **all users** (activate / suspend / delete)

### 👑 Superadmin
All admin capabilities plus:
- **Change any user's role** (promote to admin / demote)
- View **persistent security audit logs** (all events, paginated, filterable)
- **Block / unblock IPs** manually from the admin panel
- Access the **Security Logs** tab (hidden from regular admins)
- View IDOR attempts, payment tampering events, authentication failures

> **Role enforcement is double-checked**: the backend verifies the role from the database on every protected request — not just from the JWT — to prevent token manipulation attacks.

---

## Security Implementation

### 1. Authentication & Session Management

#### JWT with httpOnly Cookies
```
POST /api/auth/login → sets httpOnly, SameSite=Lax cookie
```
- Tokens stored in **httpOnly cookies** — inaccessible to JavaScript, preventing XSS token theft
- `SameSite=Lax` prevents CSRF attacks on cross-site requests
- Token payload includes `id` and `role`; both are **re-verified from DB** on each request

#### Token Blacklist (True Session Invalidation)
```
POST /api/auth/logout → hashes token with SHA-256 → stores in TokenBlacklist collection
```
- On logout, the JWT is SHA-256 hashed and stored in MongoDB with its expiry time
- Every incoming request checks the blacklist **before** processing
- MongoDB TTL index auto-deletes expired blacklist entries — no cleanup needed
- **Protects against**: stolen tokens still being usable after the user logs out

#### Brute Force Protection
- After **5 failed login attempts**, the account is locked for **15 minutes**
- Response includes `lockedUntil` timestamp so the frontend can display a countdown
- Each failure increments `failedLoginAttempts` in the database
- Successful login resets the counter

### 2. Multi-Factor Authentication (TOTP)

```
POST /api/mfa/setup    → generates TOTP secret + QR code
POST /api/mfa/confirm  → verifies first TOTP, enables MFA, returns 8 backup codes
POST /api/mfa/validate → called after password login when MFA is enabled
POST /api/mfa/disable  → requires current password confirmation
```

**Flow:**
1. User scans QR code with Google Authenticator / Authy
2. Enters first 6-digit code to confirm setup
3. Receives 8 one-time backup codes (bcrypt-hashed in DB, shown plaintext **once**)
4. On next login: password → `mfaPending: true` response → TOTP input → full session issued
5. Backup codes can substitute for the TOTP token; each is single-use

**Implementation details:**
- Secret stored in `mfaSecret` field (`select: false` — never returned in queries)
- `window: 1` allows 30 seconds of clock drift
- TOTP verify uses `speakeasy.totp.verify()` with base32 encoding

### 3. Password Security

```typescript
// Enforced: 10+ chars, uppercase, lowercase, digit, special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
```

- Minimum **10 characters** with mixed complexity
- **Password history**: last 5 hashed passwords stored — prevents reuse
- Passwords hashed with **bcrypt, cost factor 12**
- `passwordChangedAt` timestamp tracked for audit purposes

### 4. IP-Level Protection

```
Tracks auth failures per IP in a sliding 1-hour window
→ 20+ failures → auto-block for 1 hour
→ Superadmin can manually block/unblock IPs via admin panel
```

- In-memory IP block map with expiry timestamps
- All blocked IPs logged as `IP_BLOCKED` security events
- Block durations auto-expire — no permanent denial-of-service risk

### 5. NoSQL Injection Prevention

```
express-mongo-sanitize strips $ and . from request bodies and query strings
```

- Prevents queries like `{ "email": { "$gt": "" } }` from bypassing auth
- Applied globally before any route handler

### 6. HTTP Security Headers (Helmet)

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | `default-src 'self'` | Blocks unauthorized script/resource loading |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Enforces HTTPS |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer leakage |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` | Disables browser APIs |

### 7. IDOR (Insecure Direct Object Reference) Prevention

Every booking and profile operation enforces ownership:

```typescript
// Users can only access their own resources
const booking = await Booking.findOne({ _id: id, user: req.user._id });
//                                              ^^^^^^^^^^^^^^^^^^^^
//                                     ownership filter always applied
```

- Attempted IDOR is detected and logged as `IDOR_ATTEMPT` in the audit log
- Admin routes use separate endpoints with `adminOnly` middleware

### 8. Payment Integrity (Anti-Tampering)

```
Client sends amount → Server re-calculates from vehicle price × days
→ If difference > £1 → reject + log PAYMENT_TAMPERING event
```

- The client-submitted amount is **never trusted**
- Server independently calculates the total using vehicle `pricePerDay`, dates, add-ons, VAT, and coupons
- eSewa: HMAC-SHA256 signature on `total_amount,transaction_uuid,product_code`
- Both Khalti and eSewa responses are **verified against the eSewa/Khalti APIs** before any booking is created

### 9. Persistent Audit Logging

All security events are persisted to MongoDB's `auditlogs` collection:

| Event | Severity |
|-------|----------|
| `AUTH_FAILED` | Warning |
| `AUTH_SUCCESS` | Info |
| `MFA_ENABLED / DISABLED / FAILED / SUCCESS` | Info / Warning |
| `PASSWORD_CHANGED` | Info |
| `PAYMENT_TAMPERING` | **Critical** |
| `IDOR_ATTEMPT` | **Critical** |
| `UNAUTHORIZED_ACCESS` | **Critical** |
| `ACCOUNT_LOCKED` | Warning |
| `IP_BLOCKED` | Warning |
| `SESSION_INVALIDATED` | Info |
| `DATA_EXPORT` | Info |
| `ADMIN_ACTION` | Warning |

- **90-day TTL**: MongoDB auto-deletes logs older than 90 days
- Superadmin can filter by severity, event type, or user ID from the Security Logs panel
- Each event captures: timestamp, userId, IP address, user-agent, and event-specific details

### 10. Input Validation & Sanitization

- `express-validator` validates all registration, login, and booking inputs
- `express-mongo-sanitize` strips NoSQL operators from body/query/params
- `hpp` (HTTP Parameter Pollution) prevents duplicate query parameter attacks
- Body size limited to 10 KB

### 11. GDPR-Aligned Data Export

```
GET /api/users/me/export → returns profile + bookings as JSON download
```

- Returns only non-sensitive fields (no password hash, no MFA secret)
- Logs `DATA_EXPORT` event in audit log
- File served with `Content-Disposition: attachment`

---

## Payment Integration

### Khalti (v2 API)
```
User clicks Pay → Frontend sends token + amount to /api/payment/khalti/verify
→ Backend verifies with Khalti API (Key auth)
→ Server re-calculates total → checks amount matches → creates booking
```

**Test credentials:**
- Secret Key: `test_secret_key_3f78fb6364ef4bd1b5fc670ce33a06f5`
- Use Khalti test phone numbers from [Khalti docs](https://docs.khalti.com/)

### eSewa (ePay v2)
```
User clicks Pay → Backend generates HMAC-SHA256 signature → redirects to eSewa form
→ User pays → eSewa redirects to /payment/esewa/success?data=...
→ Backend verifies with eSewa status API → creates booking
```

**Test credentials:**
- Product Code: `EPAYTEST`
- Secret: `8gBm/:&EnhH.1/q`
- eSewa test portal: https://rc-epay.esewa.com.np

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally (MongoDB Compass recommended)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/dipen-dra/RS.git
cd RS

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Running Locally

```bash
# Start both frontend and backend
npm run dev:all
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5001

### Creating a Superadmin

There is no registration endpoint for superadmin. To promote a user to superadmin, update directly in MongoDB:

```javascript
// In MongoDB Compass or mongosh
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "superadmin" } }
)
```

Or use the Superadmin panel → Users tab → change role dropdown (requires an existing superadmin).

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Server
PORT=5001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/rentalsphere

# Auth
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password

# Payments
KHALTI_SECRET_KEY=test_secret_key_3f78fb6364ef4bd1b5fc670ce33a06f5
ESEWA_SECRET=8gBm/:&EnhH.1/q

# Frontend URL (for CORS and eSewa redirects)
CLIENT_URL=http://localhost:5173
```

### Frontend (`.env`)

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login (returns MFA pending if enabled) |
| POST | `/api/auth/logout` | ✅ | Logout + blacklist token |
| GET | `/api/auth/me` | ✅ | Get current user |
| POST | `/api/auth/google` | — | Google OAuth login |
| POST | `/api/auth/forgot-password` | — | Send OTP reset email |
| POST | `/api/auth/reset-password` | — | Reset password with OTP |

### MFA
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/mfa/setup` | ✅ | Generate TOTP secret + QR code |
| POST | `/api/mfa/confirm` | ✅ | Verify first code and enable MFA |
| POST | `/api/mfa/validate` | — | Validate TOTP during login |
| POST | `/api/mfa/disable` | ✅ | Disable MFA (requires password) |
| GET | `/api/mfa/status` | ✅ | Get MFA status + backup codes remaining |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/me/export` | ✅ | Download own data (GDPR) |
| GET | `/api/users/admin/audit-logs` | 👑 superadmin | Paginated security audit logs |
| GET | `/api/users/admin/blocked-ips` | 👑 superadmin | List blocked IPs |
| POST | `/api/users/admin/blocked-ips` | 👑 superadmin | Block an IP |
| DELETE | `/api/users/admin/blocked-ips/:ip` | 👑 superadmin | Unblock an IP |
| PATCH | `/api/users/admin/:id/role` | 👑 superadmin | Change user role |
| GET | `/api/users/admin` | 🛡️ admin | List all users |
| PATCH | `/api/users/admin/:id/status` | 🛡️ admin | Suspend/activate user |
| DELETE | `/api/users/admin/:id` | 🛡️ admin | Delete user |

### Payments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payment/khalti/verify` | ✅ | Verify Khalti payment + create booking |
| POST | `/api/payment/esewa/initiate` | ✅ | Initiate eSewa payment form |
| GET | `/api/payment/esewa/verify` | — | eSewa callback verification |

---

## How Each Security Control Protects the System

| Threat | Control | Implementation |
|--------|---------|----------------|
| **XSS / Cookie theft** | httpOnly JWT cookie | JS cannot read `document.cookie` |
| **CSRF** | SameSite=Lax cookies | Cross-site POST requests rejected |
| **Brute force** | Account lockout | 5 attempts → 15 min lock |
| **Credential stuffing** | IP-level blocking | 20 IP failures/hour → 1 hour block |
| **Session hijacking** | Token blacklist | Logout truly invalidates tokens |
| **Weak passwords** | Password policy + history | 10+ chars, 5-password history |
| **MFA bypass** | TOTP + backup codes | Google Authenticator required |
| **NoSQL injection** | mongo-sanitize | Strips `$`, `.` operators globally |
| **XSS via script injection** | CSP header | `default-src 'self'` blocks inline scripts |
| **Clickjacking** | X-Frame-Options: DENY | Page cannot be framed |
| **MIME sniffing** | X-Content-Type-Options | Prevents content-type confusion |
| **Parameter pollution** | hpp middleware | Deduplicates query parameters |
| **IDOR** | Ownership filter on all DB queries | `{ user: req.user._id }` always enforced |
| **Payment tampering** | Server-side recalculation | Client amount compared to server total |
| **Privilege escalation** | DB role verification | Role re-read from DB, not just JWT |
| **Audit evasion** | Persistent MongoDB logs | All events stored, 90-day retention |
| **Data breach (password)** | bcrypt cost 12 | Slow hash resists offline cracking |
| **GDPR non-compliance** | Data export endpoint | Users can download and delete their data |

---

## Project Structure

```
RentalSphere/
├── src/                          # Frontend (React)
│   ├── components/               # Reusable UI components
│   │   ├── AuthCard.tsx          # Login/signup with MFA step
│   │   ├── Navbar.tsx
│   │   └── ...
│   ├── routes/
│   │   ├── admin/
│   │   │   ├── overview.tsx      # Admin dashboard
│   │   │   ├── bookings.tsx      # Booking management
│   │   │   ├── vehicles.tsx      # Fleet management
│   │   │   ├── users.tsx         # User management (role controls)
│   │   │   ├── queries.tsx       # Support queries
│   │   │   └── security-logs.tsx # Audit logs (superadmin only)
│   │   └── dashboard/
│   │       ├── mfa.tsx           # MFA setup/disable
│   │       └── ...
│   └── lib/
│       ├── api.ts                # All API functions
│       ├── auth-context.tsx      # Auth state + MFA pending
│       └── guards.ts             # Route guards (user/admin/superadmin)
│
└── backend/
    └── src/
        ├── models/
        │   ├── User.ts           # User schema (3 roles, MFA fields)
        │   ├── Booking.ts        # Booking schema
        │   ├── AuditLog.ts       # Security event log (90-day TTL)
        │   └── TokenBlacklist.ts # JWT invalidation store
        ├── middleware/
        │   ├── auth.ts           # JWT verify + blacklist check
        │   ├── admin.ts          # adminOnly + superAdminOnly guards
        │   └── security.ts       # Helmet, sanitize, IP blocking
        ├── routes/
        │   ├── auth.ts           # Login, register, logout, OAuth
        │   ├── mfa.ts            # TOTP MFA endpoints
        │   ├── users.ts          # Profile, export, admin management
        │   ├── payment.ts        # Khalti + eSewa integration
        │   └── bookings.ts       # Booking CRUD
        └── utils/
            ├── securityLogger.ts # Persistent audit logging
            └── passwordValidator.ts # Password strength + history
```

---

## License

Academic project — RTF660CEA Security module. Not for commercial redistribution.

---

*Built with security-by-design principles. Every feature considered through the lens of confidentiality, integrity, and availability.*
