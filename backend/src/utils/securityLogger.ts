/**
 * Security event logging utility
 * Maintains audit trail for security operations — persists to MongoDB AuditLog collection
 */

import { AuditLog, SecurityEventType } from "../models/AuditLog.js";

interface SecurityLog {
  timestamp: string;
  eventType: SecurityEventType;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  severity: "info" | "warning" | "critical";
}

const severityMap: Record<SecurityEventType, "info" | "warning" | "critical"> = {
  AUTH_FAILED: "warning",
  AUTH_SUCCESS: "info",
  MFA_ENABLED: "info",
  MFA_DISABLED: "warning",
  MFA_FAILED: "warning",
  MFA_SUCCESS: "info",
  PASSWORD_CHANGED: "info",
  PAYMENT_TAMPERING: "critical",
  IDOR_ATTEMPT: "critical",
  UNAUTHORIZED_ACCESS: "critical",
  ADMIN_ACTION: "warning",
  SUSPICIOUS_REQUEST: "warning",
  ACCOUNT_LOCKED: "warning",
  IP_BLOCKED: "warning",
  DATA_EXPORT: "info",
  SESSION_INVALIDATED: "info",
};

/**
 * Log security events — writes to console AND persists to MongoDB
 */
export const logSecurityEvent = (
  eventType: SecurityEventType,
  userId: string | undefined,
  ipAddress: string | undefined,
  details?: Record<string, unknown>,
  userAgent?: string,
): void => {
  const severity = severityMap[eventType];

  const log: SecurityLog = {
    timestamp: new Date().toISOString(),
    eventType,
    userId,
    ipAddress,
    userAgent,
    details,
    severity,
  };

  // Console output
  const prefix = getSeverityPrefix(severity);
  const message = formatSecurityLog(log);
  if (severity === "critical") {
    console.error(`${prefix} ${message}`);
  } else if (severity === "warning") {
    console.warn(`${prefix} ${message}`);
  } else {
    console.log(`${prefix} ${message}`);
  }

  // Persist to MongoDB (fire-and-forget — never block request)
  AuditLog.create({
    timestamp: new Date(),
    eventType,
    severity,
    userId,
    ipAddress,
    userAgent,
    details,
  }).catch((err) => {
    console.error("[AuditLog] Failed to persist audit log:", err?.message);
  });
};

/** Log authentication failure */
export const logAuthFailure = (
  email: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string,
): void => {
  logSecurityEvent("AUTH_FAILED", undefined, ipAddress, { email, reason }, userAgent);
};

/** Log authentication success */
export const logAuthSuccess = (userId: string, ipAddress?: string, userAgent?: string): void => {
  logSecurityEvent("AUTH_SUCCESS", userId, ipAddress, {}, userAgent);
};

/** Log password change */
export const logPasswordChange = (
  userId: string,
  ipAddress?: string,
  userAgent?: string,
): void => {
  logSecurityEvent("PASSWORD_CHANGED", userId, ipAddress, { action: "password_reset" }, userAgent);
};

/** Log payment tampering detection */
export const logPaymentTampering = (
  userId: string | undefined,
  clientAmount: number,
  serverAmount: number,
  ipAddress?: string,
  userAgent?: string,
): void => {
  logSecurityEvent(
    "PAYMENT_TAMPERING",
    userId,
    ipAddress,
    {
      clientAmount,
      serverAmount,
      difference: Math.abs(clientAmount - serverAmount),
    },
    userAgent,
  );
};

/** Log IDOR attempt */
export const logIdorAttempt = (
  userId: string,
  resourceType: string,
  attemptedResourceId: string,
  ipAddress?: string,
  userAgent?: string,
): void => {
  logSecurityEvent(
    "IDOR_ATTEMPT",
    userId,
    ipAddress,
    { resourceType, attemptedResourceId, action: "unauthorized_resource_access" },
    userAgent,
  );
};

/** Log unauthorized access attempt */
export const logUnauthorizedAccess = (
  endpoint: string,
  userId: string | undefined,
  ipAddress?: string,
  userAgent?: string,
): void => {
  logSecurityEvent(
    "UNAUTHORIZED_ACCESS",
    userId,
    ipAddress,
    { endpoint, action: "insufficient_permissions" },
    userAgent,
  );
};

/** Log admin actions */
export const logAdminAction = (
  adminId: string,
  action: string,
  targetId: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string,
): void => {
  logSecurityEvent(
    "ADMIN_ACTION",
    adminId,
    ipAddress,
    { action, targetId, ...details },
    userAgent,
  );
};

/** Log account lockout */
export const logAccountLocked = (
  email: string,
  ipAddress?: string,
  userAgent?: string,
): void => {
  logSecurityEvent("ACCOUNT_LOCKED", undefined, ipAddress, { email }, userAgent);
};

/** Log MFA events */
export const logMfaEvent = (
  eventType: "MFA_ENABLED" | "MFA_DISABLED" | "MFA_FAILED" | "MFA_SUCCESS",
  userId: string,
  ipAddress?: string,
  userAgent?: string,
): void => {
  logSecurityEvent(eventType, userId, ipAddress, {}, userAgent);
};

/** Log session invalidation */
export const logSessionInvalidated = (
  userId: string,
  ipAddress?: string,
  userAgent?: string,
): void => {
  logSecurityEvent("SESSION_INVALIDATED", userId, ipAddress, {}, userAgent);
};

/** Log data export */
export const logDataExport = (userId: string, ipAddress?: string, userAgent?: string): void => {
  logSecurityEvent("DATA_EXPORT", userId, ipAddress, {}, userAgent);
};

/** Get severity prefix for console output */
const getSeverityPrefix = (severity: "info" | "warning" | "critical"): string => {
  switch (severity) {
    case "critical":
      return "[🚨 SECURITY ALERT - CRITICAL]";
    case "warning":
      return "[⚠️ SECURITY WARNING]";
    case "info":
      return "[ℹ️ SECURITY INFO]";
  }
};

/** Format security log for console display */
const formatSecurityLog = (log: SecurityLog): string => {
  let message = `${log.eventType}`;
  if (log.userId) message += ` | User: ${log.userId}`;
  if (log.ipAddress) message += ` | IP: ${log.ipAddress}`;
  if (log.details && Object.keys(log.details).length > 0) {
    message += ` | Details: ${JSON.stringify(log.details)}`;
  }
  return message;
};
