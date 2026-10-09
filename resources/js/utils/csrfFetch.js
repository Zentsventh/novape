// Read the current session token at send time, including after an Inertia login.
function csrfHeaders(headers = {}, explicitToken) {
    const result = new Headers(headers);
    if (!result.has('Accept')) result.set('Accept', 'application/json');
    result.delete('X-CSRF-TOKEN');
    result.delete('X-XSRF-TOKEN');
    if (explicitToken) {
        result.set('X-CSRF-TOKEN', explicitToken);
    } else {
        const cookie = document.cookie.split(/;\s*/).find(value => value.startsWith('XSRF-TOKEN='));
        if (cookie) {
            result.set('X-XSRF-TOKEN', decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)));
        } else {
            const token = document.querySelector('meta[name="csrf-token"]')?.content;
            if (token) result.set('X-CSRF-TOKEN', token);
        }
    }
    return result;
}

export async function csrfFetch(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const sameOrigin = new URL(url, window.location.href).origin === window.location.origin;
    if (!sameOrigin || ['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        return globalThis.fetch(url, options);
    }
    const request = { ...options, credentials: 'same-origin', headers: csrfHeaders(options.headers) };
    const response = await globalThis.fetch(url, request);
    // A CSRF rejection happens before the action. Retry once after refreshing it.
    if (response.status !== 419) return response;
    const refresh = await globalThis.fetch('/csrf-token', {
        credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' }, signal: options.signal,
    });
    if (!refresh.ok) return response;
    const { token } = await refresh.json();
    if (typeof token !== 'string' || !token) return response;
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) meta.content = token;
    return globalThis.fetch(url, { ...request, headers: csrfHeaders(options.headers, token) });
}
