import { Response, NextFunction } from "express";
import { User } from "../models/User.js";
import { AuthRequest } from "./auth.js";
import { logAdminAction, logUnauthorizedAccess } from "../utils/securityLogger.js";

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

    // Verify admin status from database (not just token)
    const user = await User.findById(req.user._id);
    if (!user || user.role !== "admin") {
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
