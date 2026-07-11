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
  process.env.KHALTI_SECRET_KEY || "Key test_secret_key_3f78fb6364ef4bd1b5fc670ce33a06f5";
const KHALTI_INITIATE_URL = "https://dev.khalti.com/api/v2/epayment/initiate/";
const KHALTI_VERIFY_URL =
  process.env.KHALTI_VERIFY_URL || "https://dev.khalti.com/api/v2/epayment/lookup/";
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
  const dropOffFee = dropoff && pickup && dropoff !== pickup ? 1000 : 0;
  const vat = Math.round((subtotal + dropOffFee) * 0.13);
  const discount = couponCode === "DRIVE10" ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + serviceFee + vat + dropOffFee - discount;

  return { total, vehicle, days, subtotal, serviceFee, vat, dropOffFee, discount };
};

// @desc    Initiate Khalti ePay v2 payment
// @route   POST /api/payment/khalti/initiate
router.post("/khalti/initiate", protect, async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Store pending booking so we can create it after verification
    storePendingBooking(bookingId, {
      ...bookingData,
      userId: req.user!._id.toString(),
      totalAmount: total,
    });

    const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

    const payload = {
      return_url: `${CLIENT_URL}/payment/khalti/success`,
      website_url: CLIENT_URL,
      amount: total * 100, // Khalti uses paisa (1 GBP = 100 paisa equivalent)
      purchase_order_id: bookingId,
      purchase_order_name: `RentalSphere — ${bookingData.vehicleSlug}`,
      customer_info: {
        name: bookingData.customerName,
        email: bookingData.customerEmail,
        phone: bookingData.customerPhone || "9800000001",
      },
    };

    const response = await globalThis.fetch(KHALTI_INITIATE_URL, {
      method: "POST",
      headers: {
        Authorization: KHALTI_SECRET_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json() as any;

    if (!response.ok || !data.payment_url) {
      console.error("[Khalti Initiate Error]", data);
      res.status(502).json({
        success: false,
        message: data.detail || "Failed to initiate Khalti payment",
        error: data,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        payment_url: data.payment_url,
        pidx: data.pidx,
        bookingId,
      },
    });
  } catch (error) {
    console.error("Khalti initiate error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @desc    Verify Khalti ePay v2 payment (called from success page with pidx)
// @route   POST /api/payment/khalti/verify
router.post("/khalti/verify", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pidx, bookingId } = req.body;

    if (!pidx || !bookingId) {
      res.status(400).json({ success: false, message: "pidx and bookingId are required" });
      return;
    }

    // Lookup payment status from Khalti
    const response = await globalThis.fetch(KHALTI_VERIFY_URL, {
      method: "POST",
      headers: {
        Authorization: KHALTI_SECRET_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pidx }),
    });

    const verificationData = await response.json() as any;

    if (!response.ok || verificationData.status !== "Completed") {
      console.error("[Khalti Verify Failed]", verificationData);
      res.status(400).json({
        success: false,
        message: `Khalti payment not completed. Status: ${verificationData.status || "unknown"}`,
        error: verificationData,
      });
      return;
    }

    // Retrieve pending booking data
    const bookingData = getPendingBooking(bookingId);
    if (!bookingData) {
      res.status(404).json({ success: false, message: "Booking session expired. Please try again." });
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

    // SECURITY: Verify amount paid matches calculated total
    // Khalti amount is in paisa; convert to pounds for comparison
    const paidAmount = verificationData.total_amount / 100;
    const paymentValidation = validatePaymentAmount(paidAmount, total, 1);

    if (!paymentValidation.valid) {
      logPaymentTampering(
        req.user!._id.toString(),
        paidAmount,
        total,
        req.ip,
        req.headers["user-agent"],
      );
      res.status(400).json({
        success: false,
        message: "Payment amount does not match booking total.",
      });
      return;
    }

    logPaymentValidationAttempt(
      req.user!._id.toString(),
      req.ip || "unknown",
      true,
      paidAmount,
      total,
      { method: "khalti", pidx, bookingSlug: bookingData.vehicleSlug },
    );

    // Create booking
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

    deletePendingBooking(bookingId);

    Notification.create({
      user: req.user!._id,
      type: "booking",
      title: "Booking Confirmed!",
      body: `Your booking for ${vehicle.name} has been paid via Khalti.`,
      href: "/dashboard",
    }).catch(console.error);

    sendEmail({
      to: bookingData.customerEmail,
      subject: `Booking Confirmed: ${vehicle.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Booking Confirmed!</h2>
          <p>Hi ${bookingData.customerName},</p>
          <p>Your booking for the <strong>${vehicle.name}</strong> has been confirmed and paid via Khalti.</p>
          <p><strong>Pickup:</strong> ${new Date(bookingData.startDate).toLocaleDateString()} at ${bookingData.pickup}</p>
          <p><strong>Total Paid:</strong> Rs. ${total.toLocaleString()}</p>
          <p>Thank you for choosing RentalSphere!</p>
        </div>
      `,
    }).catch(console.error);

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error("Khalti verify error:", error);
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
            <p><strong>Total Paid:</strong> Rs. ${total.toLocaleString()}</p>
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
