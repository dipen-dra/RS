/**
 * Strong password validation utility
 * Enforces: minimum 10 characters, uppercase, lowercase, numbers, symbols
 */

interface PasswordStrengthResult {
  isValid: boolean;
  strength: "weak" | "medium" | "strong";
  message: string;
  feedback: string[];
}

export const validatePasswordStrength = (password: string): PasswordStrengthResult => {
  const feedback: string[] = [];
  let strengthScore = 0;

  // Check minimum length (10 characters)
  if (password.length < 10) {
    feedback.push("Password must be at least 10 characters long");
  } else {
    strengthScore++;
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    feedback.push("Password must contain at least one uppercase letter (A-Z)");
  } else {
    strengthScore++;
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    feedback.push("Password must contain at least one lowercase letter (a-z)");
  } else {
    strengthScore++;
  }

  // Check for numbers
  if (!/[0-9]/.test(password)) {
    feedback.push("Password must contain at least one number (0-9)");
  } else {
    strengthScore++;
  }

  // Check for special characters
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    feedback.push("Password must contain at least one special character (!@#$%^&*...)");
  } else {
    strengthScore++;
  }

  const isValid = feedback.length === 0;

  let strength: "weak" | "medium" | "strong" = "weak";
  if (strengthScore >= 4) strength = "medium";
  if (strengthScore === 5) strength = "strong";

  return {
    isValid,
    strength,
    message: isValid ? "Password is strong" : "Password does not meet requirements",
    feedback,
  };
};

/**
 * Validation regex that matches strong password requirements
 */
export const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{10,}$/;

/**
 * Check if password meets minimum requirements
 */
export const isStrongPassword = (password: string): boolean => {
  return STRONG_PASSWORD_REGEX.test(password);
};
