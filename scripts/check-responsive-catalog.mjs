import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const browser = await puppeteer.launch({ headless: true });
await mkdir('storage/app/private/storefront-qa', { recursive: true });
try {
    const page = await browser.newPage();
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.goto('http://localhost:8000/catalogo', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('.catalogo-product-card');
    for (const width of [240, 320, 390, 460, 768, 1024, 1440]) {
        await page.setViewport({ width, height: 774 });
        await new Promise((resolve) => setTimeout(resolve, 250));
        const sizes = await page.evaluate(() => {
            const rect = (selector) => { const node = document.querySelector(selector); const box = node.getBoundingClientRect(); return { width: box.width, height: box.height, right: box.right, font: getComputedStyle(node).fontSize }; };
            return { viewport: innerWidth, document: document.documentElement.scrollWidth, rootFont: getComputedStyle(document.documentElement).fontSize, header: rect('.efe-header'), search: rect('.efe-header-search'), hamburger: rect('.efe-header-hamburger svg'), input: rect('#main-search-input') };
        });
        console.log(JSON.stringify({ width, ...sizes }));
        assert(sizes.document <= width, `Overflow at ${width}`);
        assert(sizes.search.right <= width + 1, `Search clipped at ${width}`);
        assert(sizes.header.height < 180, `Header oversized at ${width}`);
        if (width === 460) await page.screenshot({ path: 'storage/app/private/storefront-qa/catalog-460.png' });
    }
} finally { await browser.close(); }
