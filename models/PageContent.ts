// models/PageContent.ts

import mongoose, { Schema, models, model } from "mongoose";

const SectionSchema = new Schema(
  {
    h3: { type: String, default: "" },
    p: { type: String, default: "" },
  },
  { _id: false },
);

const PageContentSchema = new Schema(
  {
    _id: { type: String }, // "privacy-policy" | "terms-and-conditions" | "about"
    sections: { type: [SectionSchema], default: [] },
  },
  { timestamps: true },
);

export default models.PageContent || model("PageContent", PageContentSchema);
