import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { body, validationResult } from "express-validator";
import { OAuth2Client } from "google-auth-library";
// @ts-ignore
import svgCaptcha from "svg-captcha";
import { User } from "../models/User.js";
import { protect, AuthRequest } from "../middleware/auth.js";
import { sendEmail } from "../utils/email.js";
import { validatePasswordStrength, isStrongPassword } from "../utils/passwordValidator.js";
import { logPasswordChange, logAuthFailure, logAccountLocked, logSessionInvalidated } from "../utils/securityLogger.js";
import { TokenBlacklist, hashToken } from "../models/TokenBlacklist.js";
import { recordIpAuthFailure } from "../middleware/security.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = Router();

const signToken = (id: string, role: string): string => {
  const secret = process.env.JWT_SECRET || "fallback_secret";
  return jwt.sign({ id, role }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  } as jwt.SignOptions);
};

const sendTokenCookie = (res: Response, token: string): void => {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/* ── GET /api/auth/captcha ───────────────────────────────── */
router.get("/captcha", (req: Request, res: Response) => {
  const captcha = svgCaptcha.create({
    size: 5,
    noise: 2,
    color: true,
    background: "#f8fafc"
  });

  const secret = process.env.JWT_SECRET || "fallback_secret";
  const token = jwt.sign(
    { text: captcha.text.toLowerCase() },
    secret,
    { expiresIn: "5m" }
  );

  res.json({
    success: true,
    captchaSvg: captcha.data,
    captchaToken: token
  });
});

/* ── POST /api/auth/register ─────────────────────────────── */
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password")
      .isLength({ min: 10 })
      .withMessage("Password must be at least 10 characters")
      .custom((value) => isStrongPassword(value))
      .withMessage("Password must contain uppercase, lowercase, numbers, and special characters"),
    body("captchaAnswer").trim().notEmpty().withMessage("CAPTCHA answer is required"),
    body("captchaToken").trim().notEmpty().withMessage("CAPTCHA token is required")
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { name, email, password, captchaAnswer, captchaToken } = req.body as {
      name: string;
      email: string;
      password: string;
      captchaAnswer: string;
      captchaToken: string;
    };

    // Verify stateless CAPTCHA
    try {
      const secret = process.env.JWT_SECRET || "fallback_secret";
      const decoded = jwt.verify(captchaToken, secret) as { text: string };
      if (captchaAnswer.toLowerCase() !== decoded.text) {
        res.status(400).json({ success: false, message: "Incorrect CAPTCHA. Please try again." });
        return;
      }
    } catch (err) {
      res.status(400).json({ success: false, message: "CAPTCHA expired or invalid. Please refresh CAPTCHA." });
      return;
    }

    // Validate password strength with detailed feedback
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        message: "Password does not meet security requirements",
        feedback: passwordValidation.feedback,
      });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ success: false, message: "Email already in use." });
      return;
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      success: true,
      message: "Registration successful. Please log in.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        city: user.city,
        avatar: user.avatar,
      },
    });
  },
);

/* ── POST /api/auth/login ────────────────────────────────── */
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email, password } = req.body as { email: string; password: string };

    const user = await User.findOne({ email }).select(
      "+password +failedLoginAttempts +lastFailedLogin",
    );

    // Check for brute force attempts — account lockout
    if (user && user.failedLoginAttempts >= 5) {
      const lastFailed = user.lastFailedLogin ? new Date(user.lastFailedLogin).getTime() : 0;
      const timeSinceLastFailed = Date.now() - lastFailed;
      const lockoutDuration = 15 * 60 * 1000; // 15 minutes

      if (timeSinceLastFailed < lockoutDuration) {
        logAccountLocked(email, req.ip, req.headers["user-agent"]);
        const remainingMs = lockoutDuration - timeSinceLastFailed;
        const remainingMins = Math.ceil(remainingMs / 60000);
        res.status(429).json({
          success: false,
          message: `Account temporarily locked due to multiple failed attempts. Try again in ${remainingMins} minute(s).`,
          lockedUntil: new Date(lastFailed + lockoutDuration).toISOString(),
        });
        return;
      }
    }

    if (!user || !(await user.comparePassword(password))) {
      // Increment failed login attempts + IP failure tracking
      if (user) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        user.lastFailedLogin = new Date();
        await user.save();
      }
      recordIpAuthFailure(req.ip || "unknown");
      logAuthFailure(email, "Invalid credentials", req.ip, req.headers["user-agent"]);
      res.status(401).json({ success: false, message: "Invalid email or password." });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: "Account is suspended." });
      return;
    }

    // If MFA is enabled — return pending state, don't issue token yet
    if (user.mfaEnabled) {
      // Reset failed attempts on password success
      user.failedLoginAttempts = 0;
      await user.save();
      res.json({
        success: true,
        mfaPending: true,
        userId: user._id.toString(),
        message: "Enter your authenticator code to complete login.",
      });
      return;
    }

    // Reset failed login attempts on successful login
    user.failedLoginAttempts = 0;
    await user.save();

    const token = signToken(user._id.toString(), user.role);
    sendTokenCookie(res, token);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        city: user.city,
        avatar: user.avatar,
        license: user.license,
        mfaEnabled: user.mfaEnabled,
      },
    });
  },
);

/* ── POST /api/auth/google ───────────────────────────────── */
router.post("/google", async (req: Request, res: Response): Promise<void> => {
  const { credential } = req.body;
  if (!credential) {
    res.status(400).json({ success: false, message: "Google credential required" });
    return;
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ success: false, message: "Invalid Google token" });
      return;
    }

    let user = await User.findOne({ email: payload.email });
    if (!user) {
      // Create new user with random password (Google users don't need it)
      const randomPassword = crypto.randomBytes(16).toString("hex");
      user = await User.create({
        name: payload.name || "Google User",
        email: payload.email,
        password: randomPassword,
        avatar: payload.picture || "",
        authProvider: "google",
        role: "user",
        isActive: true,
      });
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: "Account is suspended." });
      return;
    }

    const token = signToken(user._id.toString(), user.role);
    sendTokenCookie(res, token);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        city: user.city,
        avatar: user.avatar,
        license: user.license,
      },
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(401).json({ success: false, message: "Google authentication failed" });
  }
});

/* ── POST /api/auth/logout ───────────────────────────────── */
router.post("/logout", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (token) {
      // Decode to get expiry without verifying (already verified by protect)
      const decoded = jwt.decode(token) as { exp?: number };
      const expiresAt = decoded?.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Blacklist the token
      await TokenBlacklist.create({
        tokenHash: hashToken(token),
        userId: req.user!._id.toString(),
        expiresAt,
      });

      logSessionInvalidated(req.user!._id.toString(), req.ip, req.headers["user-agent"]);
    }
  } catch (err) {
    console.error("Logout blacklist error:", err);
  }

  res.clearCookie("token");
  res.json({ success: true, message: "Logged out successfully." });
});

/* ── GET /api/auth/me ────────────────────────────────────── */
router.get("/me", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  res.json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      city: user.city,
      avatar: user.avatar,
      license: user.license,
      createdAt: user.createdAt,
    },
  });
});

/* ── POST /api/auth/forgot-password ─────────────────────── */
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Valid email required")],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email } = req.body as { email: string };
    const user = await User.findOne({ email }).select("+resetPasswordToken +resetPasswordExpires");

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({
        success: true,
        message: "If that email exists, a reset link has been sent.",
      });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = crypto.createHash("sha256").update(otp).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save({ validateBeforeSave: false });

    // Send email with OTP
    try {
      await sendEmail({
        to: user.email,
        subject: "Your Password Reset OTP — RentalSphere",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset</h2>
            <p>You requested a password reset for your RentalSphere account.</p>
            <p>Here is your 6-digit verification code:</p>
            <h1 style="background: #f4f4f5; padding: 12px; text-align: center; letter-spacing: 5px; border-radius: 8px;">
              ${otp}
            </h1>
            <p style="color: #666; font-size: 14px;">This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("Email send error:", err);
    }

    res.json({
      success: true,
      message: "If that email exists, a reset link has been sent.",
    });
  },
);

/* ── POST /api/auth/verify-otp ──────────────────────────── */
router.post(
  "/verify-otp",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("otp").isLength({ min: 6, max: 6 }).withMessage("Valid 6-digit OTP required"),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const { email, otp } = req.body as { email: string; otp: string };
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordToken: hashedOtp,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ success: false, message: "Invalid or expired OTP." });
      return;
    }

    res.json({ success: true, message: "OTP verified successfully." });
  },
);

/* ── POST /api/auth/reset-password ──────────────────────── */
router.post(
  "/reset-password",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("otp").isLength({ min: 6, max: 6 }).withMessage("Valid OTP required"),
    body("password")
      .isLength({ min: 10 })
      .withMessage("Password must be at least 10 characters")
      .custom((value) => isStrongPassword(value))
      .withMessage("Password must contain uppercase, lowercase, numbers, and special characters"),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email, otp, password } = req.body as { email: string; otp: string; password: string };

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        message: "Password does not meet security requirements",
        feedback: passwordValidation.feedback,
      });
      return;
    }

    // Check if password was previously used
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordToken: hashedOtp,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires +passwordHistory");

    if (!user) {
      res.status(400).json({ success: false, message: "Invalid or expired OTP." });
      return;
    }

    // Check if new password was previously used
    const passwordWasPreviouslyUsed = await user.checkPasswordHistory(password);
    if (passwordWasPreviouslyUsed) {
      res.status(400).json({
        success: false,
        message: "Password was previously used. Please choose a different password.",
      });
      return;
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logPasswordChange(user._id.toString(), req.ip);

    const jwtToken = signToken(user._id.toString(), user.role);
    sendTokenCookie(res, jwtToken);

    res.json({ success: true, message: "Password reset successfully.", token: jwtToken });
  },
);

export default router;
