import { type ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Wraps page content in a subtle fade-in animation on route change.
 * Uses CSS animation keyed on the pathname for re-triggering.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();

  return (
    <div
      key={location.pathname}
      className="page-fade-in"
    >
      {children}
    </div>
  );
}
