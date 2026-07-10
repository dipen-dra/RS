import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone?: string;
  license?: string;
  city?: string;
  avatar?: string;
  role: "user" | "admin" | "superadmin";
  isActive: boolean;
  authProvider: "local" | "google";
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  passwordHistory?: string[];
  failedLoginAttempts: number;
  lastFailedLogin?: Date;
  lastLogin?: Date;
  passwordChangedAt?: Date;
  // MFA fields
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaBackupCodes?: string[];
  mfaPendingSecret?: string; // temporary during setup
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  checkPasswordHistory(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, default: "" },
    license: { type: String, default: "" },
    city: { type: String, default: "" },
    avatar: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin", "superadmin"], default: "user" },
    isActive: { type: Boolean, default: true },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    passwordHistory: { type: [String], default: [], select: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lastFailedLogin: { type: Date, select: false },
    lastLogin: { type: Date, select: false },
    passwordChangedAt: { type: Date, select: false },
    // MFA
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, select: false },
    mfaBackupCodes: { type: [String], select: false },
    mfaPendingSecret: { type: String, select: false },
  },
  { timestamps: true },
);

// Hash password before save
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // Store previous password in history (keep last 5)
  if (!this.passwordHistory) {
    this.passwordHistory = [];
  }
  this.passwordHistory.push(this.password);
  if (this.passwordHistory.length > 5) {
    this.passwordHistory = this.passwordHistory.slice(-5);
  }

  // Hash the new password
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date();
  next();
});

// Compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check password history to prevent reuse
UserSchema.methods.checkPasswordHistory = async function (
  candidatePassword: string,
): Promise<boolean> {
  if (!this.passwordHistory || this.passwordHistory.length === 0) return false;

  for (const previousPassword of this.passwordHistory) {
    const isMatch = await bcrypt.compare(candidatePassword, previousPassword);
    if (isMatch) return true; // Password was previously used
  }
  return false; // Password is new
};

export const User = mongoose.model<IUser>("User", UserSchema);
