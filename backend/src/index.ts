import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import { setupSecurityMiddleware, requestValidationMiddleware } from "./middleware/security.js";
import { sanitizeInputs, validateInputTypes } from "./middleware/inputSanitization.js";
import authRoutes from "./routes/auth.js";
import vehicleRoutes from "./routes/vehicles.js";
import bookingRoutes from "./routes/bookings.js";
import userRoutes from "./routes/users.js";
import adminRoutes from "./routes/admin.js";
import notificationRoutes from "./routes/notifications.js";
import paymentRoutes from "./routes/payment.js";
import queriesRoutes from "./routes/queries.js";
import mfaRoutes from "./routes/mfa.js";

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
const clientOrigin = CLIENT_URL.replace(/\/$/, "");

// ── Security Setup ─────────────────────────────────────────
setupSecurityMiddleware(app);

// ── Middleware ─────────────────────────────────────────────
const allowedOrigins = process.env.NODE_ENV === "production"
  ? [clientOrigin]
  : [
      clientOrigin,
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      "http://192.168.1.102:5173",  // LAN IP — allows Burp Suite interception
      "http://192.168.1.102:5174",
    ];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Input sanitization and validation
app.use(sanitizeInputs);
app.use(validateInputTypes);
app.use(requestValidationMiddleware);

// Rate limiting - ENABLED for security
const generalLimiter = rateLimit({
  windowMs: 5 * 1000, // 5 seconds (temporary for testing)
  max: 500,
  message: { success: false, message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", generalLimiter);

const authLimiter = rateLimit({
  windowMs: 5 * 1000, // 5 seconds (temporary for testing)
  max: 100, // Stricter limit for auth endpoints, but generous for testing
  message: { success: false, message: "Too many auth attempts, please try again later." },
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth/", authLimiter);

// ── Routes ─────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/queries", queriesRoutes);
app.use("/api/mfa", mfaRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "RentalSphere API is running 🚗", timestamp: new Date() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Catch size errors
  if (err.name === "MulterError" || err.code === "LIMIT_FILE_SIZE") {
    const message = err.code === "LIMIT_FILE_SIZE" 
      ? "File is too large. Maximum allowed size is 5MB." 
      : `Upload error: ${err.message}`;
    res.status(400).json({ success: false, message });
    return;
  }
  // Catch format/extension errors from Cloudinary/Multer
  if (err.message && (err.message.toLowerCase().includes("format") || err.message.toLowerCase().includes("allowed"))) {
    res.status(400).json({ 
      success: false, 
      message: "Invalid file format. Only JPEG, JPG, PNG, and WEBP are allowed." 
    });
    return;
  }
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error." });
});

// ── Start ──────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 RentalSphere API running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  });
});
