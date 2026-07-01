// models/contactInfo.ts

import mongoose, { Schema, models, model } from "mongoose";

const CardSchema = new Schema(
  {
    icon: { type: String, default: "📧" },
    title: { type: String, default: "" },
    desc: { type: String, default: "" },
    sub: { type: String, default: "" },
  },
  { _id: false },
);

const ContactInfoSchema = new Schema(
  {
    _id: { type: String, default: "contact-info" },
    cards: { type: [CardSchema], default: [] },
  },
  { timestamps: true },
);

export default models.ContactInfo || model("ContactInfo", ContactInfoSchema);


