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
3. [Package Dependencies](#package-dependencies)
4. [System Architecture](#system-architecture)
5. [Role-Based Access Control](#role-based-access-control)
6. [Security Implementation](#security-implementation)
7. [Payment Integration](#payment-integration)
8. [Getting Started](#getting-started)
9. [Environment Variables](#environment-variables)
10. [API Reference](#api-reference)
11. [How Each Security Control Protects the System](#how-each-security-control-protects-the-system)
12. [Viva Preparation — 30 Questions & Answers](#viva-preparation--30-questions--answers)
13. [Known Bypass Methods & Limitations](#known-bypass-methods--limitations)

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

## 🔑 Test Credentials

> Run `npm run seed:all` from the project root first to populate the database.

| Role | Email | Password | Access |
|------|-------|----------|--------|
| 👑 **Superadmin** | `superadmin@rentalsphere.com` | `SuperAdmin@2024!` | Everything — security logs, role management, IP blocking, audit logs |
| 🛡️ **Admin** | `admin@rentalsphere.com` | `Admin@2024!` | Fleet, bookings, queries, user activation/suspension |
| 👤 **User** | `user@rentalsphere.com` | `User@2024!` | Browse, book, MFA setup, data export, own profile |

### Extra Seeded Users (all role: user)

| Name | Email | Password |
|------|-------|----------|
| Emily Clark | `emily.clark@example.com` | `Emily@2024!` |
| James Wilson | `james.wilson@example.com` | `James@2024!` |
| Priya Sharma | `priya.sharma@example.com` | `Priya@2024!` |
| Oliver Brown | `oliver.brown@example.com` | `Oliver@2024!` |
| Aisha Patel | `aisha.patel@example.com` | `Aisha@2024!` |

### Seeded Data Summary

| Collection | Count | Notes |
|------------|-------|-------|
| Users | 8 | 1 superadmin, 1 admin, 6 users |
| Vehicles | 9 | 5 cars, 4 bikes across London & Edinburgh |
| Bookings | 85 | 6 months history — completed, cancelled, active, upcoming |
| Queries | 12 | Mix of replied and pending support tickets |
| Notifications | 18 | booking, payment, alert types |
| Audit Logs | 120 | All severity levels across 6 months |

### Payment Test Credentials

| Gateway | Credential | Value |
|---------|-----------|-------|
| Khalti | Test Secret Key | `test_secret_key_3f78fb6364ef4bd1b5fc670ce33a06f5` |
| eSewa | Product Code | `EPAYTEST` |
| eSewa | Secret | `8gBm/:&EnhH.1/q` |

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

---

## Package Dependencies

### Backend (`backend/package.json`)

#### Production Dependencies

| Package | Version | Purpose |
|---------|---------|--------|
| `express` | ^4.21.2 | Web framework — handles routing, middleware, HTTP |
| `mongoose` | ^8.10.0 | MongoDB ODM — schema definition, validation, querying |
| `bcryptjs` | ^2.4.3 | Password hashing (cost factor 12) and comparison |
| `jsonwebtoken` | ^9.0.2 | JWT generation and verification for auth sessions |
| `cookie-parser` | ^1.4.7 | Parses incoming httpOnly cookie headers |
| `helmet` | ^8.2.0 | Sets 11+ HTTP security headers (CSP, HSTS, etc.) |
| `express-mongo-sanitize` | ^2.2.0 | Strips `$` and `.` from inputs — prevents NoSQL injection |
| `hpp` | ^0.2.3 | HTTP Parameter Pollution protection |
| `express-rate-limit` | ^7.5.0 | Rate limiting middleware (available for use) |
| `express-validator` | ^7.2.1 | Input validation and sanitization chains |
| `speakeasy` | ^2.0.0 | TOTP secret generation and verification (Google Auth) |
| `qrcode` | ^1.5.4 | Generates QR code data URL for MFA setup |
| `nodemailer` | ^6.9.16 | Sends password reset OTP and booking confirmation emails |
| `google-auth-library` | ^10.6.2 | Verifies Google OAuth2 ID tokens |
| `cors` | ^2.8.5 | Cross-Origin Resource Sharing configuration |
| `dotenv` | ^16.4.7 | Loads environment variables from `.env` file |
| `multer` | ^2.1.1 | Handles multipart file uploads (avatar images) |
| `multer-storage-cloudinary` | ^4.0.0 | Cloudinary storage engine for multer |
| `cloudinary` | ^1.41.3 | Cloud image storage and transformation |
| `crypto` | ^1.0.1 | SHA-256 hashing for token blacklist, HMAC for eSewa |

#### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|--------|
| `tsx` | ^4.19.3 | TypeScript execution engine for development (`tsx watch`) |
| `typescript` | ^5.8.3 | TypeScript compiler |
| `@types/express` | ^5.0.0 | Express type definitions |
| `@types/bcryptjs` | ^2.4.6 | bcryptjs type definitions |
| `@types/jsonwebtoken` | ^9.0.9 | jsonwebtoken type definitions |
| `@types/cors` | ^2.8.17 | cors type definitions |
| `@types/hpp` | ^0.2.7 | hpp type definitions |
| `@types/multer` | ^2.1.0 | multer type definitions |
| `@types/nodemailer` | ^6.4.17 | nodemailer type definitions |
| `@types/qrcode` | ^1.5.6 | qrcode type definitions |
| `@types/speakeasy` | ^2.0.10 | speakeasy type definitions |
| `@types/node` | ^22.0.0 | Node.js global type definitions |

---

### Frontend (`package.json`)

#### Core Framework

| Package | Version | Purpose |
|---------|---------|--------|
| `react` | ^19.2.0 | UI library |
| `react-dom` | ^19.2.0 | React DOM renderer |
| `typescript` | ^5.8.3 | TypeScript compiler |
| `vite` | ^7.3.1 | Build tool and dev server |

#### Routing & Data Fetching

| Package | Version | Purpose |
|---------|---------|--------|
| `@tanstack/react-router` | ^1.168.25 | File-based type-safe routing |
| `@tanstack/react-query` | ^5.83.0 | Server state management, caching, mutations |
| `@tanstack/react-start` | ^1.167.50 | SSR/full-stack integration |
| `@tanstack/router-plugin` | ^1.167.28 | Vite plugin for auto route generation |

#### UI Components & Styling

| Package | Version | Purpose |
|---------|---------|--------|
| `tailwindcss` | ^4.2.1 | Utility-first CSS framework |
| `@tailwindcss/vite` | ^4.2.1 | Vite plugin for Tailwind CSS |
| `tailwind-merge` | ^3.5.0 | Merges conflicting Tailwind class names |
| `tw-animate-css` | ^1.3.4 | CSS animation utilities |
| `class-variance-authority` | ^0.7.1 | Type-safe component variant management |
| `clsx` | ^2.1.1 | Conditional class name composition |
| `framer-motion` | ^12.38.0 | Production-grade animations and transitions |
| `lucide-react` | ^0.575.0 | 1000+ consistent SVG icon set |
| `sonner` | ^2.0.7 | Beautiful toast notification system |

#### Radix UI Primitives

| Package | Purpose |
|---------|--------|
| `@radix-ui/react-accordion` | Collapsible sections |
| `@radix-ui/react-alert-dialog` | Modal confirmation dialogs |
| `@radix-ui/react-avatar` | User avatar with fallback |
| `@radix-ui/react-checkbox` | Accessible checkboxes |
| `@radix-ui/react-dialog` | Modal dialogs |
| `@radix-ui/react-dropdown-menu` | Dropdown menus |
| `@radix-ui/react-label` | Form labels |
| `@radix-ui/react-popover` | Floating popovers |
| `@radix-ui/react-progress` | Progress bars |
| `@radix-ui/react-select` | Native-accessible select |
| `@radix-ui/react-separator` | Visual dividers |
| `@radix-ui/react-slider` | Range sliders |
| `@radix-ui/react-switch` | Toggle switches |
| `@radix-ui/react-tabs` | Tab navigation |
| `@radix-ui/react-tooltip` | Hover tooltips |

#### Forms & Validation

| Package | Version | Purpose |
|---------|---------|--------|
| `react-hook-form` | ^7.71.2 | Performant form management |
| `@hookform/resolvers` | ^5.2.2 | Connects Zod to react-hook-form |
| `zod` | ^3.24.2 | TypeScript-first schema validation |

#### Other Frontend Packages

| Package | Version | Purpose |
|---------|---------|--------|
| `@react-oauth/google` | ^0.13.5 | Google One-Tap OAuth login component |
| `recharts` | ^2.15.4 | Chart library for admin analytics |
| `date-fns` | ^4.1.0 | Date formatting and manipulation |
| `react-day-picker` | ^9.14.0 | Calendar date picker component |
| `embla-carousel-react` | ^8.6.0 | Carousel/slider component |
| `input-otp` | ^1.4.2 | OTP input field component |
| `react-resizable-panels` | ^4.6.5 | Resizable split-panel layouts |
| `vaul` | ^1.1.2 | Drawer/bottom-sheet component |
| `cmdk` | ^1.1.1 | Command palette component |

---

## Viva Preparation — 30 Questions & Answers

### Authentication & Sessions

**Q1. Why are JWTs stored in httpOnly cookies instead of localStorage?**
> `localStorage` is accessible via `document.cookie` / `localStorage.getItem()` from any JavaScript running on the page. If an XSS vulnerability exists, an attacker's injected script can steal the token. `httpOnly` cookies are completely inaccessible to JavaScript — only the browser sends them automatically with requests, making token theft via XSS impossible.

**Q2. What is the purpose of `SameSite=Lax` on the auth cookie?**
> It prevents the browser from sending the cookie on cross-site POST requests. This mitigates CSRF attacks — a malicious site at `evil.com` cannot trigger authenticated requests to `rentalsphere.com` because the browser will not attach the cookie to cross-origin form submissions or AJAX POST calls.

**Q3. How does your logout actually invalidate a session server-side?**
> On logout, the current JWT is SHA-256 hashed and stored in the `TokenBlacklist` MongoDB collection along with its expiry timestamp. Every subsequent request first checks this collection. If the token hash is found, the request is rejected with 401 even if the token is otherwise cryptographically valid. MongoDB TTL index auto-deletes the entry after the token's natural expiry.

**Q4. Why hash the token before storing it in the blacklist?**
> Storing the raw JWT would create a new attack surface — anyone with read access to the database could extract live tokens. SHA-256 hashing is a one-way function: even if the `TokenBlacklist` collection is compromised, the hashes cannot be reversed to obtain usable tokens.

**Q5. Why does the auth middleware re-read the user's role from the database instead of trusting the JWT?**
> A JWT is signed but not encrypted — the payload can be decoded by anyone. If role escalation or other manipulation is attempted by modifying the payload (breaking the signature), the signature check catches it. However, if the JWT secret were ever leaked, a forged token could claim any role. Re-reading from the DB ensures the user's current database state (including suspensions and role changes) is always authoritative.

---

### Multi-Factor Authentication

**Q6. What algorithm does your TOTP implementation use and why?**
> TOTP (Time-based One-Time Password) uses **HMAC-SHA1** over the current Unix timestamp divided into 30-second windows, defined in RFC 6238. It is used because it requires no network connectivity on the authenticator app side (works offline), is time-limited (codes expire every 30s), and is supported by all major authenticator apps.

**Q7. What is `window: 1` in your speakeasy.totp.verify() call?**
> It allows a tolerance of ±1 time window (30 seconds before and after the current window), totalling a 90-second acceptance period. This accounts for clock drift between the server and the user's phone without significantly weakening security.

**Q8. How are backup codes stored and why?**
> Each backup code is hashed with **bcrypt** (cost 10) before storage. When a user submits a backup code, `bcrypt.compare()` checks it against each stored hash. After successful use, the code is removed from the array (single-use). This means even if the database is breached, the backup codes themselves cannot be recovered.

**Q9. What happens during login when MFA is enabled?**
> The login endpoint first validates the password. If correct, it returns `{ mfaPending: true, userId }` — **no token or cookie is issued**. The frontend shows a TOTP input. The user submits the code to `/api/mfa/validate` with their userId. Only after TOTP verification does the server issue the JWT cookie and complete the session.

**Q10. Why does disabling MFA require the current password?**
> Disabling MFA is a security-downgrading action. Requiring the password ensures that even if someone gains access to an already-authenticated session (e.g., walked up to an unlocked computer), they cannot remove MFA without knowing the password. This provides a second factor for the administrative action itself.

---

### Password Security

**Q11. Why is bcrypt preferred over SHA-256 for password hashing?**
> SHA-256 is designed to be *fast* — millions of hashes per second on a GPU. bcrypt is deliberately slow via a configurable cost factor. At cost 12, each hash takes ~250ms, making brute-force and dictionary attacks computationally infeasible. SHA-256 also lacks a built-in salt, making it vulnerable to rainbow table attacks.

**Q12. What does password history prevent and how is it implemented?**
> Password history prevents users from cycling back to a previously used password (e.g., Password1! → Password2! → Password1!). The last 5 password hashes are stored in a `passwordHistory` array. On password change, `bcrypt.compare()` is run against each stored hash. If any match, the change is rejected.

**Q13. What are your password complexity requirements and why each one?**
> 10+ characters (length), uppercase letter (prevents all-lowercase), lowercase letter, digit, and special character. Each requirement exponentially increases the keyspace — a 10-character mixed-complexity password has ~10^18 possible combinations vs ~10^14 for lowercase-only.

---

### Injection & Input Attacks

**Q14. How does express-mongo-sanitize prevent NoSQL injection?**
> MongoDB queries can be manipulated by injecting operators like `{ "$gt": "" }` into request bodies, which could bypass authentication checks (`find({ password: { $gt: "" } })`). `express-mongo-sanitize` recursively removes any key containing `$` or `.` from `req.body`, `req.query`, and `req.params` before they reach route handlers.

**Q15. What is HTTP Parameter Pollution and how does hpp prevent it?**
> HPP occurs when a query string contains duplicate parameters: `?sort=asc&sort=desc`. Express populates `req.query.sort` as `['asc', 'desc']` (an array). If the application expects a string and passes it directly to a database query, the array can cause unexpected behaviour. The `hpp` middleware strips duplicates, keeping only the last value.

**Q16. What does the Content-Security-Policy header do?**
> CSP tells the browser which sources are trusted for loading scripts, styles, images, etc. With `default-src 'self'`, only resources from the same origin are allowed. Even if an attacker injects a `<script src="https://evil.com/steal.js">` tag via XSS, the browser will refuse to load it.

---

### Authorisation & Access Control

**Q17. What is an IDOR vulnerability and how do you prevent it?**
> Insecure Direct Object Reference occurs when an API endpoint accepts a resource ID and returns it without checking if the requester owns it. Example: `GET /api/bookings/67abc` would return any user's booking. Prevention: every database query includes `{ _id: id, user: req.user._id }` — if the booking doesn't belong to the requesting user, Mongoose returns null and a 404 is sent.

**Q18. How does your RBAC work at the database level vs the JWT level?**
> The JWT carries the role at token-issue time. The backend `adminOnly` and `superAdminOnly` middleware re-fetch the user from MongoDB on every request and check the `role` field there. If an admin was demoted between requests, their next request will be rejected even with a valid token.

**Q19. What prevents a regular admin from accessing superadmin endpoints?**
> The `superAdminOnly` middleware explicitly checks `user.role === 'superadmin'` (from DB). Any attempt by an `admin`-role user also logs an `ADMIN_ACTION` security event with action `superadmin_access_denied`, creating a detectable audit trail.

---

### Payment Security

**Q20. How do you prevent payment amount tampering?**
> The client sends a payment token/amount, but the backend **ignores the client-supplied amount**. It independently recalculates the booking total using: `vehicle.pricePerDay × days + insurance + add-ons + VAT + service fee − discount`. The recalculated total is compared to the payment gateway's confirmed amount. If the difference exceeds £1, the booking is rejected and a `PAYMENT_TAMPERING` critical event is logged.

**Q21. How does eSewa signature verification work?**
> The server generates an HMAC-SHA256 signature over the string `total_amount={x},transaction_uuid={id},product_code={code}` using the eSewa secret key. This signature is sent to eSewa's payment form. After payment, eSewa redirects with a base64-encoded response that includes the transaction status. The backend then calls eSewa's status verification API to independently confirm the payment before creating any booking record.

---

### IP Blocking & Rate Limiting

**Q22. How does your IP-level blocking work?**
> An in-memory `Map<string, BlockedIP>` tracks failure counts per IP within a 1-hour sliding window. After 20 failures, the IP is added to a block map with a 1-hour expiry. The `ipBlockMiddleware` runs before all routes — blocked IPs receive a 403 with the unblock timestamp. Superadmins can also block/unblock IPs manually via the admin panel.

**Q23. What is the difference between account lockout and IP blocking?**
> Account lockout (5 failures, 15 min) targets a specific user account and prevents brute-force of a known email. IP blocking (20 failures, 1 hour) targets the network source and prevents credential stuffing attacks where an attacker tries many different accounts from the same IP.

---

### Audit Logging

**Q24. Why are audit logs stored in MongoDB rather than a log file?**
> File-based logs are easily deleted, hard to query, not structured, and don't survive container restarts without volume mounts. MongoDB provides structured storage, indexing (fast queries by eventType, severity, userId), TTL-based auto-cleanup, and the same backup/restore infrastructure as the rest of the application data.

**Q25. What is the 90-day TTL index and how does it work?**
> A TTL (Time-to-Live) index in MongoDB is a special index on a Date field with `expireAfterSeconds` set. MongoDB runs a background process every 60 seconds that deletes documents where `timestamp < now - 90 days`. This ensures logs are automatically purged, complying with data minimisation principles without any manual cleanup cron job.

**Q26. What security events are classified as 'critical' and why?**
> `PAYMENT_TAMPERING`, `IDOR_ATTEMPT`, and `UNAUTHORIZED_ACCESS` are critical because they indicate active exploitation attempts — not mistakes or failed logins. They represent an attacker who has already bypassed one layer and is probing deeper. These warrant immediate investigation vs `warning` events which may be accidental.

---

### General Security Design

**Q27. What is 'security by design' and how does your system demonstrate it?**
> Security by design means security is built into every component from the start, not bolted on afterwards. Examples in RentalSphere: payment amounts are *always* recalculated server-side (integrity by design); MFA is *built into* the login flow (not an optional plugin); audit logging is *automatic* in every route that touches sensitive data; IDOR prevention is *in every database query* (not a middleware afterthought).

**Q28. How does the system protect against XSS?**
> Three layers: (1) `httpOnly` cookies — even if XSS executes, it cannot steal the auth token; (2) Content-Security-Policy header — blocks loading of external scripts injected by attackers; (3) React's JSX automatically escapes all rendered strings — `{userInput}` is never interpreted as HTML.

**Q29. What is the difference between authentication and authorisation in your system?**
> **Authentication** (who are you?) is handled by the `protect` middleware — it verifies the JWT, checks the blacklist, and loads the user from MongoDB. **Authorisation** (what can you do?) is handled by `adminOnly` and `superAdminOnly` middleware — they check the authenticated user's role. Authentication must always succeed before authorisation is checked.

**Q30. If the JWT secret were leaked, what is the impact and what is your mitigation?**
> Impact: an attacker could forge tokens for any userId/role and bypass authentication. Mitigation in this system: (1) the backend re-reads roles from the database, so a forged `superadmin` token for a regular user's ID would still be rejected; (2) rotating the JWT secret immediately invalidates all existing tokens (since all future verifications fail); (3) the token blacklist operates on token hashes — re-signing all tokens effectively acts as a global logout. Long-term mitigation: use short-lived tokens (15 min) with refresh tokens.

---

## Known Bypass Methods & Limitations

> This section documents the theoretical weaknesses of each security control as implemented. Understanding these is essential for penetration testing and for discussing improvements in a viva.

### 1. JWT / Cookie Authentication

| Bypass Method | Condition | Mitigation Already in Place |
|--------------|-----------|-----------------------------|
| **Token theft via XSS** | Attacker finds a stored XSS vulnerability | `httpOnly` cookie — JS cannot read it ✅ |
| **CSRF attack** | Attacker tricks user into cross-site request | `SameSite=Lax` prevents cross-site POSTs ✅ |
| **JWT secret brute-force** | Weak secret (`secret123`) | Use 256-bit random secret ✅ (if .env is properly set) |
| **Expired token reuse** | Token naturally expires | `TokenExpiredError` caught in middleware ✅ |
| **Token forging after secret leak** | JWT secret exposed | DB role re-verification limits blast radius ✅ |
| ⚠️ **Man-in-the-middle** | HTTP (not HTTPS) in production | HSTS header set, but only effective after first HTTPS visit |

### 2. TOTP MFA

| Bypass Method | Condition | Mitigation |
|--------------|-----------|------------|
| **TOTP code interception** | MITM on HTTP | Requires HTTPS in production |
| **Time-window brute force** | Attacker tries all 1M codes in 30s | No rate limit on `/api/mfa/validate` — ⚠️ **gap**: should add rate limiting |
| **Backup code exhaustion** | All 8 codes leaked | User must re-setup MFA |
| **Authenticator app access** | Attacker has physical phone | Physical security — out of scope |
| **SIM swap** | N/A — TOTP is app-based, not SMS | ✅ App-based TOTP is not vulnerable to SIM swap |
| ⚠️ **Account recovery bypass** | No MFA-aware account recovery flow | Forgot-password currently resets without requiring MFA re-enroll |

### 3. Brute Force / Account Lockout

| Bypass Method | Condition | Mitigation |
|--------------|-----------|------------|
| **Distributed attack** | Many IPs, one account | Lockout still triggers after 5 failures regardless of IP ✅ |
| **IP rotation** | Each attempt from a new IP | IP block only triggers after 20 attempts per IP — ⚠️ single-IP lockout helps |
| **Slow brute force** | One attempt every 15 min | Extremely slow — not practical ✅ |
| **Username enumeration** | Response differs for unknown vs locked user | Both return identical `401` message ✅ |
| ⚠️ **Server restart clears IP block map** | In-memory map lost on restart | Gap: IP blocks should be persisted to DB |

### 4. NoSQL Injection

| Bypass Method | Condition | Mitigation |
|--------------|-----------|------------|
| **Operator injection in body** | `{ "email": { "$gt": "" } }` | `express-mongo-sanitize` strips `$` keys ✅ |
| **Dot-notation injection** | `{ "user.role": "superadmin" }` | Dots stripped by sanitize middleware ✅ |
| **JSON type confusion** | Content-Type not JSON | Express only parses JSON body ✅ |
| ⚠️ **Second-order injection** | Malicious data stored then queried unsanitized | Mongoose parameterised queries prevent this ✅ |

### 5. Payment Integrity

| Bypass Method | Condition | Mitigation |
|--------------|-----------|------------|
| **Client-side price manipulation** | Modify request body amount | Server recalculates independently ✅ |
| **Replay attack** | Reuse old Khalti token | Khalti token is single-use — second verify call fails ✅ |
| **eSewa response tampering** | Modify base64 `data` param | Backend verifies with eSewa status API ✅ |
| ⚠️ **Currency mismatch** | eSewa returns amount in paisa, comparison in rupees | Validated in `validatePaymentAmount` utility |
| ⚠️ **Race condition** | Two simultaneous verify calls for same token | No idempotency key — could create duplicate bookings |

### 6. IDOR Protection

| Bypass Method | Condition | Mitigation |
|--------------|-----------|------------|
| **Direct ID access** | `GET /api/bookings/otherId` | Query always includes `user: req.user._id` ✅ |
| **Mass assignment** | Setting `user` field in POST body | `user` field is always set from `req.user._id` server-side ✅ |
| **Admin endpoint access** | Regular user calls admin route | `adminOnly` middleware blocks and logs ✅ |
| ⚠️ **Enumerable IDs** | MongoDB ObjectIDs are guessable (time-based) | Ownership check makes guessing pointless ✅ |

### 7. Audit Logging

| Bypass Method | Condition | Mitigation |
|--------------|-----------|------------|
| **Log deletion** | Attacker with MongoDB access | Requires DB credentials — separate from app auth |
| **Log flooding** | Triggering thousands of events to hide real activity | Timestamps and IP addresses still searchable |
| ⚠️ **Log tampering** | Write access to `auditlogs` collection | No write-once/append-only enforcement in this implementation |
| ⚠️ **In-flight log bypass** | Fire-and-forget — if DB is down, logs are lost | Gap: logs should queue to disk if DB write fails |

### 8. IP Blocking

| Bypass Method | Condition | Mitigation |
|--------------|-----------|------------|
| **VPN / proxy hopping** | New IP for each session | IP block only adds friction, not a complete defence |
| **Server restart** | In-memory map is cleared | ⚠️ Gap: should persist to Redis or MongoDB |
| **IPv6 evasion** | Block is on IPv4 | Express `req.ip` captures IPv6 — same block applies ✅ |

### 9. Session Invalidation (Token Blacklist)

| Bypass Method | Condition | Mitigation |
|--------------|-----------|------------|
| **Pre-logout token capture** | Token captured before logout | Token is immediately blacklisted on logout ✅ |
| **Blacklist DB down** | MongoDB unavailable | Auth middleware catches DB error and returns 401 ✅ |
| ⚠️ **Blacklist performance** | Millions of tokens = slow lookup | TTL index keeps collection small; indexed on `tokenHash` |

### Summary of Critical Gaps

| # | Gap | Recommended Fix |
|---|-----|-----------------|
| 1 | No rate limit on `/api/mfa/validate` | Add `express-rate-limit` (5 attempts / 10 min per IP) |
| 2 | IP block map lost on server restart | Persist to MongoDB or Redis |
| 3 | Forgot-password doesn't re-enroll MFA | Require MFA setup again after password reset |
| 4 | eSewa payment race condition | Add idempotency key / transaction lock |
| 5 | Audit logs not append-only | Use MongoDB change streams or dedicated log service |
| 6 | In-flight audit log loss | Queue failed writes to disk |

---

*Built with security-by-design principles. Every feature considered through the lens of confidentiality, integrity, and availability.*
