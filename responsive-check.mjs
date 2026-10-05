import puppeteer from 'puppeteer';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const html=await (await fetch('http://127.0.0.1:8010/catalogo',{signal:AbortSignal.timeout(10000)})).text();
const server=createServer(async(req,res)=>{
 try {
 res.setHeader('Access-Control-Allow-Origin','*');
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/') {res.setHeader('Content-Type','text/html');res.end(html.replaceAll('http://127.0.0.1:8010','http://127.0.0.1:8011'));return;}
 if(url.pathname.startsWith('/build/')||url.pathname.startsWith('/images/')) {
 let body=await readFile('public'+decodeURIComponent(url.pathname));
 const ext=url.pathname.split('.').pop();res.setHeader('Content-Type',({js:'application/javascript',css:'text/css',png:'image/png',jpg:'image/jpeg',svg:'image/svg+xml',webp:'image/webp'})[ext]||'application/octet-stream');
 if(ext==='css')body=body.toString().replace(/@import[^;]+;/g,'');res.end(body);return;
 }
 res.setHeader('Content-Type','application/json');res.end('{}');
 }catch {res.statusCode=404;res.end();}
});
await new Promise(r=>server.listen(8011,'127.0.0.1',r));
console.log('server ready');
const browser=await puppeteer.launch({headless:true,timeout:20000});
try {
const page=await browser.newPage();page.on('console',async msg=>{if(msg.type()==='error')for(const arg of msg.args()){const stack=await arg.evaluate(v=>v?.stack).catch(()=>null);if(stack)console.log(stack);}});page.on('pageerror',e=>console.log('ERROR',e.message));
await page.setViewport({width:320,height:740});
await page.setRequestInterception(true);
page.on('request', async req => {
 try {
 const u=new URL(req.url());
 if(u.pathname==='/') {await req.respond({status:200,contentType:'text/html; charset=utf-8',body:html.replaceAll('http://127.0.0.1:8010','http://127.0.0.1:8011')});return;}
 if(u.pathname.startsWith('/build/')||u.pathname.startsWith('/images/')) {
 let body=await readFile('public'+decodeURIComponent(u.pathname));
 const ext=u.pathname.split('.').pop();
 if(ext==='css')body=body.toString().replace(/@import[^;]+;/g,'');
 await req.respond({status:200,contentType:({js:'application/javascript',css:'text/css',png:'image/png',svg:'image/svg+xml',webp:'image/webp'})[ext]||'image/jpeg',body});return;
 }
 await req.respond({status:200,contentType:u.hostname.includes('fonts')?'text/css':'application/json',body:u.hostname.includes('fonts')?'':'{}'});
 }catch {await req.respond({status:404,body:''});}
});
await page.goto('http://127.0.0.1:8011/',{waitUntil:'domcontentloaded',timeout:20000});
await page.waitForSelector('.storefront',{timeout:20000});
console.log(await page.evaluate(()=>({width:document.documentElement.scrollWidth,text:document.body.innerText.slice(0,100),links:[...document.querySelectorAll('a[href*="producto"]')].slice(0,2).map(a=>a.getAttribute('href'))})));
await page.screenshot({path:'responsive-home-320.png',fullPage:true});
}finally{await browser.close();server.close();}

