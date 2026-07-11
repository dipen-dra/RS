import { Response, NextFunction } from "express";
import { User } from "../models/User.js";
import { AuthRequest } from "./auth.js";
import { logAdminAction, logUnauthorizedAccess } from "../utils/securityLogger.js";

/**
 * Allows access to admin AND superadmin roles.
 * Use for general admin operations: booking management, vehicle management.
 */
export const adminOnly = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      logUnauthorizedAccess(req.path, undefined, req.ip);
      res.status(403).json({ success: false, message: "Admin access required." });
      return;
    }

    // Verify role from database (not just JWT) to prevent token manipulation
    const user = await User.findById(req.user._id);
    if (!user || !["admin", "superadmin"].includes(user.role)) {
      logUnauthorizedAccess(req.path, req.user._id.toString(), req.ip);
      res.status(403).json({ success: false, message: "Admin access required." });
      return;
    }

    next();
  } catch (error) {
    console.error("Admin authorization error:", error);
    res.status(500).json({ success: false, message: "Authorization check failed" });
  }
};

/**
 * Allows access ONLY to superadmin role.
 * Use for: security logs, user role management, IP block management, system config.
 */
export const superAdminOnly = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      logUnauthorizedAccess(req.path, undefined, req.ip);
      res.status(403).json({ success: false, message: "Super admin access required." });
      return;
    }

    // Verify from database
    const user = await User.findById(req.user._id);
    if (!user || user.role !== "superadmin") {
      logUnauthorizedAccess(req.path, req.user._id.toString(), req.ip);
      logAdminAction(req.user._id.toString(), "superadmin_access_denied", req.path, {}, req.ip ?? "");
      res.status(403).json({
        success: false,
        message: "Super admin access required. This action has been logged.",
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Super admin authorization error:", error);
    res.status(500).json({ success: false, message: "Authorization check failed" });
  }
};
