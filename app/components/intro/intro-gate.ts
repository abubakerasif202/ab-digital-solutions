import { INTRO_POSTER_SRC, INTRO_SEEN_KEY, INTRO_VIDEO_SRC, introTiming } from "./intro-config";

// Runs while the HTML is parsed, before first paint, so the black overlay
// either covers the page from frame one or never appears. Only the homepage
// without a hash, outside reduced motion, once per browser session. Static
// string: no request or user data is interpolated.
export const introGateScript = `(function(){try{
var d=document.documentElement;
if(location.pathname!=="/"||location.hash)return;
if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
var s=window.sessionStorage;if(s.getItem("${INTRO_SEEN_KEY}"))return;
s.setItem("${INTRO_SEEN_KEY}","1");
d.setAttribute("data-intro","playing");
var h=document.head,l=document.createElement("link");
l.rel="preload";l.as="video";l.type="video/mp4";l.href="${INTRO_VIDEO_SRC}";h.appendChild(l);
l=document.createElement("link");l.rel="preload";l.as="image";l.href="${INTRO_POSTER_SRC}";h.appendChild(l);
setTimeout(function(){if(!d.hasAttribute("data-intro-live"))d.removeAttribute("data-intro")},${introTiming.watchdogMs});
}catch(e){}})();`;
