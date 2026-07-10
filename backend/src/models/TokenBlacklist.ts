import mongoose, { Document, Schema } from "mongoose";
import crypto from "crypto";

export interface ITokenBlacklist extends Document {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

const TokenBlacklistSchema = new Schema<ITokenBlacklist>(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// TTL index: MongoDB auto-removes expired tokens
TokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Hash a JWT token for safe storage
 */
export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const TokenBlacklist = mongoose.model<ITokenBlacklist>(
  "TokenBlacklist",
  TokenBlacklistSchema,
);
