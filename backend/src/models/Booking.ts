import mongoose, { Document, Schema } from "mongoose";

export type BookingStatus = "upcoming" | "active" | "completed" | "cancelled";

export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  bookingId: string;
  user: mongoose.Types.ObjectId;
  vehicle: mongoose.Types.ObjectId;
  vehicleName: string;
  vehicleImage: string;
  vehicleSlug: string;
  pickup: string;
  dropoff: string;
  startDate: string;
  endDate: string;
  days: number;
  subtotal: number;
  serviceFee: number;
  vat: number;
  discount: number;
  total: number;
  status: BookingStatus;
  payment: "Card" | "PayPal" | "Cash" | "Khalti" | "eSewa";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  license: string;
  couponCode?: string;
  insurance?: string;
  addons?: string[];
  calculatedTotal?: number;
  serverValidated: boolean;
  priceRecalculationLog?: Array<{
    timestamp: Date;
    originalTotal: number;
    recalculatedTotal: number;
    difference: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingId: { type: String, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    vehicle: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
    vehicleName: { type: String },
    vehicleImage: { type: String },
    vehicleSlug: { type: String },
    pickup: { type: String, required: true },
    dropoff: { type: String, default: "" },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    days: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true },
    serviceFee: { type: Number, default: 0 },
    vat: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["upcoming", "active", "completed", "cancelled"],
      default: "upcoming",
    },
    payment: { type: String, enum: ["Card", "PayPal", "Cash", "Khalti", "eSewa"], required: true },
    customerName: { type: String },
    customerEmail: { type: String },
    customerPhone: { type: String },
    license: { type: String },
    couponCode: { type: String },
    insurance: { type: String, default: "basic" },
    addons: { type: [String], default: [] },
    calculatedTotal: { type: Number, select: false },
    serverValidated: { type: Boolean, default: false },
    priceRecalculationLog: [
      {
        timestamp: { type: Date, default: Date.now },
        originalTotal: Number,
        recalculatedTotal: Number,
        difference: Number,
      },
    ],
  },
  { timestamps: true },
);

// Auto-generate bookingId before first save
BookingSchema.pre("save", function (next) {
  if (!this.bookingId) {
    const rand = Math.floor(Math.random() * 900000 + 100000);
    this.bookingId = `DN-${rand}`;
  }
  next();
});

BookingSchema.index({ user: 1, status: 1 });

export const Booking = mongoose.model<IBooking>("Booking", BookingSchema);
