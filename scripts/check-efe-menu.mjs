import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
const taxonomy = JSON.parse(await readFile('database/seed-data/efe-taxonomy.json', 'utf8'));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
await mkdir('storage/app/private/storefront-qa', { recursive: true });
const errors = [];
try {
    const page = await browser.newPage();
    let blockImages = true;
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        const local = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(request.url()).hostname);
        return !local || ['font', 'media'].includes(request.resourceType()) || (blockImages && request.resourceType() === 'image') ? request.abort() : request.continue();
    });
    page.on('requestfailed', request => { if (['script', 'stylesheet', 'document'].includes(request.resourceType())) console.error('Asset failure:', request.url(), request.failure()?.errorText); });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => { if (response.status() >= 500) console.error('HTTP', response.status(), response.url()); });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    const response = await page.goto('http://127.0.0.1:8000/catalogo', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const source = await response.text();
    await page.waitForSelector('.efe-cat-nav-item');
    const props = await page.evaluate((html) => {
        const document = new DOMParser().parseFromString(html, 'text/html');
        const data = document.querySelector('script[data-page="app"]')?.textContent
            || document.querySelector('#app').getAttribute('data-page');
        return JSON.parse(data).props;
    }, source);
    assert.deepEqual(props.categorias.map((category) => category.nombre), taxonomy.categories.map((category) => category.name));
    const technology = props.categorias.find((category) => category.nombre === 'Tecnología');
    assert(technology.subcategorias.some((group) => group.nombre === 'Celulares' && group.subcategorias.length === 8));
    for (const width of [320, 390, 768, 1024, 1440]) {
        await page.setViewport({ width, height: 900 });
        await page.evaluate((id) => {
            window.dispatchEvent(new CustomEvent('select-store-category', { detail: { id } }));
            window.dispatchEvent(new Event('open-categories'));
        }, technology.id);
        await page.waitForSelector('.cat-menu-group');
        await page.waitForFunction(() => document.querySelector('.cat-detail-heading h3')?.textContent === 'Tecnología');
        const menu = await page.evaluate(() => ({
            roots: document.querySelectorAll('.efe-cat-drawer-item').length,
            groups: document.querySelectorAll('.cat-menu-group').length,
            leaves: document.querySelectorAll('.cat-menu-leaves a').length,
            right: document.querySelector('.efe-cat-drawer-right').getBoundingClientRect().right,
            overflow: document.documentElement.scrollWidth > innerWidth,
            invalidLinks: [...document.querySelectorAll('.cat-menu-leaves a')].some((link) => !new URL(link.href).searchParams.get('categoria_id')),
        }));
        assert.equal(menu.roots, 21);
        assert.equal(menu.groups, technology.subcategorias.length);
        assert.equal(menu.leaves, technology.subcategorias.reduce((sum, group) => sum + group.subcategorias.length, 0));
        assert(menu.right <= width + 1 && !menu.overflow && !menu.invalidLinks);
        if (width === 390 || width === 1440) await page.screenshot({ path: `storage/app/private/storefront-qa/efe-menu-${width}.png` });
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
        console.log(JSON.stringify({ width, ...menu, result: 'OK' }));
    }
    blockImages = false;
    await page.setViewport({ width: 390, height: 900 });
    await page.goto(`http://127.0.0.1:8000/producto/${props.productos.data[0].slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('.premium-thumb');
    await page.waitForFunction(() => [...document.querySelectorAll('.premium-thumb')].every((image) => image.complete && image.naturalWidth > 0)).catch(async error => {
        console.error('Gallery state:', await page.$$eval('.premium-thumb', images => images.map(image => ({src: image.src, complete: image.complete, width: image.naturalWidth}))));
        throw error;
    });
    const photos = await page.$$eval('.premium-thumb', (images) => images.map((image) => image.src));
    assert(new Set(photos).size >= 3 && photos.every((url) => url.includes('/storage/productos/')));
    await page.click('.premium-thumb:last-child');
    await page.waitForFunction((selected) => document.querySelector('.premium-main-img img')?.src === selected, {}, photos.at(-1));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    console.log(JSON.stringify({ galleryImages: photos.length, localImages: true, thumbnailSelection: 'OK' }));
    assert.deepEqual(errors, []);
} catch (error) {
    console.error('Runtime errors:', errors);
    console.error(error);
    process.exitCode = 1;
} finally { await browser.close(); }
