import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth-context";

export default function SpotifySuccessPage() {
  const nav = useNavigate();
  const { reload } = useAuth();

  useEffect(() => {
    (async () => {
      await reload();
      nav("/dashboard", { replace: true });
    })();
  }, [reload, nav]);

  return <div style={{ padding: 24 }}>Completing login...</div>;
}
