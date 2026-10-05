import puppeteer from 'puppeteer';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const origin = 'http://127.0.0.1:8000';
const session = JSON.parse(await readFile('storage/logs/admin-audit-session.json', 'utf8'));
const routes = ['/admin', '/admin?q=cliente', '/admin/products', '/admin/categorias', '/admin/pedidos', '/admin/clientes', '/admin/trabajadores', '/admin/roles', '/admin/ajustes', '/admin/almacenes', '/admin/inventario', '/admin/compras', '/admin/proveedores', '/admin/gastos', '/admin/pos', '/admin/pos/historial', '/admin/crm/pipeline', '/admin/crm/tasks', '/admin/crm/companies', '/admin/crm/calendar', '/admin/rma', '/admin/marketing/campaigns', '/admin/inbox'];
let browser;
const results = [];
try {
    browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
    await browser.setCookie({ name: session.name, value: session.value, domain: '127.0.0.1', path: '/', httpOnly: true });
    let page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    let errors = [];
    let failedAssets = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text().slice(0, 300)); });
    page.on('requestfailed', req => { if (['script', 'stylesheet'].includes(req.resourceType())) failedAssets.push({ url: req.url(), error: req.failure()?.errorText }); });
    for (const route of routes) {
        await page.close();
        page = await browser.newPage();
        await page.setViewport({ width: 1440, height: 1000 });
        page.on('pageerror', e => errors.push(e.message));
        page.on('console', msg => { if (msg.type() === 'error' && !msg.text().includes('404 (Not Found)')) errors.push(msg.text().slice(0, 300)); });
        page.on('requestfailed', req => { if (['script', 'stylesheet'].includes(req.resourceType())) failedAssets.push({ url: req.url(), error: req.failure()?.errorText }); });
        errors = [];
        failedAssets = [];
        let response;
        try {
            response = await page.goto(origin + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
        } catch (e) {
            results.push({ route, status: 0, rendered: false, errors: [e.message] });
            console.log(JSON.stringify(results.at(-1)));
            continue;
        }
        await page.waitForFunction(() => document.body.innerText.length > 150, { timeout: 20000 }).catch(() => {});
        const text = await page.evaluate(() => document.body.innerText);
        const row = { route, status: response.status(), url: page.url(), rendered: text.length > 150 && !text.includes('Algo salió mal en React'), errors: [...errors], failedAssets: [...failedAssets] };
        results.push(row);
        console.log(JSON.stringify(row));
        if (!row.rendered) {
            await page.screenshot({ path: 'storage/logs/admin-render-failure.png', fullPage: true });
            break;
        }
    }
    await page.goto(origin + '/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.innerText.length > 150, { timeout: 20000 }).catch(() => {});
    await page.setViewport({ width: 390, height: 844 });
    await page.screenshot({ path: 'storage/logs/admin-mobile-audit.png', fullPage: true });
    results.push({ route: '/admin (mobile)', overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2) });
    await writeFile('storage/logs/admin-browser-audit.json', JSON.stringify(results, null, 2));
    if (results.some(r => r.errors?.length || r.status && r.status !== 200 || r.url?.includes('/admin/login') || r.rendered === false)) process.exitCode = 1;
} finally {
    if (browser) await browser.close();
    execFileSync('php', ['scripts/admin_audit_session.php', 'cleanup']);
}
