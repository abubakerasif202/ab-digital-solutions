import { readFileSync, writeFileSync } from 'node:fs';
const source = readFileSync('app/project-data.ts','utf8');
const slugs = [...source.matchAll(/slug: "([a-z0-9-]+)"/g)].map(m=>m[1]);
const results = [];
for (const slug of slugs) {
 const response = await fetch(`http://localhost:3113/work/${slug}`);
 const html = await response.text();
 const result = {slug,status:response.status,h1:(html.match(/<h1[ >]/g)||[]).length};
 if(result.status!==200 || result.h1!==1) throw new Error(JSON.stringify(result));
 results.push(result);
}
writeFileSync('qa/wild-pest-solutions/route-smoke.json',JSON.stringify(results,null,2));
console.log(`${results.length} case-study routes passed`);
