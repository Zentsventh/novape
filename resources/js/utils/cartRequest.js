import axios from 'axios';
import { router } from '@inertiajs/react';

// Preserve action order across cards and drawers without reloading the current catalogue.
let queue = Promise.resolve();
export function cartPost(url, payload = {}, options = {}) {
    options.onStart?.();
    const operation = queue.then(async () => {
        try {
            const { data } = await axios.post(url, payload, { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
            await new Promise(resolve => router.replace({
                props: current => ({ ...current, cart: data.cart, errors: {}, flash: { ...current.flash, error: null, success: data.message } }),
                preserveState: true, preserveScroll: true,
                onFinish: resolve,
            }));
            options.onSuccess?.(data);
            return data;
        } catch (error) {
            const errors = error.response?.data?.errors ?? { cart: [error.response?.status === 419 ? 'Tu sesión expiró. Recarga la página antes de continuar.' : 'No se pudo actualizar el carrito. Revisa tu conexión e intenta nuevamente.'] };
            const message = Object.values(errors).flat()[0];
            await new Promise(resolve => router.replace({ props: current => ({ ...current, errors, flash: { ...current.flash, success: null, error: message } }), preserveState: true, preserveScroll: true, onFinish: resolve }));
            options.onError?.(errors);
            return null;
        } finally { options.onFinish?.(); }
    });
    queue = operation.catch(() => {});
    return operation;
}
