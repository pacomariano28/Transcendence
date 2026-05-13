import { useAuth } from "../auth/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="container-page py-10 fade-in">
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Profile
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Session data from /api/auth/me
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-300">
            Protected
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs font-medium text-zinc-400">Summary</div>
            <div className="mt-3 space-y-2 text-sm text-zinc-200">
              <div>
                <div className="text-xs text-zinc-500">Email</div>
                <div className="text-zinc-200">{user?.email ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Username</div>
                <div className="text-zinc-200">{user?.username ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Id</div>
                <div className="text-zinc-200 break-all">{user?.id ?? "-"}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs font-medium text-zinc-400">Raw</div>
            <pre className="mt-2 overflow-auto text-xs text-zinc-200">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
