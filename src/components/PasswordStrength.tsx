import { useState, useMemo } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface PasswordStrengthFeedback {
  isValid: boolean;
  strength: "weak" | "medium" | "strong";
  message: string;
  feedback: string[];
}

export function validatePasswordStrength(password: string): PasswordStrengthFeedback {
  const feedback: string[] = [];
  let strengthScore = 0;

  // Check minimum length (10 characters)
  if (password.length < 10) {
    feedback.push("At least 10 characters");
  } else {
    strengthScore++;
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    feedback.push("At least one uppercase letter (A-Z)");
  } else {
    strengthScore++;
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    feedback.push("At least one lowercase letter (a-z)");
  } else {
    strengthScore++;
  }

  // Check for numbers
  if (!/[0-9]/.test(password)) {
    feedback.push("At least one number (0-9)");
  } else {
    strengthScore++;
  }

  // Check for special characters
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    feedback.push("At least one special character (!@#$%...)");
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
    message: isValid ? "Password is strong ✓" : "Password needs improvements",
    feedback,
  };
}

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrength({ password, showRequirements = false }: PasswordStrengthProps) {
  const validation = useMemo(() => validatePasswordStrength(password), [password]);

  if (!password && !showRequirements) return null;

  const strengthColors = {
    weak: "bg-red-500",
    medium: "bg-yellow-500",
    strong: "bg-green-500",
  };

  const strengthLabels = {
    weak: "Weak",
    medium: "Medium",
    strong: "Strong",
  };

  return (
    <div className="space-y-3 mt-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${strengthColors[validation.strength]}`}
            style={{
              width:
                validation.strength === "weak"
                  ? "33%"
                  : validation.strength === "medium"
                    ? "66%"
                    : "100%",
            }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {strengthLabels[validation.strength]}
        </span>
      </div>

      {/* Message */}
      <div
        className={`flex items-center gap-2 text-xs ${
          validation.isValid
            ? "text-green-600 dark:text-green-400"
            : "text-amber-600 dark:text-amber-400"
        }`}
      >
        {validation.isValid ? (
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        )}
        <span>{validation.message}</span>
      </div>

      {/* Requirements list */}
      {showRequirements && validation.feedback.length > 0 && (
        <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-2">
          {validation.feedback.map((req, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-1 w-1 rounded-full bg-muted-foreground" />
              {req}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
