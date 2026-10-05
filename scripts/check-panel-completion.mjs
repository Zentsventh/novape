import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

// Local, read-only interaction and bounded concurrency check. No forms are submitted.
const origin = 'http://127.0.0.1:8000';
execFileSync('php', ['scripts/admin_audit_session.php']);
const session = JSON.parse(await readFile('storage/logs/admin-audit-session.json', 'utf8'));
let browser;
const errors = [];
try {
    browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
    await browser.setCookie({ name: session.name, value: session.value, domain: '127.0.0.1', path: '/', httpOnly: true });
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(origin + '/admin/compras', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[aria-label="Buscar producto comprado"]');
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.innerText.includes('Nueva Orden')).click());
    const line = 'input[aria-label="Buscar producto de la línea 1"]';
    await page.waitForSelector(line);
    await page.waitForFunction(() => [...document.querySelectorAll('select')].some(select => select.options.length > 20));
    const input = await page.$(line);
    await input.type('Samsung');
    await page.waitForFunction(() => {
        const input = document.querySelector('input[aria-label="Buscar producto de la línea 1"]');
        const select = input.parentElement.querySelector('select');
        return select.options.length > 1 && select.getAttribute('aria-busy') === 'false' && [...select.options].slice(1).every(option => /samsung/i.test(option.textContent));
    });
    const purchase = await page.evaluate(() => {
        const select = document.querySelector('input[aria-label="Buscar producto de la línea 1"]').parentElement.querySelector('select');
        return { options: select.options.length - 1, unique: new Set([...select.options].slice(1).map(option => option.value)).size };
    });
    assert.equal(purchase.options, purchase.unique);
    assert(purchase.options <= 30);
    await page.select(await page.evaluate(() => '#' + CSS.escape(document.querySelector('input[aria-label="Buscar producto de la línea 1"]').parentElement.querySelector('select').id)), await page.evaluate(() => document.querySelector('input[aria-label="Buscar producto de la línea 1"]').parentElement.querySelector('select').options[1].value));
    assert.equal(await page.$eval('input[type="number"][step="0.01"]', node => node.value), '');

    await page.goto(origin + '/admin/almacenes', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.innerText.includes('Transferir')));
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.innerText.includes('Transferir')).click());
    await page.waitForSelector('input[aria-label="Buscar producto a transferir"]');
    await page.goto(origin + '/admin/crm/pipeline', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.innerText.includes('Nueva Oportunidad')));
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.innerText.includes('Nueva Oportunidad')).click());
    await page.waitForSelector('input[aria-label="Buscar contacto asociado"]');
    await page.waitForSelector('input[aria-label="Buscar empresa asociada"]');

    // Three concurrent local HTTP reads, six rounds, using existing data and normal middleware.
    const paths = ['/admin/compras', '/admin/almacenes', '/admin/crm/pipeline', '/admin/selectores/variantes?q=Samsung', '/admin/crm/selectores/contactos', '/admin/crm/selectores/empresas'];
    const load = await page.evaluate(async paths => {
        const samples = [];
        for (let round = 0; round < 6; round++) {
            await Promise.all(Array.from({length: 3}, async (_, index) => {
                const path = paths[(round * 3 + index) % paths.length];
                const start = performance.now();
                const response = await fetch(path, { headers: { 'Accept': path.includes('selectores') ? 'application/json' : 'text/html' } });
                const body = await response.text();
                samples.push({ path, status: response.status, ms: Math.round(performance.now() - start), bytes: new TextEncoder().encode(body).length });
            }));
        }
        return samples;
    }, paths);
    assert(load.every(row => row.status === 200), JSON.stringify(load.filter(row => row.status !== 200)));
    const report = { environment: 'local PHP development server; reads only; concurrency 3; 18 requests', purchase, errors, load };
    report.routes = paths.map(path => {
        const rows = load.filter(row => row.path === path).sort((a, b) => a.ms - b.ms);
        return { path, samples: rows.length, p95_ms: rows[Math.ceil(rows.length * .95) - 1].ms, max_bytes: Math.max(...rows.map(row => row.bytes)) };
    });
    await writeFile('storage/logs/panel-completion-browser.json', JSON.stringify(report, null, 2));
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ purchase, routes: report.routes, result: 'OK' }, null, 2));
} finally {
    if (browser) await browser.close();
    execFileSync('php', ['scripts/admin_audit_session.php', 'cleanup']);
}
