import { Schema, models, model } from "mongoose";

/**
 * This collection will only ever contain a single document with _id: "admin-lock".
 * We use a unique index on a fixed key plus an atomic findOneAndUpdate/upsert
 * to guarantee that even under concurrent requests, only one user can ever
 * successfully claim the admin role.
 */
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
