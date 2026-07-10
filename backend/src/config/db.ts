import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/rentalsphere";

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected. Reconnecting...");
});
