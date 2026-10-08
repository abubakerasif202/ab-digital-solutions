import { ViewTransition, type ReactNode } from "react";

/* Route-change motion for a page's <main>. Next.js runs navigations inside
   React transitions, so this animates the outgoing page out and the incoming
   page in (styles: .gr-page in media-motion.css). It wraps the page, not the
   layout: layouts persist across navigations and never enter or exit. The
   header sits outside and keeps its own pinned transition name. */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="gr-page" exit="gr-page" default="none">
      {children}
    </ViewTransition>
  );
}
