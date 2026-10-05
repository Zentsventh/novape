// Read-only layout regression. Uses local compiled assets and synthetic customer data.
// Run after npm run build: node tests/browser/storefront-responsive.mjs [base URL]
import puppeteer from 'puppeteer';
import {createServer} from 'node:http';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const base = process.argv[2] || 'http://127.0.0.1:8010';
const output = new URL('../../storage/app/responsive-qa/', import.meta.url);
await mkdir(output, {recursive:true});
const getHtml = async path => (await fetch(base + path, {signal:AbortSignal.timeout(20000)})).text();
const home = await getHtml('/');
const pattern = /(<script[^>]*data-page="app"[^>]*>)([\s\S]*?)(<\/script>)/;
const initial = JSON.parse(home.match(pattern)[2]);
const product = initial.props.mejorSemana[0];
const item = {id:product.id,nombre:product.nombre+' / Modelo con nombre largo para verificar el ajuste',precio:1499.9,cantidad:2,imagen:product.imagen,marca:'NovaPe',codigo:'SKU-123456789012345678901234567890'};
const fixture = (component, extra={}) => home.replace(pattern, (_,a,b,c)=>a+JSON.stringify({...initial,component,props:{...initial.props,...extra}}).replaceAll('<','\\u003c')+c);
const pages=[];
for(const path of ['/', '/catalogo', `/producto/${product.slug}`, '/seguimiento', '/login', '/libro-de-reclamaciones']) pages.push([path,await getHtml(path)]);
pages.push(['Cart',fixture('Cart',{cart:{items:[item],count:2,total:2999.8}})]);
pages.push(['Checkout',fixture('Checkout',{cart:[item],total:2999.8})]);
pages.push(['Profile',fixture('Auth/Profile',{usuario:{nombres:'Cliente',email:'cliente@example.test'},pedidos:[],direcciones:[],tarjetas:[],listas:[],sesiones:[]})]);
for(const component of ['Wishlist','Comparador','Auth/Register','CheckoutError','InfoPage','Perfil/Devoluciones','Auth/Rma/Index']) pages.push([component,fixture(component,{rmas:[]})]);
const server=createServer((req,res)=>{res.end('');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await puppeteer.launch({headless:true,timeout:20000});
const results=[]; const errors=[];
try {
 for(const [name,currentHtml] of pages.filter(([name])=>!process.env.QA_PAGE || name===process.env.QA_PAGE)) {
 const page=await browser.newPage();
 page.on('console',async msg=>{if(msg.type()==='error' && !msg.text().includes('WebSocket')) {console.log('Console:',msg.text().slice(0,160));for(const arg of msg.args()){const stack=await arg.evaluate(v=>v?.stack).catch(()=>null);if(stack)console.log(stack);}}});
 page.on('pageerror',e=>{errors.push(e.message);console.log('Page error',e.message);});
 await page.setRequestInterception(true);
 page.on('request',async req=>{
  try {
   const u=new URL(req.url());
   // Animation frames do not affect layout; keep the matrix's memory bounded.
   if(req.isNavigationRequest()) {await req.respond({status:200,contentType:'text/html; charset=utf-8',body:currentHtml.replaceAll(base,origin)});return;}
   if(u.pathname.startsWith('/build/')||u.pathname.startsWith('/images/')||u.pathname.startsWith('/storage/')) {
    const ext=u.pathname.split('.').pop();
    let body=await readFile(new URL('../../public'+decodeURIComponent(u.pathname),import.meta.url));
    if(ext==='css') body=body.toString().replace(/@import[^;]+;/g,'');
    await req.respond({status:200,contentType:({js:'application/javascript',css:'text/css',png:'image/png',svg:'image/svg+xml',webp:'image/webp'})[ext]||'image/jpeg',body});return;
   }
   await req.respond({status:200,contentType:u.hostname.includes('fonts')?'text/css':'application/json',body:u.hostname.includes('fonts')?'':u.pathname.includes('wishlist')?'[]':'{}'});
  }catch{await req.respond({status:404,body:''});}
 });

  await page.setViewport({width:320,height:740});
  console.log('Checking',name);
  await page.goto(origin+JSON.parse(currentHtml.match(pattern)[2]).url,{waitUntil:'domcontentloaded',timeout:15000}).catch(e=>console.log('Navigation:',e.message));
  await page.waitForSelector('.storefront',{timeout:10000}).catch(async e=>{console.log((await page.evaluate(()=>document.body.innerText)).slice(0,2500));throw e;});
  // Disable animation during measurement, so entrance effects don't hide regressions.
  await page.addStyleTag({content:'.storefront *, .storefront *::before, .storefront *::after {animation:none !important; transition:none !important;}'});
  for(const [width,height] of [[320,740],[375,812],[768,1024],[1024,768],[1366,900],[1920,1080],[667,375]]) {
   await page.setViewport({width,height});
   await new Promise(r=>setTimeout(r,350));
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const result=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,columns:document.querySelector('.catalogo-grid')?getComputedStyle(document.querySelector('.catalogo-grid')).gridTemplateColumns:null,overflow:[...document.querySelectorAll('.storefront main,.storefront form,.storefront input,.storefront select,.storefront .efe-checkout-container,.storefront .catalogo-main')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0 && (r.right>innerWidth+1||r.left< -1)}).map(el=>el.className||el.tagName)}));
   results.push({page:name,height,...result});
   if(width===320 && ['Cart','/catalogo','Checkout'].includes(name)) await page.screenshot({path:new URL(name.replaceAll('/','')+'-320.png',output).pathname.replace(/^\/(\w:)/,'$1')});
  }
  await page.close();
  console.log(name,results.slice(-7).filter(r=>r.scrollWidth>r.width+1||r.overflow.length).map(r=>({width:r.width,overflow:r.overflow,scroll:r.scrollWidth})));
 }
 await writeFile(new URL('results.json',output),JSON.stringify({results,errors},null,2));
 assert.equal(errors.length,0,errors.join('\n'));
 assert.equal(results.filter(r=>r.scrollWidth>r.width+1||r.overflow.length).length,0,'Layout overflow; inspect storage/app/responsive-qa/results.json');
 console.log(`PASS: ${results.length} page/viewport checks`);
}finally{await browser.close();server.close();}
