import { Schema, models, model, Document, Types } from "mongoose";

// Stores the per-user fee for a specific period
export interface IPeriodUserFee extends Document {
  periodId: Types.ObjectId;
  userId:   Types.ObjectId;
  fee:      number;
  createdAt: Date;
  updatedAt: Date;
}

const PeriodUserFeeSchema = new Schema<IPeriodUserFee>(
  {
    periodId: { type: Schema.Types.ObjectId, ref: "SubscriptionPeriod", required: true },
    userId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    fee:      { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

// One fee per user per period
PeriodUserFeeSchema.index({ periodId: 1, userId: 1 }, { unique: true });

const PeriodUserFee =
  models.PeriodUserFee ||
  model<IPeriodUserFee>("PeriodUserFee", PeriodUserFeeSchema);

export default PeriodUserFee;
