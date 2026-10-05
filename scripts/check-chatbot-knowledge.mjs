import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

// Local browser QA with isolated API fixtures. No knowledge is published to customers.
execFileSync('php', ['scripts/admin_audit_session.php']);
let browser;
const errors = [];
const reports = [];
const origin = process.env.KNOWLEDGE_ORIGIN || 'http://127.0.0.1:8000';
try {
    const session = JSON.parse(await readFile('storage/logs/admin-audit-session.json', 'utf8'));
    browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
    await browser.setCookie({ name: session.name, value: session.value, domain: '127.0.0.1', path: '/', httpOnly: true });
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    let source = { id: 1, title: 'Garantía de prueba', type: 'text', enabled: false, content: 'La garantía cubre fallas de fabricación durante doce meses.', updated_at: '2026-10-05T12:00:00Z' };
    let saved = false;
    await page.setRequestInterception(true);
    page.on('request', async request => {
        if (!request.url().includes('/admin/api/chatbot-knowledge')) return request.continue();
        let body;
        if (request.url().endsWith('/preview')) body = { sources: saved && source.enabled ? [source] : [] };
        else if (request.method() === 'POST') { saved = true; body = { id: 1 }; }
        else if (request.method() === 'PUT') { source = { ...source, ...JSON.parse(request.postData()) }; saved = true; body = { id: 1 }; }
        else if (/\/1$/.test(request.url())) body = source;
        else body = { data: saved ? [source] : [], last_page: 1 };
        await request.respond({ status: request.method() === 'POST' && !request.url().endsWith('/preview') ? 201 : 200, contentType: 'application/json', body: JSON.stringify(body) });
    });
    for (const width of [390, 1440]) {
        await page.setViewport({ width, height: 1000 });
        const response = await page.goto(origin + '/admin/chatbot/conocimiento', { waitUntil: 'domcontentloaded', timeout: 60000 });
        assert.equal(response.status(), 200);
        await page.waitForSelector('.knowledge-page textarea');
        const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
        assert(dimensions.scroll <= dimensions.width + 1, JSON.stringify(dimensions));
        await page.screenshot({ path: `storage/logs/chatbot-knowledge-${width}.png`, fullPage: true });
        reports.push(dimensions);
    }
    await page.type('input[placeholder="Política de garantías y devoluciones"]', source.title);
    await page.type('.knowledge-page textarea', source.content);
    await page.click('.knowledge-page button.is-primary');
    await page.waitForFunction(() => document.querySelector('.knowledge-notice')?.textContent.includes('Borrador guardado'));
    assert.equal(await page.$eval('.knowledge-check input', node => node.checked), false);
    await page.click('.knowledge-check input');
    await page.click('.knowledge-page button.is-primary');
    await page.waitForFunction(() => document.querySelector('.knowledge-notice')?.textContent.includes('activa'));
    await page.type('input[placeholder="¿Qué cubre la garantía de una refrigeradora?"]', 'garantía');
    await page.evaluate(() => [...document.querySelectorAll('button')].find(node => node.textContent === 'Buscar en el conocimiento').click());
    await page.waitForSelector('.knowledge-result');
    assert.match(await page.$eval('.knowledge-result', node => node.textContent), /doce meses/);
    assert.deepEqual(errors, []);
    await writeFile('storage/logs/chatbot-knowledge-browser.json', JSON.stringify({ result: 'OK', mode: 'API fixtures; no business writes', reports, errors }, null, 2));
    console.log('Browser OK: mobile, desktop, draft review, activation and retrieval preview.');
} finally {
    if (browser) await browser.close();
    execFileSync('php', ['scripts/admin_audit_session.php', 'cleanup']);
}
