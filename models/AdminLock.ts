import { Schema, models, model } from "mongoose";

export interface IAdminLock {
  _id: string;
  claimedBy: string; // user id
}

const AdminLockSchema = new Schema<IAdminLock>({
  _id: { type: String, default: "admin-lock" },
  claimedBy: { type: String, required: true },
});

const AdminLock = models.AdminLock || model<IAdminLock>("AdminLock", AdminLockSchema);

export default AdminLock;


// not used right now 