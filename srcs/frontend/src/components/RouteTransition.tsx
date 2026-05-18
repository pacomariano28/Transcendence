import { useLocation } from "react-router-dom";

export default function RouteTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();

  return (
    <div key={location.pathname} className="fade-in">
      {children}
    </div>
  );
}
