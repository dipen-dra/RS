/**
 * Payment validation utility
 * Prevents amount tampering by verifying calculated amounts match paid amounts
 */

interface PaymentValidationResult {
  valid: boolean;
  error?: string;
  clientTotal?: number;
  calculatedTotal?: number;
}

export const validatePaymentAmount = (
  clientTotal: number,
  calculatedTotal: number,
  tolerance: number = 1, // 1 rupee tolerance for rounding
): PaymentValidationResult => {
  if (clientTotal === undefined || calculatedTotal === undefined) {
    return {
      valid: false,
      error: "Missing amount data for validation",
    };
  }

  const difference = Math.abs(clientTotal - calculatedTotal);

  if (difference > tolerance) {
    return {
      valid: false,
      error: "Payment amount tampering detected",
      clientTotal,
      calculatedTotal,
    };
  }

  return { valid: true };
};

/**
 * Log payment validation attempts to security audit trail
 */
export const logPaymentValidationAttempt = (
  userId: string,
  ipAddress: string,
  valid: boolean,
  clientTotal: number,
  calculatedTotal: number,
  details?: Record<string, unknown>,
): void => {
  const timestamp = new Date().toISOString();
  const logLevel = valid ? "[INFO]" : "[SECURITY_ALERT]";

  console.log(
    `${logLevel} Payment validation - User: ${userId}, IP: ${ipAddress}, Valid: ${valid}, Paid: ${clientTotal}, Calculated: ${calculatedTotal}, Time: ${timestamp}`,
    details ? JSON.stringify(details) : "",
  );
};
