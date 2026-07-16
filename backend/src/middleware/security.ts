import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import { Express, Request, Response, NextFunction } from "express";
import { logSecurityEvent } from "../utils/securityLogger.js";

// ── In-memory IP block list ──────────────────────────────────
interface BlockedIP {
  blockedAt: number;
  reason: string;
  expiresAt: number; // epoch ms
}

const blockedIPs = new Map<string, BlockedIP>();
const ipFailureCount = new Map<string, { count: number; windowStart: number }>();

const IP_FAIL_THRESHOLD = 20; // block after 20 auth failures from same IP
const IP_FAIL_WINDOW_MS = 60 * 60 * 1000; // within 1 hour
const IP_BLOCK_DURATION_MS = 10 * 1000; // block for 10 seconds (temporary for testing)

/**
 * Record a failed auth attempt for an IP
 */
export const recordIpAuthFailure = (ip: string): void => {
  const now = Date.now();
  const entry = ipFailureCount.get(ip);

  if (!entry || now - entry.windowStart > IP_FAIL_WINDOW_MS) {
    ipFailureCount.set(ip, { count: 1, windowStart: now });
  } else {
    entry.count += 1;
    if (entry.count >= IP_FAIL_THRESHOLD && !blockedIPs.has(ip)) {
      blockIp(ip, "Exceeded auth failure threshold");
    }
  }
};

/**
 * Manually block an IP
 */
export const blockIp = (ip: string, reason: string = "Manual block"): void => {
  const now = Date.now();
  blockedIPs.set(ip, {
    blockedAt: now,
    reason,
    expiresAt: now + IP_BLOCK_DURATION_MS,
  });
  logSecurityEvent("IP_BLOCKED", undefined, ip, { reason });
};

/**
 * Unblock an IP
 */
export const unblockIp = (ip: string): boolean => {
  return blockedIPs.delete(ip);
};

/**
 * Get all currently blocked IPs
 */
export const getBlockedIPs = (): Array<{ ip: string; reason: string; expiresAt: number }> => {
  const now = Date.now();
  const active: Array<{ ip: string; reason: string; expiresAt: number }> = [];
  for (const [ip, info] of blockedIPs.entries()) {
    if (info.expiresAt > now) {
      active.push({ ip, reason: info.reason, expiresAt: info.expiresAt });
    } else {
      blockedIPs.delete(ip); // clean up expired
    }
  }
  return active;
};

/**
 * IP block check middleware
 */
export const ipBlockMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const blocked = blockedIPs.get(ip);
  if (blocked) {
    if (Date.now() < blocked.expiresAt) {
      res.status(403).json({
        success: false,
        message: "Your IP has been temporarily blocked due to suspicious activity.",
        unblockAt: new Date(blocked.expiresAt).toISOString(),
      });
      return;
    } else {
      blockedIPs.delete(ip); // expired — remove
    }
  }
  next();
};

/**
 * Apply security headers and protection middleware
 */
export const setupSecurityMiddleware = (app: Express): void => {
  // Helmet - sets various HTTP headers for security
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: "deny" },
      noSniff: true,
      xssFilter: true,
    }),
  );

  // Data sanitization - removes $ and . from keys (prevents NoSQL injection)
  app.use(mongoSanitize());

  // HTTP Parameter Pollution protection
  app.use(hpp());

  // IP block check (applied before any route)
  app.use(ipBlockMiddleware);

  // Custom security headers
  app.use(securityHeadersMiddleware);

  // Request logging for sensitive operations
  app.use(requestLoggingMiddleware);
};

/**
 * Custom security headers middleware
 */
const securityHeadersMiddleware = (_req: Request, res: Response, next: NextFunction): void => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  next();
};

/**
 * Request logging middleware for sensitive operations
 */
const requestLoggingMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (
    req.path.includes("/auth/") ||
    req.path.includes("/payment/") ||
    req.path.includes("/admin/")
  ) {
    console.log(
      `[SECURITY] ${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.headers["user-agent"]}`,
    );
  }
  next();
};

/**
 * Request validation middleware - checks for suspicious patterns
 */
export const requestValidationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const contentLength = req.headers["content-length"];
  if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
    res.status(413).json({ success: false, message: "Payload too large" });
    return;
  }

  const bodyStr = JSON.stringify(req.body);
  if (/(['";`]|\bor\b|\band\b|--|\/\*|\*\/|xp_|sp_)/i.test(bodyStr)) {
    console.warn(`[SECURITY] Suspicious pattern detected in request from ${req.ip}`);
  }

  next();
};
