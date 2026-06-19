import AdminLock from "@/models/AdminLock";

/**
 * Atomically attempts to claim the single "admin" slot for the given userId.
 * Returns true if this call successfully claimed admin (i.e. this is the
 * first user ever), false if admin was already claimed by someone else.
 *
 * This relies on MongoDB's atomic upsert + unique _id constraint, so it is
 * safe even if two registration requests happen at the exact same time.
 */
export async function tryClaimAdmin(userId: string): Promise<boolean> {
  try {
    await AdminLock.create({ _id: "admin-lock", claimedBy: userId });
    return true; // No document existed yet -> this request created it -> this user is admin
  } catch (err: unknown) {
    // E11000 duplicate key error means admin was already claimed by someone else
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: number }).code === 11000
    ) {
      return false;
    }
    throw err;
  }
}
