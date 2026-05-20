import { useAuth } from "../auth/AuthContext";
import TypingText from "../components/TypingText";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="container-page py-10 fade-in">
      <div className="card p-6">
        <TypingText text="DASHBOARD" size="lg" />
        <p className="mt-2 text-sm text-zinc-400">Authenticated area.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs font-medium text-zinc-400">User</div>
            <pre className="mt-2 overflow-auto text-xs text-zinc-200">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs font-medium text-zinc-400">Next</div>
            <p className="mt-2 text-sm text-zinc-300">
              Aquí luego metemos “Play” / “Join room” / etc.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
