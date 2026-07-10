import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User.js";
import { TokenBlacklist, hashToken } from "../models/TokenBlacklist.js";

export interface AuthRequest extends Request {
  user?: IUser;
}

interface JwtPayload {
  id: string;
  role: string;
  exp?: number;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Try cookie first, then Authorization header
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      res.status(401).json({ success: false, message: "Not authenticated. Please log in." });
      return;
    }

    // Check if token has been blacklisted (invalidated on logout)
    const tokenHash = hashToken(token);
    const blacklisted = await TokenBlacklist.findOne({ tokenHash });
    if (blacklisted) {
      res.status(401).json({ success: false, message: "Session has been invalidated. Please log in again." });
      return;
    }

    const secret = process.env.JWT_SECRET || "fallback_secret";
    const decoded = jwt.verify(token, secret) as JwtPayload;

    const user = await User.findById(decoded.id).select("+password +lastLogin");
    if (!user) {
      res.status(401).json({ success: false, message: "User no longer exists." });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({ success: false, message: "Account is suspended." });
      return;
    }

    // Verify token hasn't been tampered with by checking role matches
    if (decoded.role !== user.role) {
      res.status(401).json({ success: false, message: "Token verification failed." });
      return;
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    user.failedLoginAttempts = 0;
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    const err = error as any;
    if (err.name === "JsonWebTokenError") {
      res.status(401).json({ success: false, message: "Invalid token." });
    } else if (err.name === "TokenExpiredError") {
      res.status(401).json({ success: false, message: "Token has expired." });
    } else {
      res.status(401).json({ success: false, message: "Authentication failed." });
    }
  }
};

export const optionalProtect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (token) {
      // Also check blacklist for optional protect
      const tokenHash = hashToken(token);
      const blacklisted = await TokenBlacklist.findOne({ tokenHash });
      if (!blacklisted) {
        const secret = process.env.JWT_SECRET || "fallback_secret";
        const decoded = jwt.verify(token, secret) as JwtPayload;
        const user = await User.findById(decoded.id);
        if (user && user.isActive) {
          req.user = user;
        }
      }
    }
  } catch {
    // Gracefully ignore error and proceed as anonymous
  }
  next();
};
