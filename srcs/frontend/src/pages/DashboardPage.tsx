import { useAuth } from "../auth/AuthContext";

export default function DashboardPage() {
  const { user, reload } = useAuth();

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>You are authenticated.</p>
      <button onClick={() => reload()}>Reload session</button>
      <pre style={{ marginTop: 16 }}>{JSON.stringify(user, null, 2)}</pre>
      <p>
        <a href="/login">Go to login</a>
      </p>
    </div>
  );
}
