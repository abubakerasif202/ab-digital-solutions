import {
  OPENING_INTRO_ATTRIBUTE,
  OPENING_INTRO_LIVE_ATTRIBUTE,
  OPENING_INTRO_SEEN_KEY,
  openingIntroTiming,
} from "./opening-intro-config";

/**
 * Inline gate, run before first paint. It only ever ENABLES the intro (sets the attribute on <html>), so
 * no-script visitors, crawlers that do not execute scripts and every repeat visit see the page untouched.
 * It is ES5 on purpose: it ships as inline HTML and must not depend on the bundler.
 *
 * It declines on: any route but "/", a hash link, bots and automation (Lighthouse, headless, webdriver),
 * back/forward navigation, reduced motion, data-saver or slow connections (the film is 0.5-1.3 MB), a hidden
 * or prerendering tab, an already-seen session, and any storage failure.
 */
export const openingIntroGateScript = `(function(){try{
var d=document.documentElement,w=window,n=navigator;
if(location.pathname!=="/"||location.hash)return;
if(n.webdriver||/googlebot|bingbot|adsbot|duckduckbot|baiduspider|yandex|(^|[^a-z])bot[^a-z]|crawl|spider|slurp|lighthouse|headless|prerender/i.test(n.userAgent||""))return;
if(document.visibilityState==="hidden"||document.prerendering)return;
var h=w.performance&&performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];
if(h&&h.type==="back_forward")return;
if(w.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
var c=n.connection;
if(c&&(c.saveData||/(^|-)[23]g$/.test(c.effectiveType||"")||(c.downlink&&c.downlink<2.5)))return;
var s=w.sessionStorage;
if(s.getItem("${OPENING_INTRO_SEEN_KEY}"))return;
s.setItem("${OPENING_INTRO_SEEN_KEY}","1");
d.setAttribute("${OPENING_INTRO_ATTRIBUTE}","on");
setTimeout(function(){if(d.getAttribute("${OPENING_INTRO_ATTRIBUTE}")==="on"&&!d.hasAttribute("${OPENING_INTRO_LIVE_ATTRIBUTE}"))d.removeAttribute("${OPENING_INTRO_ATTRIBUTE}")},${openingIntroTiming.watchdogMs});
}catch(e){}})();`;
