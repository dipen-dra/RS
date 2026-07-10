import mongoose, { Document, Schema } from "mongoose";

export interface IQuery extends Document {
  user?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  subject: string;
  message: string;
  reply?: string;
  isReplied: boolean;
  repliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuerySchema = new Schema<IQuery>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    reply: { type: String },
    isReplied: { type: Boolean, default: false },
    repliedAt: { type: Date },
  },
  { timestamps: true },
);

export const Query = mongoose.model<IQuery>("Query", QuerySchema);
