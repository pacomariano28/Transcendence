import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { reload, user } = useAuth();

  function loginWithSpotify() {
    window.location.href = "/api/auth/spotify/login";
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Login</h1>

      <button onClick={loginWithSpotify}>Login with Spotify</button>

      <div style={{ marginTop: 16 }}>
        <button onClick={() => reload()}>Reload session</button>
      </div>

      <pre style={{ marginTop: 16 }}>{JSON.stringify({ user }, null, 2)}</pre>
    </div>
  );
}
