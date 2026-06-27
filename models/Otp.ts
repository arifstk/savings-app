import { Schema, models, model, Document } from "mongoose";

export interface IOtp extends Document {
  email: string;
  otp: string; // hashed OTP (never store plain)
  expiresAt: Date;
  attempts: number; // track wrong guesses — lock after 5
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// MongoDB automatically deletes the document after expiresAt
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 300 });

// Only one OTP per email at a time
OtpSchema.index({ email: 1 }, { unique: true });

const Otp = models.Otp || model<IOtp>("Otp", OtpSchema);
export default Otp;
