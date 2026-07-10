import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: "booking" | "payment" | "promo" | "alert" | "message";
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["booking", "payment", "promo", "alert", "message"],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    href: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Allow fast querying of user's unread vs read notifications
NotificationSchema.index({ user: 1, read: 1 });

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
