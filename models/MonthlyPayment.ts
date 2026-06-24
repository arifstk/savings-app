import { Schema, models, model, Document, Types } from "mongoose";

export type PaymentStatus = "paid" | "pending";

// One record per user per month per period
export interface IMonthlyPayment extends Document {
  periodId:  Types.ObjectId;
  userId:    Types.ObjectId;
  month:     string;
  fee:       number;
  status:    PaymentStatus;
  paidAt?:   Date;
  note?:     string;
  createdAt: Date;
  updatedAt: Date;
}

const MonthlyPaymentSchema = new Schema<IMonthlyPayment>(
  {
    periodId: { type: Schema.Types.ObjectId, ref: "SubscriptionPeriod", required: true },
    userId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    month:    { type: String, required: true }, // YYYY-MM
    fee:      { type: Number, required: true, min: 0 },
    status:   { type: String, enum: ["paid", "pending"], default: "pending" },
    paidAt:   { type: Date },
    note:     { type: String, trim: true },
  },
  { timestamps: true }
);

// One payment per user per month per period
MonthlyPaymentSchema.index({ periodId: 1, userId: 1, month: 1 }, { unique: true });

const MonthlyPayment =
  models.MonthlyPayment ||
  model<IMonthlyPayment>("MonthlyPayment", MonthlyPaymentSchema);

export default MonthlyPayment;
