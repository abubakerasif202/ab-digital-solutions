import puppeteer from "puppeteer";
import { mkdir, writeFile, readFile } from "node:fs/promises";
const base = process.env.QA_BASE_URL || "http://localhost:3101";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Local QA only.");
const output = "test-results/hero-2/browser";
await mkdir(output, { recursive: true });
const report = { base, checks: [], errors: [], consoleErrors: [], resources: [] };
let contactStatus = 503;
let contactRequests = 0;
const check = (name, pass, detail) => { report.checks.push({ name, pass, detail }); if (!pass) console.error(name, detail); };
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({headless:true,args:["--enable-unsafe-swiftshader", "--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4"]});
try {
 const page = await browser.newPage();
 page.on("pageerror", e => report.errors.push(e.message));
 page.on("console", m => { if(m.type()==="error" && !/503|429/.test(m.text())) report.consoleErrors.push(m.text()); });
 await page.setRequestInterception(true);
 page.on("request", req => {
   const u = new URL(req.url());
   if (u.pathname === "/api/contact") {
    contactRequests++;
    return void wait(300).then(()=>req.respond({status:contactStatus,contentType:"application/json",body:JSON.stringify(contactStatus===200?{ok:true}:{error:contactStatus===429?"Too many enquiries. Please wait.":"Fixture unavailable. Please email the studio."})}));
   }
   if (u.pathname === "/api/analytics") return void req.respond({status:204});
   if (u.pathname.startsWith("/_vercel/")) return void req.respond({status:200,contentType:"application/javascript",body:""});
   void req.continue();
 });
 await page.evaluateOnNewDocument(() => {
  Object.defineProperty(navigator,"hardwareConcurrency",{get:()=>8});
  Object.defineProperty(navigator,"deviceMemory",{get:()=>8});
  window.draws=0;
  for(const C of [WebGLRenderingContext,WebGL2RenderingContext]) for(const method of ["drawArrays","drawElements"]) {
   const original=C.prototype[method]; C.prototype[method]=function(...args){window.draws++;return original.apply(this,args);};
  }
 });
 for(const width of [320,375,390,430,768,1024,1440,1920]) {
  await page.setViewport({width,height:width<768?844:1000,deviceScaleFactor:1});
  for(const route of ["/","/services","/work","/about","/contact"]) {
   const response=await page.goto(base+route,{waitUntil:"networkidle0"});
   await page.evaluate(()=>document.fonts.ready);
   const layout=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth,h1:document.querySelector("h1")?.getBoundingClientRect().toJSON(),badImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)}));
   check(`${width} ${route} layout`,[200,304].includes(response.status())&&layout.scroll<=width+1&&layout.badImages.length===0,layout);
   if(route==="/") {
    check(`${width} no initial film`,await page.$("video")===null);
    check(`${width} initial hero static`,await page.$(".hero-3d-container canvas")===null);
    await page.screenshot({path:`${output}/home-${width}.png`});
   } else if(width===390||width===1440) await page.screenshot({path:`${output}/${route.slice(1)}-${width}.png`});
  }
 }
 await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
 await page.goto(base,{waitUntil:"networkidle0"});
 const bounds=await page.$eval(".stage-hero-art",e=>e.getBoundingClientRect().toJSON());
 await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
 await page.waitForSelector('.hero-3d-container[data-render-ready="true"]',{timeout:15000});
 await wait(1200);
 check("desktop single hero WebGL canvas",await page.$$eval(".stage-hero-art canvas",els=>els.length)===1);
 await page.screenshot({path:`${output}/hero-assembly.png`});
 await wait(6500);
 const settled=await page.evaluate(()=>window.draws);await wait(750);
 check("hero rests without ongoing draw loop",settled===await page.evaluate(()=>window.draws),{settled,after:await page.evaluate(()=>window.draws)});
 check("hero stores session completion",await page.evaluate(()=>sessionStorage.getItem("ab-logo-reveal-seen"))==="1");
 await page.screenshot({path:`${output}/hero-settled.png`});
 const button = await page.$eval('.hero-actions .button', e=>e.getBoundingClientRect().toJSON());
 await page.mouse.move(button.x+button.width*0.8,button.y+button.height/2);
 await wait(300);
 check("magnetic icon keeps button hit area fixed",await page.$eval('.hero-actions .button',(e,b)=>{
   const now=e.getBoundingClientRect();
   return Math.abs(now.x-b.x)<1&&Math.abs(now.width-b.width)<1&&parseFloat(e.style.getPropertyValue("--magnet-x"))>0;
 },button));
 await page.$eval("#film",e=>e.scrollIntoView({behavior:"instant"}));await wait(700);
 const before=await page.evaluate(()=>window.draws);await wait(700);
 check("offscreen hero stops rendering",before===await page.evaluate(()=>window.draws));
 await page.click(".film-big-play");
 await page.waitForFunction(()=>document.querySelector("video")?.currentTime>0.2,{timeout:20000});
 check("film plays after explicit click",await page.$eval("video",v=>!v.paused&&v.videoWidth>0));
 await page.click('.film-chapters li:nth-child(3) button');await wait(400);
 check("film chapter seek",await page.$eval("video",v=>v.currentTime>=10));
 await page.evaluate(()=>scrollTo({top:0,behavior:"instant"}));await wait(600);
 check("film pauses when offscreen",await page.$eval("video",v=>v.paused));
 await page.emulateMediaFeatures([{name:"prefers-reduced-motion",value:"reduce"}]);await wait(400);
 check("reduced motion releases WebGL",await page.$(".hero-3d-container canvas")===null);
 await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
 await page.goto(base,{waitUntil:"networkidle0"});await page.mouse.move(200,200);await wait(800);
 check("phone and reduced motion remain static",await page.$(".hero-3d-container canvas")===null);
 report.resources=await page.evaluate(()=>performance.getEntriesByType("resource").map(e=>({url:e.name,bytes:e.transferSize,type:e.initiatorType})));
 check("no mobile particle data or Three download",!report.resources.some(r=>r.url.includes("logo-particles")));
 const axe=await readFile("node_modules/axe-core/axe.min.js","utf8");await page.addScriptTag({content:axe});
 const accessibility=await page.evaluate(()=>window.axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa"]}}));
 check("mobile axe accessibility",accessibility.violations.length===0,accessibility.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
 await page.goto(base+"/contact",{waitUntil:"networkidle0"});
 await page.type('[name="fullName"]',"QA fixture");
 await page.type('[name="email"]',"qa@example.test");
 await page.type('[name="message"]',"Local mocked enquiry; never delivered.");
 for(const status of [503,429,200]) {
  contactStatus=status;
  const before=contactRequests;
  await page.$eval('button[type="submit"]',e=>e.click());
  await wait(50);
  check(`contact ${status} prevents repeat submission`,await page.$eval('button[type="submit"]',e=>e.disabled));
  await page.$eval('form',e=>e.requestSubmit());
  await wait(450);
  check(`contact ${status} one request`,contactRequests===before+1);
  check(`contact ${status} honest UI`,await page.$eval('form',e=>e.dataset.state)===(status===200?"success":"error"));
 }
 check("no browser exceptions",report.errors.length===0,report.errors);
 check("no unexpected console errors",report.consoleErrors.length===0,report.consoleErrors);
} finally {
 await browser.close();
 await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));
}
console.log(JSON.stringify({checks:report.checks.length,failed:report.checks.filter(c=>!c.pass),errors:report.errors}));
if(report.checks.some(c=>!c.pass)||report.errors.length)process.exitCode=1;
