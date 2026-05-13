export default function HomePage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Home</h1>
      <p>
        <a href="/login">Login</a>
      </p>
      <p>
        <a href="/dashboard">Dashboard (protected)</a>
      </p>
    </div>
  );
}
