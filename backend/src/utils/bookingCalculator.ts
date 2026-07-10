/**
 * Secure booking calculation utility
 * Always recalculates totals from database to prevent tampering
 */

import { Vehicle } from "../models/Vehicle.js";

interface BookingCalculationResult {
  subtotal: number;
  pickupFee: number;
  dropoffFee: number;
  insuranceCost: number;
  addonsCost: number;
  tax: number;
  total: number;
  days: number;
}

const PICKUP_FEE = 0;
const DROPOFF_FEE = 10;
const TAX_RATE = 0.2; // 20% VAT
const SERVICE_FEE_RATE = 0.05; // 5% service fee

const INSURANCE_PRICES: Record<string, number> = {
  basic: 0,
  plus: 5,
  max: 10,
};

const ADDON_PRICES: Record<string, number> = {
  driver: 20,
  gps: 2,
  child: 3,
  helmet: 1.5,
};

/**
 * Securely calculate booking total
 * Always fetches vehicle data from database
 * Never trusts client-provided amounts
 */
export const calculateBookingTotal = async (
  vehicleId: string,
  startDate: Date | string,
  endDate: Date | string,
  pickup: string,
  dropoff?: string,
  insurance?: string,
  addons?: string[],
): Promise<BookingCalculationResult> => {
  // Fetch vehicle from database (never trust client data)
  const vehicle = await Vehicle.findById(vehicleId).select("pricePerDay");
  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  // Calculate days
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const msPerDay = 86400000;
  const days = Math.max(1, Math.ceil((end - start) / msPerDay));

  // Base calculation from database
  const subtotal = vehicle.pricePerDay * days;

  // Calculate pickup fee (always charged)
  const pickupFeeAmount = PICKUP_FEE;

  // Calculate dropoff fee (only if different from pickup)
  const dropoffFeeAmount = dropoff && pickup && dropoff !== pickup ? DROPOFF_FEE : 0;

  // Calculate insurance cost
  const insurancePrice = INSURANCE_PRICES[insurance || "basic"] ?? 0;
  const insuranceCost = insurancePrice * days;

  // Calculate addons cost
  const addonsCost = (addons || []).reduce(
    (sum, addonId) => sum + (ADDON_PRICES[addonId] ?? 0) * days,
    0,
  );

  // Calculate subtotal with fees
  const subtotalWithFees =
    subtotal + pickupFeeAmount + dropoffFeeAmount + insuranceCost + addonsCost;

  // Calculate tax (20% VAT in UK)
  const tax = Math.round(subtotalWithFees * TAX_RATE);

  // Final total
  const total = subtotalWithFees + tax;

  return {
    subtotal,
    pickupFee: pickupFeeAmount,
    dropoffFee: dropoffFeeAmount,
    insuranceCost,
    addonsCost,
    tax,
    total,
    days,
  };
};

/**
 * Verify booking calculation against client-provided total
 * Returns detailed breakdown for auditing
 */
export const verifyBookingAmount = async (
  vehicleId: string,
  startDate: Date | string,
  endDate: Date | string,
  pickup: string,
  clientTotal: number,
  dropoff?: string,
  insurance?: string,
  addons?: string[],
): Promise<{
  isValid: boolean;
  calculation: BookingCalculationResult;
  mismatch?: number;
}> => {
  const calculation = await calculateBookingTotal(
    vehicleId,
    startDate,
    endDate,
    pickup,
    dropoff,
    insurance,
    addons,
  );

  const mismatch = Math.abs(clientTotal - calculation.total);
  const isValid = mismatch <= 1; // 1 rupee tolerance for rounding

  return {
    isValid,
    calculation,
    mismatch,
  };
};
