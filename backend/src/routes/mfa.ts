import { Router, Response } from "express";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import { protect, AuthRequest } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { logMfaEvent } from "../utils/securityLogger.js";

const router = Router();

/* ── POST /api/mfa/setup ─────────────────────────────────────
   Generates a TOTP secret and QR code for the user to scan.
   Does NOT enable MFA yet — user must confirm with /mfa/confirm.
───────────────────────────────────────────────────────────── */
router.post("/setup", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!._id.toString();

  // Generate a new TOTP secret
  const secret = speakeasy.generateSecret({
    name: `RentalSphere (${req.user!.email})`,
    issuer: "RentalSphere",
    length: 20,
  });

  // Store the pending secret (not yet confirmed)
  await User.findByIdAndUpdate(userId, { mfaPendingSecret: secret.base32 });

  // Generate QR code as data URL
  const otpAuthUrl = secret.otpauth_url!;
  const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

  res.json({
    success: true,
    data: {
      secret: secret.base32, // Show once for manual entry
      qrCode: qrCodeDataUrl,
      otpAuthUrl,
    },
  });
});

/* ── POST /api/mfa/confirm ───────────────────────────────────
   Confirms MFA setup by verifying the user's first TOTP token.
   Enables MFA and returns backup codes.
───────────────────────────────────────────────────────────── */
router.post("/confirm", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  const { token } = req.body as { token: string };
  if (!token) {
    res.status(400).json({ success: false, message: "TOTP token is required." });
    return;
  }

  const user = await User.findById(req.user!._id).select("+mfaPendingSecret +mfaBackupCodes");
  if (!user || !user.mfaPendingSecret) {
    res.status(400).json({ success: false, message: "No pending MFA setup found. Run /mfa/setup first." });
    return;
  }

  // Verify the token against the pending secret
  const isValid = speakeasy.totp.verify({
    secret: user.mfaPendingSecret,
    encoding: "base32",
    token,
    window: 1, // Allow 30s clock drift
  });

  if (!isValid) {
    logMfaEvent("MFA_FAILED", user._id.toString(), req.ip, req.headers["user-agent"]);
    res.status(400).json({ success: false, message: "Invalid TOTP token. Please try again." });
    return;
  }

  // Generate 8 one-time backup codes
  const backupCodes = Array.from({ length: 8 }, () =>
    Math.random().toString(36).substring(2, 10).toUpperCase(),
  );
  const hashedBackupCodes = await Promise.all(backupCodes.map((c) => bcrypt.hash(c, 10)));

  // Enable MFA
  user.mfaEnabled = true;
  user.mfaSecret = user.mfaPendingSecret;
  user.mfaPendingSecret = undefined;
  user.mfaBackupCodes = hashedBackupCodes;
  await user.save();

  logMfaEvent("MFA_ENABLED", user._id.toString(), req.ip, req.headers["user-agent"]);

  res.json({
    success: true,
    message: "MFA enabled successfully.",
    backupCodes, // Show plaintext ONCE — never stored
  });
});

/* ── POST /api/mfa/validate ──────────────────────────────────
   Called during login when mfaPending is true.
   Validates TOTP token (or backup code) and issues the final JWT.
───────────────────────────────────────────────────────────── */
router.post("/validate", async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId, token } = req.body as { userId: string; token: string };

  if (!userId || !token) {
    res.status(400).json({ success: false, message: "userId and token are required." });
    return;
  }

  const user = await User.findById(userId).select("+mfaSecret +mfaBackupCodes +password");
  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    res.status(400).json({ success: false, message: "MFA not enabled for this account." });
    return;
  }

  // Try TOTP verification first
  const isValidTotp = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: "base32",
    token,
    window: 1,
  });

  if (isValidTotp) {
    logMfaEvent("MFA_SUCCESS", user._id.toString(), req.ip, req.headers["user-agent"]);
    const jwt = await import("jsonwebtoken");
    const secret = process.env.JWT_SECRET || "fallback_secret";
    const jwtToken = jwt.default.sign({ id: user._id.toString(), role: user.role }, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    } as import("jsonwebtoken").SignOptions);

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token: jwtToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
    });
    return;
  }

  // Try backup code
  if (user.mfaBackupCodes && user.mfaBackupCodes.length > 0) {
    let usedIndex = -1;
    for (let i = 0; i < user.mfaBackupCodes.length; i++) {
      const match = await bcrypt.compare(token, user.mfaBackupCodes[i]);
      if (match) {
        usedIndex = i;
        break;
      }
    }
    if (usedIndex !== -1) {
      // Remove used backup code
      user.mfaBackupCodes.splice(usedIndex, 1);
      await user.save();

      logMfaEvent("MFA_SUCCESS", user._id.toString(), req.ip, req.headers["user-agent"]);

      const jwt = await import("jsonwebtoken");
      const secret = process.env.JWT_SECRET || "fallback_secret";
      const jwtToken = jwt.default.sign({ id: user._id.toString(), role: user.role }, secret, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      } as import("jsonwebtoken").SignOptions);

      const isProduction = process.env.NODE_ENV === "production";
      res.cookie("token", jwtToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        token: jwtToken,
        usedBackupCode: true,
        backupCodesRemaining: user.mfaBackupCodes.length,
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      });
      return;
    }
  }

  logMfaEvent("MFA_FAILED", user._id.toString(), req.ip, req.headers["user-agent"]);
  res.status(401).json({ success: false, message: "Invalid TOTP token or backup code." });
});

/* ── POST /api/mfa/disable ───────────────────────────────────
   Disables MFA — requires current password confirmation.
───────────────────────────────────────────────────────────── */
router.post("/disable", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  const { password } = req.body as { password: string };
  if (!password) {
    res.status(400).json({ success: false, message: "Password is required to disable MFA." });
    return;
  }

  const user = await User.findById(req.user!._id).select("+password +mfaSecret +mfaBackupCodes");
  if (!user) {
    res.status(404).json({ success: false, message: "User not found." });
    return;
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    res.status(401).json({ success: false, message: "Incorrect password." });
    return;
  }

  user.mfaEnabled = false;
  user.mfaSecret = undefined;
  user.mfaBackupCodes = [];
  user.mfaPendingSecret = undefined;
  await user.save();

  logMfaEvent("MFA_DISABLED", user._id.toString(), req.ip, req.headers["user-agent"]);

  res.json({ success: true, message: "MFA has been disabled." });
});

/* ── GET /api/mfa/status ─────────────────────────────────────
   Returns current MFA status for the logged-in user.
───────────────────────────────────────────────────────────── */
router.get("/status", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user!._id).select("+mfaBackupCodes");
  res.json({
    success: true,
    data: {
      mfaEnabled: user?.mfaEnabled ?? false,
      backupCodesRemaining: user?.mfaBackupCodes?.length ?? 0,
    },
  });
});

export default router;
