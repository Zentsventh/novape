import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csrfFetch } from '../../resources/js/utils/csrfFetch.js';

test('uses the new session cookie instead of the stale HTML token after login', async () => {
    const meta = { content: 'old-html-token' };
    globalThis.window = { location: { href: 'https://novape.me/admin/inbox', origin: 'https://novape.me' } };
    globalThis.document = { cookie: 'XSRF-TOKEN=new%2Bsession', querySelector: () => meta };
    const sent = [];
    globalThis.fetch = async (url, options) => { sent.push(options); return { status: 200 }; };
    await csrfFetch('/messages', { method: 'POST', headers: { 'X-CSRF-TOKEN': meta.content }, body: 'first' });
    document.cookie = 'XSRF-TOKEN=another-session';
    await csrfFetch('/messages', { method: 'POST', body: 'second' });
    assert.equal(sent[0].headers.get('X-CSRF-TOKEN'), null);
    assert.equal(sent[0].headers.get('X-XSRF-TOKEN'), 'new+session');
    assert.equal(sent[1].headers.get('X-XSRF-TOKEN'), 'another-session');
    assert.equal(sent[0].credentials, 'same-origin');
});

test('refreshes a rejected token and retries only once without changing the message', async () => {
    const calls = [];
    globalThis.fetch = async (url, options) => {
        calls.push({ url, options });
        if (url === '/csrf-token') return { ok: true, json: async () => ({ token: 'refreshed' }) };
        return { status: 419 };
    };
    const result = await csrfFetch('/messages', { method: 'POST', body: '{"content":"hola"}' });
    assert.equal(result.status, 419);
    assert.equal(calls.length, 3);
    assert.equal(calls[2].options.body, calls[0].options.body);
    assert.equal(calls[2].options.headers.get('X-CSRF-TOKEN'), 'refreshed');
    assert.equal(calls[2].options.headers.get('X-XSRF-TOKEN'), null);
});

test('does not retry failed actions or attach session tokens to another origin', async () => {
    const calls = [];
    globalThis.fetch = async (url, options) => { calls.push(options); return { status: 500 }; };
    await csrfFetch('/messages', { method: 'POST' });
    assert.equal(calls.length, 1);
    await csrfFetch('https://example.com/messages', { method: 'POST' });
    assert.equal(calls[1].headers, undefined);
});
