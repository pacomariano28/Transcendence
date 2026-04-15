import { useState, type ChangeEvent, type FormEvent } from "react";

export const RegisterForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Login failed");

      const data = await response.json();
      console.log("Login successful:", data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">email</label>
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleInputChange}
      />
      <br />
      <label htmlFor="username">username</label>
      <input
        type="text"
        name="username"
        value={formData.username}
        onChange={handleInputChange}
      />
      <br />
      <label htmlFor="password">password</label>
      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleInputChange}
      />
      <br />
      <button type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviar"}
      </button>
      {error && <div style={{ color: "red" }}>{error}</div>}
    </form>
  );
};
