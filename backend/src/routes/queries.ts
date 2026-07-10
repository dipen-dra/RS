import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { Query } from "../models/Query.js";
import { Notification } from "../models/Notification.js";
import { protect, optionalProtect, AuthRequest } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import { sendEmail } from "../utils/email.js";

const router = Router();

/* ── POST /api/queries (Submit a new contact query) ──────── */
router.post(
  "/",
  optionalProtect,
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("subject").trim().notEmpty().withMessage("Subject is required"),
    body("message").trim().notEmpty().withMessage("Message is required"),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { name, email, subject, message } = req.body as {
      name: string;
      email: string;
      subject: string;
      message: string;
    };

    const query = await Query.create({
      user: req.user?._id,
      name,
      email,
      subject,
      message,
    });

    res.status(201).json({ success: true, data: query });
  },
);

/* ── GET /api/queries/me (Get logged-in user's queries) ─── */
router.get("/me", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  const queries = await Query.find({ user: req.user!._id }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: queries });
});

/* ── GET /api/queries/admin/all (Get all queries for admin) ─ */
router.get(
  "/admin/all",
  protect,
  adminOnly,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const queries = await Query.find()
      .populate("user", "name email avatar")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: queries });
  },
);

/* ── POST /api/queries/admin/:id/reply (Reply to query) ──── */
router.post(
  "/admin/:id/reply",
  protect,
  adminOnly,
  [body("reply").trim().notEmpty().withMessage("Reply content is required")],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { reply } = req.body as { reply: string };

    const query = await Query.findById(req.params.id);
    if (!query) {
      res.status(404).json({ success: false, message: "Query not found." });
      return;
    }

    query.reply = reply;
    query.isReplied = true;
    query.repliedAt = new Date();
    await query.save();

    // If query has associated registered user, create an in-app notification
    if (query.user) {
      Notification.create({
        user: query.user,
        type: "message",
        title: `Reply to: ${query.subject}`,
        body: `Support team replied: "${reply.slice(0, 80)}${reply.length > 80 ? "..." : ""}"`,
        href: "/dashboard/queries",
      }).catch((err) => console.error("Error creating query reply notification:", err));
    }

    // Send email notification to user via SMTP / sendEmail util
    sendEmail({
      to: query.email,
      subject: `Reply to your query: ${query.subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff;">
          <h2 style="color: #3b82f6; font-size: 20px; font-weight: 700; margin-top: 0;">RentalSphere Support Reply</h2>
          <p>Hi <strong>${query.name}</strong>,</p>
          <p>Thank you for reaching out to us. We have reviewed your query and here is our reply:</p>
          
          <div style="background-color: #f8fafc; padding: 16px; border-left: 4px solid #cbd5e1; border-radius: 12px; margin: 16px 0;">
            <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;"><strong>Your original message:</strong></p>
            <p style="margin: 6px 0 0 0; font-style: italic; color: #334155;">"${query.message}"</p>
          </div>
          
          <div style="background-color: #eff6ff; padding: 16px; border-left: 4px solid #3b82f6; border-radius: 12px; margin: 16px 0;">
            <p style="margin: 0; font-size: 12px; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.05em;"><strong>Admin's reply:</strong></p>
            <p style="margin: 6px 0 0 0; font-weight: 500; color: #1e3a8a; font-size: 15px;">"${reply}"</p>
          </div>
          
          <p style="margin-bottom: 0;">If you have any further questions, feel free to reply directly to this email or submit a new inquiry on our contact page.</p>
          <p style="margin-top: 32px; font-size: 13px; color: #94a3b8; line-height: 1.5;">Best regards,<br><strong>The RentalSphere Team</strong></p>
        </div>
      `,
    }).catch((err) => console.error("Error sending query reply email:", err));

    res.json({ success: true, data: query });
  },
);

export default router;
