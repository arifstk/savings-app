// import { Schema, models, model, Document, Types } from "mongoose";

// export interface ISubscription extends Document {
//   userId: Types.ObjectId;
//   month: string; // e.g. "JUL,2026"
//   amount: number; // in Taka
//   date: Date; // payment/entry date
//   createdAt: Date;
//   updatedAt: Date;
// }

// const SubscriptionSchema = new Schema<ISubscription>(
//   {
//     userId: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     month: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     amount: {
//       type: Number,
//       required: true,
//       min: 0,
//     },
//     date: {
//       type: Date,
//       required: true,
//     },
//   },
//   { timestamps: true },
// );

// const Subscription =
//   models.Subscription ||
//   model<ISubscription>("Subscription", SubscriptionSchema);

// export default Subscription;
