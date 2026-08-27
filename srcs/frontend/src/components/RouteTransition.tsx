import {
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { useLocation, type Location } from "react-router-dom";
import { PAGE_EXIT_MS } from "../constants/pageTransitions";

type RouteTransitionProps = {
  children: ReactNode;
};

type RoutesChild = ReactElement<{ location?: Location }>;

function shouldSkipRouteExit(nextLocation: Location): boolean {
  return Boolean(
    (nextLocation.state as { fromRematch?: boolean } | null)?.fromRematch,
  );
}

export default function RouteTransition({ children }: RouteTransitionProps) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [stage, setStage] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    if (location.pathname === displayLocation.pathname) {
      if (location.key !== displayLocation.key) {
        const timer = window.setTimeout(() => {
          setDisplayLocation(location);
          setStage("enter");
        }, 0);
        return () => window.clearTimeout(timer);
      }
      return;
    }

    if (shouldSkipRouteExit(location)) {
      const timer = window.setTimeout(() => {
        setDisplayLocation(location);
        setStage("enter");
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const exitTimer = window.setTimeout(() => setStage("exit"), 0);

    const timer = window.setTimeout(() => {
      setDisplayLocation(location);
      setStage("enter");
    }, PAGE_EXIT_MS);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(timer);
    };
  }, [location, displayLocation.pathname, displayLocation.key]);

  const content =
    isValidElement(children) && children.type
      ? cloneElement(children as RoutesChild, { location: displayLocation })
      : children;

  return (
    <div className={stage === "exit" ? "page-exit" : "page-enter"}>
      {content}
    </div>
  );
}
