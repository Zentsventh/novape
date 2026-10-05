import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const url = process.argv[2] || 'http://localhost:8000';
await mkdir('storage/app/private/storefront-qa', { recursive: true });
const browser = await puppeteer.launch({ headless: true });
const errors = [];
try {
    for (const width of [320, 390, 768, 1440, 1920]) {
        const page = await browser.newPage();
        page.on('pageerror', (error) => errors.push(error.message));
        await page.setViewport({ width, height: 900 });
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForSelector('.efe-cat-nav-item', { timeout: 30000 });
        await page.waitForFunction(() => document.querySelector('.efe-hero-slide img')?.complete);
        const home = await page.evaluate(() => ({
            width: document.documentElement.scrollWidth,
            banners: document.querySelectorAll('.efe-hero-slide').length,
            bannerLoaded: document.querySelector('.efe-hero-slide img').naturalWidth > 0,
            mobileBanner: document.querySelector('.efe-hero-slide img').currentSrc.includes('-mobile'),
            labelsFit: [...document.querySelectorAll('.efe-cat-nav-item')].every((item) => item.scrollWidth <= item.clientWidth + 1),
        }));
        assert(home.width <= width, `Page overflow at ${width}: ${home.width}`);
        assert.equal(home.banners, 5);
        assert(home.bannerLoaded);
        assert(home.labelsFit, `Category labels clipped at ${width}`);
        assert.equal(home.mobileBanner, width < 768);
        await page.evaluate(() => [...document.querySelectorAll('.efe-cat-nav-item')].find((button) => button.textContent.trim() === 'Tecnolog\u00eda').click());
        await page.waitForSelector('[role="dialog"]');
        await page.waitForFunction(() => document.querySelector('.cat-detail-heading h3')?.textContent === 'Tecnolog\u00eda');
        const menu = await page.evaluate(() => {
            const dialog = document.querySelector('[role="dialog"]');
            const detail = document.querySelector('.efe-cat-drawer-right').getBoundingClientRect();
            return { title: document.querySelector('.cat-detail-heading h3').textContent, subcategories: document.querySelectorAll('.cat-subcategory-link').length, brands: document.querySelectorAll('.cat-brand-link').length, width: dialog.getBoundingClientRect().width, right: detail.right, links: [...document.querySelectorAll('.cat-subcategory-link,.cat-brand-link')].map((a) => a.href) };
        });
        assert(menu.subcategories > 0 && menu.brands > 0, `Empty technology menu at ${width}`);
        assert(menu.width <= width && menu.right <= width + 1, `Menu overflow at ${width}`);
        if (width === 390 || width === 1440) await page.screenshot({ path: `storage/app/private/storefront-qa/menu-${width}.png` });
        if (width < 1024) {
            await page.click('.cat-back-button');
            await page.waitForFunction(() => !document.querySelector('.efe-cat-drawer').classList.contains('show-right'));
            await page.click('.efe-cat-drawer-item');
        }
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
        assert.equal(await page.evaluate(() => document.body.style.overflow), '');
        // Visit a real subcategory and brand filter, checking that both return products.
        if (width === 1440) {
            for (const link of [menu.links[0], menu.links.at(-1)]) {
                await page.goto(link, { waitUntil: 'domcontentloaded' });
                await page.waitForSelector('.catalogo-product-card', { timeout: 30000 });
            }
        }
        console.log(JSON.stringify({ viewport: width, ...home, subcategories: menu.subcategories, brands: menu.brands, result: 'OK' }));
        await page.close();
    }
    assert.deepEqual(errors, []);
} finally {
    await browser.close();
}
