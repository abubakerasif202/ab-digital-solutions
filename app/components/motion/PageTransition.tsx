import { ViewTransition, type ReactNode } from "react";

/**
 * Wrap a page's <main> in this so route changes cross-fade and rise
 * (see "Route transitions" in motion.css). It belongs in each page, not the
 * layout: layouts persist across navigations, so enter and exit never fire
 * there. Header and footer sit outside it and stay still.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return <ViewTransition default="page">{children}</ViewTransition>;
}
