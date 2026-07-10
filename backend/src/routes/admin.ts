import { Router, Response } from "express";
import { Booking } from "../models/Booking.js";
import { Vehicle } from "../models/Vehicle.js";
import { User } from "../models/User.js";
import { protect, AuthRequest } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";

const router = Router();

/* ── GET /api/admin/stats ───────────────────────────────── */
router.get(
  "/stats",
  protect,
  adminOnly,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const [totalBookings, activeBookings, totalVehicles, totalUsers, revenueResult] =
      await Promise.all([
        Booking.countDocuments(),
        Booking.countDocuments({ status: "active" }),
        Vehicle.countDocuments({ isAvailable: true }),
        User.countDocuments({ role: "user" }),
        Booking.aggregate([
          { $match: { status: { $ne: "cancelled" } } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
      ]);

    const revenue = revenueResult[0]?.total || 0;

    // Last 7 days bookings grouped by day
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const dailyRevenue = await Booking.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          revenue: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        revenue,
        activeBookings,
        totalBookings,
        totalVehicles,
        totalUsers,
        dailyRevenue,
      },
    });
  },
);

export default router;
