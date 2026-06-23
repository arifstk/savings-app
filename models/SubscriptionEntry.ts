import { Schema, models, model, Document, Types } from "mongoose";

export type EntryStatus = "pending" | "paid";

export interface ISubscriptionEntry extends Document {
  periodId: Types.ObjectId;
  userId: Types.ObjectId;
  fee: number;              // actual fee (may differ from period defaultFee)
  status: EntryStatus;
  paidAt?: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionEntrySchema = new Schema<ISubscriptionEntry>(
  {
    periodId: { type: Schema.Types.ObjectId, ref: "SubscriptionPeriod", required: true },
    userId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    fee:      { type: Number, required: true, min: 0 },
    status:   { type: String, enum: ["pending", "paid"], default: "pending" },
    paidAt:   { type: Date },
    note:     { type: String, trim: true },
  },
  { timestamps: true }
);

// One entry per user per period
SubscriptionEntrySchema.index({ periodId: 1, userId: 1 }, { unique: true });

const SubscriptionEntry =
  models.SubscriptionEntry ||
  model<ISubscriptionEntry>("SubscriptionEntry", SubscriptionEntrySchema);

export default SubscriptionEntry;
