import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export default async function AdminPage() {
  const session = await auth();
  await dbConnect();

  const users = await User.find().select("name email mobile role provider createdAt").lean();

  return (
    <div className="flex-1 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-amber-500 mb-3">
          Admin
        </p>
        <h1 className="font-display text-3xl mb-2">User management</h1>
        <p className="text-stone-400 text-sm mb-8">
          Signed in as {session?.user?.email}. {users.length} registered user
          {users.length === 1 ? "" : "s"}.
        </p>

        <div className="border border-stone-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-900 text-stone-400 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Provider</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {users.map((u) => (
                <tr key={u._id.toString()}>
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3 text-stone-300">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.role === "admin" ? (
                      <span className="text-xs font-medium uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        Admin
                      </span>
                    ) : (
                      <span className="text-stone-500">User</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-400 capitalize">{u.provider}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
