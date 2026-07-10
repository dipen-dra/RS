import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { User } from "../models/User.js";
import { Booking } from "../models/Booking.js";
import { AuditLog } from "../models/AuditLog.js";
import { protect, AuthRequest } from "../middleware/auth.js";
import { adminOnly, superAdminOnly } from "../middleware/admin.js";
import { upload } from "../middleware/upload.js";
import { validatePasswordStrength, isStrongPassword } from "../utils/passwordValidator.js";
import { logIdorAttempt, logAdminAction, logDataExport } from "../utils/securityLogger.js";
import { getBlockedIPs, blockIp, unblockIp } from "../middleware/security.js";

const router = Router();

/* ── GET /api/users/me ───────────────────────────────────── */
router.get("/me", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user!._id);
  if (!user) {
    res.status(404).json({ success: false, message: "User not found." });
    return;
  }
  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      license: user.license,
      city: user.city,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

/* ── PUT /api/users/me ───────────────────────────────────── */
router.put(
  "/me",
  protect,
  [
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("email").optional().isEmail().withMessage("Valid email required"),
    body("phone").optional(),
    body("license").optional(),
    body("city").optional(),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    // Prevent role escalation
    const { name, email, phone, license, city, avatar } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      license?: string;
      city?: string;
      avatar?: string;
    };

    // Never allow role change through this endpoint
    if ("role" in req.body) {
      res.status(403).json({
        success: false,
        message: "Role cannot be modified through this endpoint",
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { name, email, phone, license, city, avatar },
      { new: true, runValidators: true },
    );

    res.json({
      success: true,
      data: {
        _id: user!._id,
        name: user!.name,
        email: user!.email,
        phone: user!.phone,
        license: user!.license,
        city: user!.city,
        avatar: user!.avatar,
        role: user!.role,
      },
    });
  },
);

/* ── PATCH /api/users/profile/avatar ─────────────────────── */
router.patch(
  "/profile/avatar",
  protect,
  upload.single("image"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No image uploaded" });
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { avatar: req.file.path }, // Cloudinary returns the URL in req.file.path
      { new: true },
    );

    res.json({ success: true, data: user });
  },
);

/* ── PUT /api/users/me/password ─────────────────────────── */
router.put(
  "/me/password",
  protect,
  [
    body("currentPassword").notEmpty(),
    body("newPassword")
      .isLength({ min: 10 })
      .withMessage("New password must be at least 10 characters")
      .custom((value) => isStrongPassword(value))
      .withMessage("Password must contain uppercase, lowercase, numbers, and special characters"),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        message: "New password does not meet security requirements",
        feedback: passwordValidation.feedback,
      });
      return;
    }

    const user = await User.findById(req.user!._id).select("+password");
    if (!user || !(await user.comparePassword(currentPassword))) {
      res.status(401).json({ success: false, message: "Current password is incorrect." });
      return;
    }

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Password updated successfully." });
  },
);

/* ── GET /api/users/admin/all (admin) ────────────────────── */
router.get(
  "/admin/all",
  protect,
  adminOnly,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const users = await User.find().sort({ createdAt: -1 }).lean();

    // Attach booking count to each user
    const usersWithBookings = await Promise.all(
      users.map(async (u) => {
        const bookingsCount = await Booking.countDocuments({ user: u._id });
        return { ...u, bookingsCount };
      }),
    );

    res.json({ success: true, data: usersWithBookings });
  },
);

/* ── PATCH /api/users/admin/:id/status (admin) ───────────── */
router.patch(
  "/admin/:id/status",
  protect,
  adminOnly,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { isActive } = req.body as { isActive: boolean };
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    // Log admin action
    logAdminAction(
      req.user!._id.toString(),
      "update_user_status",
      req.params.id as string,
      { newStatus: isActive ? "active" : "suspended" },
      req.ip,
      req.headers["user-agent"],
    );

    res.json({ success: true, data: user });
  },
);

/* ── PATCH /api/users/admin/:id/role (admin) ────────────── */
router.patch(
  "/admin/:id/role",
  protect,
  adminOnly,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { role } = req.body as { role: "user" | "admin" };
    if (!["user", "admin"].includes(role)) {
      res.status(400).json({ success: false, message: "Invalid role." });
      return;
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    // Log admin action
    logAdminAction(
      req.user!._id.toString(),
      "update_user_role",
      req.params.id as string,
      { newRole: role },
      req.ip,
      req.headers["user-agent"],
    );

    res.json({ success: true, data: user });
  },
);

/* ── DELETE /api/users/admin/:id (admin) ────────────────── */
router.delete(
  "/admin/:id",
  protect,
  adminOnly,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    // Log admin action
    logAdminAction(
      req.user!._id.toString(),
      "delete_user",
      req.params.id as string,
      { userEmail: user.email, userName: user.name },
      req.ip,
      req.headers["user-agent"],
    );

    res.json({ success: true, message: "User deleted." });
  },
);

/* ── GET /api/users/me/export ────────────────────────── */
// GDPR-aligned: returns own profile + booking history, no sensitive fields
router.get("/me/export", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!._id;

  const user = await User.findById(userId).lean();
  const bookings = await Booking.find({ user: userId })
    .populate("vehicle", "name type pricePerDay")
    .lean();

  logDataExport(userId.toString(), req.ip, req.headers["user-agent"]);

  // Strip sensitive fields
  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: {
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      city: user?.city,
      role: user?.role,
      authProvider: user?.authProvider,
      createdAt: user?.createdAt,
      mfaEnabled: user?.mfaEnabled,
    },
    bookings: bookings.map((b) => ({
      id: b._id,
      vehicle: b.vehicle,
      status: b.status,
      startDate: b.startDate,
      endDate: b.endDate,
      total: b.total,
      payment: b.payment,
      createdAt: b.createdAt,
    })),
  };

  res.setHeader("Content-Disposition", "attachment; filename=my-rentalsphere-data.json");
  res.setHeader("Content-Type", "application/json");
  res.json(exportData);
});

/* ── GET /api/users/admin/audit-logs (superadmin only) ────── */
router.get(
  "/admin/audit-logs",
  protect,
  superAdminOnly,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const { eventType, severity, userId: filterUserId } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};
    if (eventType) filter.eventType = eventType;
    if (severity) filter.severity = severity;
    if (filterUserId) filter.userId = filterUserId;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  },
);

/* ── GET /api/users/admin/blocked-ips (superadmin) ──────── */
router.get(
  "/admin/blocked-ips",
  protect,
  superAdminOnly,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    res.json({ success: true, data: getBlockedIPs() });
  },
);

/* ── POST /api/users/admin/blocked-ips (superadmin) ─────── */
router.post(
  "/admin/blocked-ips",
  protect,
  superAdminOnly,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { ip, reason } = req.body as { ip: string; reason?: string };
    if (!ip) {
      res.status(400).json({ success: false, message: "IP address is required." });
      return;
    }
    blockIp(ip, reason || "Manual admin block");
    logAdminAction(req.user!._id.toString(), "block_ip", ip, { reason }, req.ip);
    res.json({ success: true, message: `IP ${ip} has been blocked.` });
  },
);

/* ── DELETE /api/users/admin/blocked-ips/:ip (superadmin) ── */
router.delete(
  "/admin/blocked-ips/:ip",
  protect,
  superAdminOnly,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const ip = decodeURIComponent(req.params.ip as string);
    const removed = unblockIp(ip);
    if (!removed) {
      res.status(404).json({ success: false, message: "IP not found in block list." });
      return;
    }
    logAdminAction(req.user!._id.toString(), "unblock_ip", ip, {}, String(req.ip));
    res.json({ success: true, message: `IP ${ip} has been unblocked.` });
  },
);

/* ── PATCH /api/users/admin/:id/role (superadmin only) ────── */
// Promotes or demotes a user's role — superadmin exclusive
router.patch(
  "/admin/:id/role",
  protect,
  superAdminOnly,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { role } = req.body as { role: string };
    const validRoles = ["user", "admin", "superadmin"];
    if (!validRoles.includes(role)) {
      res.status(400).json({ success: false, message: "Invalid role. Must be user, admin, or superadmin." });
      return;
    }
    // Prevent self-demotion
    if (req.params.id === req.user!._id.toString()) {
      res.status(400).json({ success: false, message: "You cannot change your own role." });
      return;
    }
    const target = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true },
    ).select("-password");
    if (!target) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }
    logAdminAction(
      req.user!._id.toString(),
      "role_change",
      req.params.id as string,
      { newRole: role, previousRole: target.role },
      req.ip ?? "",
    );
    res.json({ success: true, data: target, message: `Role updated to ${role}.` });
  },
);

export default router;
