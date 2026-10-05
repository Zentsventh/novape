import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';

const base = process.argv[2] || 'http://localhost:8000';
const key = 'novape.location.v1';
const browser = await puppeteer.launch({ headless: true });
const errors = [];
const expected = { departamento: 'Lima', provincia: 'Lima', distrito: 'Los Olivos' };
async function ready(page, path = '') {
    await page.bringToFront();
    await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('.efe-nav-location-btn');
}
async function newPage() {
    const page = await browser.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.setRequestInterception(true);
    page.on('request', (request) => ['image', 'media', 'font'].includes(request.resourceType()) ? request.abort() : request.continue());
    return page;
}
async function label(page, text) {
    await page.bringToFront();
    await page.waitForFunction((value) => document.querySelector('.efe-nav-location-btn')?.textContent.includes(value), { polling: 100 }, text);
}
async function select(page, values) {
    await page.bringToFront();
    await page.evaluate(() => window.dispatchEvent(new Event('open-location-modal')));
    await page.waitForSelector('.loc-form-group input');
    const inputs = await page.$$('.loc-form-group input');
    for (let index = 0; index < inputs.length; index++) {
        await inputs[index].focus();
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
        await page.keyboard.press('Backspace');
        await inputs[index].type(values[index]);
    }
    const responsePromise = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/shipping/calculate' && response.request().method() === 'POST');
    await page.click('.loc-continue-btn');
    const response = await responsePromise;
    assert.equal(response.status(), 200, 'Shipping request must pass address validation');
    assert.deepEqual(JSON.parse(response.request().postData()).address, Object.fromEntries(['departamento', 'provincia', 'distrito'].map((field, index) => [field, values[index].trim()])));
}
try {
    const page = await newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await ready(page);
    await label(page, 'Ingresa tu ubicación');
    await select(page, [' Lima ', ' Lima ', ' Los Olivos ']);
    console.log('Saved location and validated shipping request');
    await label(page, 'Los Olivos, Lima');
    assert.deepEqual(await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey)), key), expected);
    await ready(page);
    await label(page, 'Los Olivos, Lima');
    await page.evaluate(() => window.dispatchEvent(new Event('open-location-modal')));
    await page.waitForSelector('.loc-form-group input');
    assert.deepEqual(await page.$$eval('.loc-form-group input', (inputs) => inputs.map((input) => input.value)), Object.values(expected));
    await page.click('.loc-modal-close');
    await ready(page, '/catalogo');
    await label(page, 'Los Olivos, Lima');
    console.log('Reload, prefilled form and catalog navigation passed');
    const other = await newPage();
    await ready(other);
    await label(other, 'Los Olivos, Lima');
    await select(page, ['Lima', 'Lima', 'Miraflores']);
    await label(other, 'Miraflores, Lima');
    await other.evaluate((storageKey) => localStorage.setItem(storageKey, '{invalid'), key);
    await ready(other);
    await label(other, 'Ingresa tu ubicación');
    assert.deepEqual(errors, [], 'No browser runtime errors');
    console.log('OK: save, reload, navigation, prefilled form, tab synchronization and invalid storage recovery');
} catch (error) {
    console.error(error);
    process.exitCode = 1;
} finally {
    await browser.close();
}
