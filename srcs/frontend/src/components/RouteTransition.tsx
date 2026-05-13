import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function RouteTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const [key, setKey] = useState(location.pathname);

  useEffect(() => {
    // fuerza re-montaje para que se reaplique la animación
    setKey(location.pathname);
  }, [location.pathname]);

  return (
    <div key={key} className="fade-in">
      {children}
    </div>
  );
}
