import { INTRO_SEEN_KEY, introTiming } from "./intro-config";

// Static gate: no video preloads, scroll locks or hidden page content.
export const introGateScript = `(function(){try{
var d=document.documentElement;
if(location.pathname!=="/"||location.hash)return;
if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
if(matchMedia("(pointer: coarse)").matches)return;
if(navigator.connection&&navigator.connection.saveData)return;
var s=window.sessionStorage;if(s.getItem("${INTRO_SEEN_KEY}"))return;
s.setItem("${INTRO_SEEN_KEY}","1");
d.setAttribute("data-intro","playing");
setTimeout(function(){if(!d.hasAttribute("data-intro-live"))d.removeAttribute("data-intro")},${introTiming.watchdogMs});
}catch(e){}})();`;
