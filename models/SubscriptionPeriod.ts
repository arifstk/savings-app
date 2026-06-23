import { Schema, models, model, Document } from "mongoose";

export type PeriodStatus = "open" | "closed";

export interface ISubscriptionPeriod extends Document {
  name: string;           // e.g. "July 2026"
  startDate: Date;
  endDate: Date;
  defaultFee: number;     // default monthly fee in Taka
  status: PeriodStatus;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPeriodSchema = new Schema<ISubscriptionPeriod>(
  {
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    defaultFee: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

const SubscriptionPeriod =
  models.SubscriptionPeriod ||
  model<ISubscriptionPeriod>("SubscriptionPeriod", SubscriptionPeriodSchema);

export default SubscriptionPeriod;
