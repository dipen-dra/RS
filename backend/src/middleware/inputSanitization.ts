/**
 * Input sanitization middleware
 * Prevents XSS and injection attacks by validating and cleaning inputs
 */

import { Request, Response, NextFunction } from "express";
import mongoSanitize from "express-mongo-sanitize";

/**
 * Sanitize request body, query, and params
 * Removes potentially dangerous characters and patterns
 */
export const sanitizeInputs = (req: Request, res: Response, next: NextFunction): void => {
  // Sanitize body
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }

  // Sanitize query
  if (req.query && typeof req.query === "object") {
    sanitizeObject(req.query);
  }

  // Sanitize params
  if (req.params && typeof req.params === "object") {
    sanitizeObject(req.params);
  }

  next();
};

/**
 * Recursively sanitize object properties
 */
const sanitizeObject = (obj: Record<string, unknown>): void => {
  for (const key in obj) {
    if (obj[key] === null || obj[key] === undefined) continue;

    if (typeof obj[key] === "string") {
      obj[key] = sanitizeString(obj[key] as string);
    } else if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      sanitizeObject(obj[key] as Record<string, unknown>);
    } else if (Array.isArray(obj[key])) {
      (obj[key] as unknown[]).forEach((item, index) => {
        if (typeof item === "string") {
          (obj[key] as string[])[index] = sanitizeString(item);
        } else if (typeof item === "object") {
          sanitizeObject(item as Record<string, unknown>);
        }
      });
    }
  }
};

/**
 * Sanitize individual string
 * Removes script tags and dangerous characters
 */
const sanitizeString = (str: string): string => {
  if (!str) return str;

  // Remove script tags and their content
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove event handlers
  str = str.replace(/on\w+\s*=\s*"[^"]*"/gi, "");
  str = str.replace(/on\w+\s*=\s*'[^']*'/gi, "");

  // Remove HTML tags
  str = str.replace(/<[^>]*>/g, "");

  // Remove null bytes
  str = str.replace(/\0/g, "");

  return str.trim();
};

/**
 * Validate input types and lengths
 */
export const validateInputTypes = (req: Request, res: Response, next: NextFunction): void => {
  // Check for suspiciously large strings
  const maxStringLength = 10000;

  const checkStrings = (obj: Record<string, unknown>, path: string = ""): boolean => {
    for (const key in obj) {
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof obj[key] === "string" && (obj[key] as string).length > maxStringLength) {
        console.warn(`[SECURITY] Suspiciously large string at ${currentPath}`);
        return false;
      }

      if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
        if (!checkStrings(obj[key] as Record<string, unknown>, currentPath)) {
          return false;
        }
      }
    }
    return true;
  };

  if (req.body && !checkStrings(req.body)) {
    res.status(400).json({ success: false, message: "Invalid input: string too long" });
    return;
  }

  next();
};

export default mongoSanitize;
