import { useTranslation } from "react-i18next";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/auth-context";

export function RequireAuth() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading)
    return (
      <div className="container-page py-10 fade-in">{t("common.loading")}</div>
    );
  if (!user) {
    const returnTo = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  return <Outlet />;
}
