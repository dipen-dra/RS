import mongoose, { Document, Schema } from "mongoose";

export type SecurityEventType =
  | "AUTH_FAILED"
  | "AUTH_SUCCESS"
  | "MFA_ENABLED"
  | "MFA_DISABLED"
  | "MFA_FAILED"
  | "MFA_SUCCESS"
  | "PASSWORD_CHANGED"
  | "PAYMENT_TAMPERING"
  | "IDOR_ATTEMPT"
  | "UNAUTHORIZED_ACCESS"
  | "ADMIN_ACTION"
  | "SUSPICIOUS_REQUEST"
  | "ACCOUNT_LOCKED"
  | "IP_BLOCKED"
  | "DATA_EXPORT"
  | "SESSION_INVALIDATED";

export interface IAuditLog extends Document {
  timestamp: Date;
  eventType: SecurityEventType;
  severity: "info" | "warning" | "critical";
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    timestamp: { type: Date, default: Date.now },
    eventType: {
      type: String,
      required: true,
      enum: [
        "AUTH_FAILED",
        "AUTH_SUCCESS",
        "MFA_ENABLED",
        "MFA_DISABLED",
        "MFA_FAILED",
        "MFA_SUCCESS",
        "PASSWORD_CHANGED",
        "PAYMENT_TAMPERING",
        "IDOR_ATTEMPT",
        "UNAUTHORIZED_ACCESS",
        "ADMIN_ACTION",
        "SUSPICIOUS_REQUEST",
        "ACCOUNT_LOCKED",
        "IP_BLOCKED",
        "DATA_EXPORT",
        "SESSION_INVALIDATED",
      ],
      index: true,
    },
    severity: { type: String, enum: ["info", "warning", "critical"], required: true, index: true },
    userId: { type: String, index: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

// TTL index: auto-delete logs older than 90 days
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
