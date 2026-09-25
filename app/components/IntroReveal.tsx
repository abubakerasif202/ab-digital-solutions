const INTRO_SEEN_KEY = "ab-intro-seen";
// Longer than the slowest CSS sequence (desktop overlay + hero line rise).
const INTRO_SETTLE_MS = 2400;

// Runs during HTML parsing, before first paint, so the overlay can only ever
// appear at the very start of a visit — never on top of content the visitor
// is already reading. Static string: no user or request data is interpolated.
const introGate = `(function(){try{
if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
var s=window.sessionStorage;if(s.getItem("${INTRO_SEEN_KEY}")==="1")return;
s.setItem("${INTRO_SEEN_KEY}","1");
var r=document.documentElement;r.setAttribute("data-intro","play");
setTimeout(function(){r.setAttribute("data-intro","done")},${INTRO_SETTLE_MS});
}catch(e){}})();`;

/**
 * Cinematic brand reveal shown once per session on the homepage. Server
 * rendered and entirely CSS-driven: hidden unless the inline gate marks the
 * document with data-intro="play", then it plays a short monogram sequence
 * and fades away while the hero content (already painted beneath it) rises.
 * Skipped for reduced motion and for repeat views within the session.
 */
export function IntroReveal() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: introGate }} />
      <div className="intro-reveal" aria-hidden="true">
        <div className="intro-reveal-inner">
          <span className="intro-monogram">AB</span>
          <span className="intro-line" />
          <p className="intro-word">AB Web Studio</p>
        </div>
      </div>
    </>
  );
}
