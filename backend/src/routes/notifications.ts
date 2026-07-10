import { Router, Response } from "express";
import { Notification } from "../models/Notification.js";
import { protect, AuthRequest } from "../middleware/auth.js";

const router = Router();

/* ── GET /api/notifications ────────────────────────────── */
router.get("/", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  const notifications = await Notification.find({ user: req.user!._id })
    .sort({ createdAt: -1 })
    .limit(50) // only fetch recent ones
    .lean();
  res.json({ success: true, data: notifications });
});

/* ── PATCH /api/notifications/read-all ─────────────────── */
router.patch("/read-all", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  await Notification.updateMany({ user: req.user!._id, read: false }, { read: true });
  res.json({ success: true, message: "All notifications marked as read." });
});

/* ── PATCH /api/notifications/:id/read ─────────────────── */
router.patch("/:id/read", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user!._id },
    { read: true },
    { new: true },
  );

  if (!notification) {
    res.status(404).json({ success: false, message: "Notification not found." });
    return;
  }

  res.json({ success: true, data: notification });
});

export default router;
