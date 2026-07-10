import { Router, Response } from "express";
import crypto from "crypto";
import { protect, AuthRequest } from "../middleware/auth.js";
import { Booking } from "../models/Booking.js";
import { Vehicle } from "../models/Vehicle.js";
import { Notification } from "../models/Notification.js";
import {
  generateBookingId,
  storePendingBooking,
  getPendingBooking,
  deletePendingBooking,
} from "../utils/pendingBookings.js";
import { sendEmail } from "../utils/email.js";
import { calculateBookingTotal, verifyBookingAmount } from "../utils/bookingCalculator.js";
import { validatePaymentAmount, logPaymentValidationAttempt } from "../utils/paymentValidator.js";
import { logPaymentTampering } from "../utils/securityLogger.js";

const router = Router();

const KHALTI_SECRET_KEY =
  process.env.KHALTI_SECRET_KEY || "test_secret_key_3f78fb6364ef4bd1b5fc670ce33a06f5";
const ESEWA_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
const ESEWA_SCD = "EPAYTEST";
const ESEWA_SECRET = process.env.ESEWA_SECRET || "8gBm/:&EnhH.1/q";

// Helper to calculate total for verification
export const calculateBookingTotalLegacy = async (
  vehicleSlug: string,
  startDate: string,
  endDate: string,
  couponCode?: string,
  dropoff?: string,
  pickup?: string,
  insurance?: string,
  addons?: string[],
) => {
  const vehicle = await Vehicle.findOne({ slug: vehicleSlug });
  if (!vehicle) throw new Error("Vehicle not found");

  const insurancePrices: Record<string, number> = {
    basic: 0,
    plus: 5,
    max: 10,
  };

  const addonPrices: Record<string, number> = {
    driver: 20,
    gps: 2,
    child: 3,
    helmet: 1.5,
  };

  const insurancePrice = insurancePrices[insurance || "basic"] ?? 0;
  const addonsPrice = (addons || []).reduce((sum, id) => sum + (addonPrices[id] ?? 0), 0);

  const msPerDay = 86400000;
  const days = Math.max(1, Math.ceil((+new Date(endDate) - +new Date(startDate)) / msPerDay));

  const subtotal = vehicle.pricePerDay * days + (insurancePrice + addonsPrice) * days;
  const serviceFee = Math.round(subtotal * 0.05);
  const dropOffFee = dropoff && pickup && dropoff !== pickup ? 10 : 0;
  const vat = Math.round((subtotal + dropOffFee) * 0.2);
  const discount = couponCode === "DRIVE10" ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + serviceFee + vat + dropOffFee - discount;

  return { total, vehicle, days, subtotal, serviceFee, vat, dropOffFee, discount };
};

// @desc    Verify Khalti payment
// @route   POST /api/payment/khalti/verify
router.post("/khalti/verify", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token, amount, bookingData } = req.body;

    if (!token || !amount || !bookingData) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    const verificationUrl = "https://khalti.com/api/v2/payment/verify/";

    // Using global fetch (Node 18+)
    const response = await globalThis.fetch(verificationUrl, {
      method: "POST",
      headers: {
        Authorization: `Key ${KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, amount }),
    });

    const verificationData = await response.json();

    if (verificationData.idx) {
      // Re-calculate to verify amount matches (CRITICAL SECURITY CHECK)
      const { total, vehicle, days, subtotal, serviceFee, vat, dropOffFee, discount } =
        await calculateBookingTotalLegacy(
          bookingData.vehicleSlug,
          bookingData.startDate,
          bookingData.endDate,
          bookingData.couponCode,
          bookingData.dropoff,
          bookingData.pickup,
          bookingData.insurance,
          bookingData.addons,
        );

      // SECURITY: Verify that the amount paid matches the calculated total
      const paymentValidation = validatePaymentAmount(amount, total, 1); // 1 rupee tolerance

      if (!paymentValidation.valid) {
        logPaymentTampering(
          req.user!._id.toString(),
          amount,
          total,
          req.ip,
          req.headers["user-agent"],
        );
        console.warn(`[SECURITY] Amount tampering detected! Paid: ${amount}, Calculated: ${total}`);
        res.status(400).json({
          success: false,
          message: "Payment amount does not match booking total. Please try again.",
        });
        return;
      }

      logPaymentValidationAttempt(
        req.user!._id.toString(),
        req.ip || "unknown",
        true,
        amount,
        total,
        { method: "khalti", bookingSlug: bookingData.vehicleSlug },
      );

      // Create Booking
      const booking = await Booking.create({
        user: req.user!._id,
        vehicle: vehicle._id,
        vehicleName: vehicle.name,
        vehicleImage: vehicle.image,
        vehicleSlug: vehicle.slug,
        pickup: bookingData.pickup,
        dropoff: bookingData.dropoff || bookingData.pickup,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        days,
        subtotal,
        serviceFee,
        vat,
        discount,
        total,
        insurance: bookingData.insurance,
        addons: bookingData.addons,
        status: "upcoming",
        payment: "Khalti",
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        license: bookingData.license,
        couponCode: bookingData.couponCode,
        calculatedTotal: total,
        serverValidated: true,
      });

      Notification.create({
        user: req.user!._id,
        type: "booking",
        title: "Booking Confirmed!",
        body: `Your booking for ${vehicle.name} has been paid via Khalti.`,
        href: "/dashboard",
      }).catch(console.error);

      // Send confirmation email
      sendEmail({
        to: bookingData.customerEmail,
        subject: `Booking Confirmed: ${vehicle.name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Booking Confirmed!</h2>
            <p>Hi ${bookingData.customerName},</p>
            <p>Your booking for the <strong>${vehicle.name}</strong> has been successfully confirmed and paid.</p>
            <p><strong>Pickup:</strong> ${new Date(bookingData.startDate).toLocaleDateString()} at ${bookingData.pickup}</p>
            <p><strong>Total Paid:</strong> £${total.toLocaleString()}</p>
            <p>Thank you for choosing RentalSphere!</p>
          </div>
        `,
      }).catch(console.error);

      res.status(200).json({ success: true, data: booking });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Khalti verification failed", error: verificationData });
    }
  } catch (error) {
    console.error("Khalti verification error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @desc    Initiate eSewa payment
// @route   POST /api/payment/esewa/initiate
router.post("/esewa/initiate", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingData } = req.body;
    if (!bookingData) {
      res.status(400).json({ success: false, message: "Booking data is required" });
      return;
    }

    const { total } = await calculateBookingTotalLegacy(
      bookingData.vehicleSlug,
      bookingData.startDate,
      bookingData.endDate,
      bookingData.couponCode,
      bookingData.dropoff,
      bookingData.pickup,
      bookingData.insurance,
      bookingData.addons,
    );

    const bookingId = generateBookingId();

    storePendingBooking(bookingId, {
      ...bookingData,
      userId: req.user!._id.toString(),
      totalAmount: total,
    });

    const amountToPay = total.toString();
    const signedFieldNames = "total_amount,transaction_uuid,product_code";
    const signatureBaseString = `total_amount=${amountToPay},transaction_uuid=${bookingId},product_code=${ESEWA_SCD}`;

    const hmac = crypto.createHmac("sha256", ESEWA_SECRET);
    hmac.update(signatureBaseString);
    const signature = hmac.digest("base64");

    res.json({
      success: true,
      data: {
        ESEWA_URL,
        amount: amountToPay,
        success_url: `${(process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "")}/payment/esewa/success`,
        failure_url: `${(process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "")}/payment/esewa/failure`,
        product_delivery_charge: "0",
        product_service_charge: "0",
        product_code: ESEWA_SCD,
        signature,
        signed_field_names: signedFieldNames,
        tax_amount: "0",
        total_amount: amountToPay,
        transaction_uuid: bookingId,
      },
    });
  } catch (error) {
    console.error("eSewa initiate error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// @desc    Verify eSewa payment
// @route   GET /api/payment/esewa/verify
router.get("/esewa/verify", async (req, res): Promise<void> => {
  try {
    const { data } = req.query as { data?: string };
    if (!data) {
      res.status(400).json({ success: false, message: "No data provided" });
      return;
    }

    const decodedData = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
    if (decodedData.status !== "COMPLETE") {
      res.status(400).json({ success: false, message: "Payment not complete." });
      return;
    }

    const verificationUrl = `https://rc-epay.esewa.com.np/api/epay/transaction/status/?product_code=${decodedData.product_code}&total_amount=${decodedData.total_amount}&transaction_uuid=${decodedData.transaction_uuid}`;
    const response = await globalThis.fetch(verificationUrl);
    const verificationResponse = await response.json();

    if (verificationResponse.status === "COMPLETE") {
      const bookingId = decodedData.transaction_uuid;
      const bookingData = getPendingBooking(bookingId);

      if (!bookingData) {
        res.status(404).json({ success: false, message: "Booking expired" });
        return;
      }

      const { total, vehicle, days, subtotal, serviceFee, vat, dropOffFee, discount } =
        await calculateBookingTotalLegacy(
          bookingData.vehicleSlug,
          bookingData.startDate,
          bookingData.endDate,
          bookingData.couponCode,
          bookingData.dropoff,
          bookingData.pickup,
          bookingData.insurance,
          bookingData.addons,
        );

      // SECURITY: Verify that the amount paid matches the calculated total
      const paymentValidation = validatePaymentAmount(parseInt(decodedData.total_amount), total, 1);

      if (!paymentValidation.valid) {
        logPaymentTampering(
          bookingData.userId,
          parseInt(decodedData.total_amount),
          total,
          req.ip,
          req.headers["user-agent"],
        );
        console.warn(
          `[SECURITY] Amount tampering detected on eSewa payment! Paid: ${decodedData.total_amount}, Calculated: ${total}`,
        );
        res.status(400).json({
          success: false,
          message: "Payment amount does not match booking total. Please try again.",
        });
        return;
      }

      logPaymentValidationAttempt(
        bookingData.userId,
        req.ip || "unknown",
        true,
        parseInt(decodedData.total_amount),
        total,
        { method: "esewa", bookingSlug: bookingData.vehicleSlug },
      );

      const booking = await Booking.create({
        user: bookingData.userId,
        vehicle: vehicle._id,
        vehicleName: vehicle.name,
        vehicleImage: vehicle.image,
        vehicleSlug: vehicle.slug,
        pickup: bookingData.pickup,
        dropoff: bookingData.dropoff || bookingData.pickup,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        days,
        subtotal,
        serviceFee,
        vat,
        discount,
        total,
        insurance: bookingData.insurance,
        addons: bookingData.addons,
        status: "upcoming",
        payment: "eSewa",
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        license: bookingData.license,
        couponCode: bookingData.couponCode,
        calculatedTotal: total,
        serverValidated: true,
      });

      deletePendingBooking(bookingId);

      Notification.create({
        user: bookingData.userId,
        type: "booking",
        title: "Booking Confirmed!",
        body: `Your booking for ${vehicle.name} has been paid via eSewa.`,
        href: "/dashboard",
      }).catch(console.error);

      // Send confirmation email
      sendEmail({
        to: bookingData.customerEmail,
        subject: `Booking Confirmed: ${vehicle.name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Booking Confirmed!</h2>
            <p>Hi ${bookingData.customerName},</p>
            <p>Your booking for the <strong>${vehicle.name}</strong> has been successfully confirmed and paid.</p>
            <p><strong>Pickup:</strong> ${new Date(bookingData.startDate).toLocaleDateString()} at ${bookingData.pickup}</p>
            <p><strong>Total Paid:</strong> £${total.toLocaleString()}</p>
            <p>Thank you for choosing RentalSphere!</p>
          </div>
        `,
      }).catch(console.error);

      res.status(200).json({ success: true, data: booking });
    } else {
      res.status(400).json({ success: false, message: "eSewa verification failed" });
    }
  } catch (error) {
    console.error("eSewa verification error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
