import { Schema, models, model } from "mongoose";

export interface ISiteSettings {
  _id: string;
  orgName: string;
  logoUrl: string;
  managerSignatureUrl?: string;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    _id:                 { type: String, default: "site-settings" },
    orgName:             { type: String, default: "My Organization" },
    logoUrl:             { type: String, default: "" },
    managerSignatureUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

const SiteSettings =
  models.SiteSettings ||
  model<ISiteSettings>("SiteSettings", SiteSettingsSchema);

export default SiteSettings;
