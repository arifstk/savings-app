// lib/admin.ts
import AdminLock from "@/models/AdminLock";

export async function tryClaimAdmin(userId: string): Promise<boolean> {
  try {
    await AdminLock.create({ _id: "admin-lock", claimedBy: userId });
    return true;
  } catch (err: unknown) {
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
