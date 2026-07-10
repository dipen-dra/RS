import mongoose, { Document, Schema } from "mongoose";

export interface IVehicle extends Document {
  _id: mongoose.Types.ObjectId;
  slug: string;
  name: string;
  brand: string;
  type: "car" | "bike";
  category: string;
  pricePerDay: number;
  fuel: "Petrol" | "Diesel" | "Electric" | "Hybrid";
  transmission: "Automatic" | "Manual";
  seats: number;
  rating: number;
  reviews: number;
  image: string;
  gallery: string[];
  features: string[];
  location: string;
  description: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    type: { type: String, enum: ["car", "bike"], required: true },
    category: { type: String, required: true },
    pricePerDay: { type: Number, required: true, min: 0 },
    fuel: { type: String, enum: ["Petrol", "Diesel", "Electric", "Hybrid"], required: true },
    transmission: { type: String, enum: ["Automatic", "Manual"], required: true },
    seats: { type: Number, required: true, min: 1 },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    reviews: { type: Number, default: 0, min: 0 },
    image: { type: String, required: true },
    gallery: [{ type: String }],
    features: [{ type: String }],
    location: { type: String, required: true },
    description: { type: String, default: "" },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Vehicle = mongoose.model<IVehicle>("Vehicle", VehicleSchema);
