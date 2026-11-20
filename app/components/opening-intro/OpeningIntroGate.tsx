import "./opening-intro.css";
import { openingIntroGateScript } from "./opening-intro-gate";

/**
 * Server-rendered half of the opening intro: a dark shade that is hidden by default, plus the inline gate that
 * reveals it before first paint when (and only when) the intro will play. The CSP allows inline scripts
 * ('unsafe-inline' in next.config.ts); nothing there changes.
 */
export function OpeningIntroGate() {
  return (
    <>
      <div className="opening-intro-shade" aria-hidden="true" />
      <script dangerouslySetInnerHTML={{ __html: openingIntroGateScript }} />
    </>
  );
}
