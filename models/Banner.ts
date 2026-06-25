import { Schema, models, model } from "mongoose";

export interface IBanner {
  _id: string;
  enabled: boolean;
  h1: string;
  h2: string;
  p: string;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    _id:     { type: String, default: "banner" },
    enabled: { type: Boolean, default: true },
    h1:      { type: String, default: "" },
    h2:      { type: String, default: "" },
    p:       { type: String, default: "" },
  },
  { timestamps: true }
);

const Banner = models.Banner || model<IBanner>("Banner", BannerSchema);
export default Banner;
