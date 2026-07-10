# DriveNepal Security - Quick Reference Guide

## 🔐 Critical Security Features

### 1. Payment Amount Tampering Detection

**File**: `backend/src/routes/payment.ts`

```typescript
// Before processing payment:
const paymentValidation = validatePaymentAmount(amount, total, 1);
if (!paymentValidation.valid) {
  logPaymentTampering(...);
  // Reject payment
}
```

### 2. Strong Password Enforcement

**File**: `backend/src/utils/passwordValidator.ts`

```
Minimum 10 chars + Uppercase + Lowercase + Number + Special Character
Applied to: register, reset-password, password-change
```

### 3. IDOR Prevention

**File**: `backend/src/routes/bookings.ts`

```typescript
// Only users can access their own bookings
{ user: req.user!._id }

// IDOR attempts logged
logIdorAttempt(...);
```

### 4. Brute Force Protection

**File**: `backend/src/routes/auth.ts`

```
- Failed attempts tracked
- 5 failed attempts = 15 min lockout
- lastFailedLogin timestamp tracked
- Resets on successful login
```

### 5. Admin Authorization Hardening

**File**: `backend/src/middleware/admin.ts`

```typescript
// Database verification (not just token)
const user = await User.findById(req.user._id);
if (user.role !== 'admin') {
  logUnauthorizedAccess(...);
}
```

---

## 📊 Security Logging Events

| Event               | Severity | File         | Function                |
| ------------------- | -------- | ------------ | ----------------------- |
| AUTH_FAILED         | WARNING  | auth.ts      | logAuthFailure()        |
| AUTH_SUCCESS        | INFO     | auth.ts      | logAuthSuccess()        |
| PASSWORD_CHANGED    | INFO     | auth.ts      | logPasswordChange()     |
| PAYMENT_TAMPERING   | CRITICAL | payment.ts   | logPaymentTampering()   |
| IDOR_ATTEMPT        | CRITICAL | bookings.ts  | logIdorAttempt()        |
| UNAUTHORIZED_ACCESS | CRITICAL | admin.ts     | logUnauthorizedAccess() |
| ADMIN_ACTION        | WARNING  | routes/\*.ts | logAdminAction()        |

---

## 🛡️ Protected Endpoints

### Authentication

- ✅ `POST /api/auth/register` - Strong password required
- ✅ `POST /api/auth/login` - Brute force protected
- ✅ `POST /api/auth/reset-password` - Password history checked
- ✅ `POST /api/auth/verify-otp` - OTP validation

### Bookings

- ✅ `GET /api/bookings` - User ownership verified
- ✅ `POST /api/bookings` - Price recalculated server-side
- ✅ `PATCH /api/bookings/:id/cancel` - User ownership verified, IDOR logged
- ✅ `PATCH /api/admin/bookings/:id/status` - Admin only, actions logged

### Payments

- ✅ `POST /api/payment/khalti/verify` - Amount validated, tampering detected
- ✅ `POST /api/payment/esewa/initiate` - Amount calculated server-side
- ✅ `GET /api/payment/esewa/verify` - Amount validated, tampering detected

### Users

- ✅ `GET /api/users/me` - Self access only
- ✅ `PUT /api/users/me` - Role escalation prevented
- ✅ `PUT /api/users/me/password` - Strong password required
- ✅ `PATCH /api/admin/users/:id/*` - Admin only, actions logged

---

## 🔑 Key Security Functions

### Payment Validation

```typescript
// bookingCalculator.ts
calculateBookingTotal(vehicleId, startDate, endDate, pickup, dropoff, insurance, addons);
// Returns: { subtotal, tax, total, days, ... }

// paymentValidator.ts
validatePaymentAmount(clientTotal, calculatedTotal, (tolerance = 1));
// Returns: { valid: boolean, error?: string }
```

### User Password Validation

```typescript
// passwordValidator.ts
validatePasswordStrength(password);
// Returns: { isValid, strength, message, feedback[] }

isStrongPassword(password);
// Returns: boolean
```

### Security Logging

```typescript
// securityLogger.ts
logPaymentTampering(userId, clientAmount, serverAmount, ip, userAgent);
logIdorAttempt(userId, resourceType, attemptedResourceId, ip, userAgent);
logAdminAction(adminId, action, targetId, details, ip, userAgent);
```

---

## 🚨 Security Alert Triggers

The following actions trigger security alerts (CRITICAL level):

1. **Payment Tampering Detected**
   - Client amount ≠ server-calculated amount (>1 rupee tolerance)
   - Booking creation rejected
   - User ID, IP, amounts logged

2. **IDOR Attempt**
   - User tries to access another user's booking
   - User tries to modify another user's profile
   - User ID, resource type, IP logged

3. **Unauthorized Access**
   - Non-admin attempts admin endpoint
   - User tries to access suspended account
   - User ID, endpoint, IP logged

4. **Brute Force Attack**
   - 5 failed login attempts
   - Account locked for 15 minutes
   - Email, attempt count logged

---

## 📈 Database Fields Added

### User Model

```
- passwordHistory: [String] - Last 5 hashed passwords
- failedLoginAttempts: Number - Failed login counter
- lastFailedLogin: Date - Timestamp of last failed attempt
- lastLogin: Date - Timestamp of last successful login
- passwordChangedAt: Date - When password was last changed
```

### Booking Model

```
- calculatedTotal: Number - Server-validated total
- serverValidated: Boolean - Validation flag
- priceRecalculationLog: Array - Price recalculation audit trail
  └─ timestamp, originalTotal, recalculatedTotal, difference
```

---

## ✅ Testing Checklist

Before deployment, test:

- [ ] Strong password rejected on register
- [ ] Failed logins increment counter
- [ ] Account locked after 5 failed attempts
- [ ] Payment tampering detected and rejected
- [ ] IDOR attempts rejected
- [ ] Admin endpoints require admin role
- [ ] Password history prevents reuse
- [ ] Security logs contain required fields
- [ ] Rate limiting works (20 req/15min for auth)
- [ ] Input sanitization removes malicious content

---

## 🔧 Configuration

### Environment Variables

```
JWT_SECRET=<strong_secret_key>
NODE_ENV=production
KHALTI_SECRET_KEY=<your_key>
ESEWA_SECRET=<your_key>
```

### Production Settings

```javascript
// auth.ts - sendTokenCookie
{
  httpOnly: true,
  secure: true,           // HTTPS only in production
  sameSite: 'none',       // Cross-site in production
  maxAge: 7 * 24 * 60 * 60 * 1000
}
```

---

## 📞 Support & Monitoring

### Key Logs to Monitor

1. `[🚨 SECURITY ALERT - CRITICAL]` - Immediate attention needed
2. `[⚠️ SECURITY WARNING]` - Monitor for patterns
3. `[ℹ️ SECURITY INFO]` - Audit trail

### Alert Thresholds

- Multiple failed logins: `>5 attempts`
- Payment tampering: `Any attempt`
- IDOR attempts: `Any attempt`
- Admin actions: `Log all`

---

## 📚 Related Documentation

- See `SECURITY_IMPLEMENTATION.md` for detailed implementation guide
- See route files for endpoint-specific security logic
- See middleware files for request-level security

---

**Last Updated**: May 31, 2024  
**Status**: ✅ PRODUCTION READY
