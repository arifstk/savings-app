import { Schema, models, model, Document } from "mongoose";

export interface ISubscriptionPeriod extends Document {
  name: string;
  startMonth: string; // "2026-07"
  endMonth: string;   // "2027-02"
  status: "open" | "closed";
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPeriodSchema = new Schema<ISubscriptionPeriod>(
  {
    name:       { type: String, required: true, trim: true },
    startMonth: { type: String, required: true }, // YYYY-MM
    endMonth:   { type: String, required: true }, // YYYY-MM
    status:     { type: String, enum: ["open", "closed"], default: "open" },
    closedAt:   { type: Date },
  },
  { timestamps: true }
);

const SubscriptionPeriod =
  models.SubscriptionPeriod ||
  model<ISubscriptionPeriod>("SubscriptionPeriod", SubscriptionPeriodSchema);

export default SubscriptionPeriod;
