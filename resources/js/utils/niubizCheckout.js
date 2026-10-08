let loading;
let environment;

export function loadNiubizCheckout(env) {
    if (environment === env && loading) return loading;
    environment = env;
    document.getElementById('niubiz-checkout-script')?.remove();
    delete window.VisanetCheckout;
    const script = document.createElement('script');
    script.id = 'niubiz-checkout-script';
    script.src = env === 'production'
        ? 'https://static-content.vnforapps.com/v2/js/checkout.js?qs=x'
        : 'https://static-content-qas.vnforapps.com/env/sandbox/js/checkout.js?qs=x';
    script.async = true;
    const operation = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('La pasarela tardó demasiado en cargar.')), 15000);
        script.onload = () => {
            clearTimeout(timeout);
            if (window.VisanetCheckout) resolve();
            else reject(new Error('No se pudo inicializar la pasarela.'));
        };
        script.onerror = () => { clearTimeout(timeout); reject(new Error('No se pudo cargar la pasarela.')); };
        document.body.appendChild(script);
    });
    loading = operation.catch(error => {
        if (environment === env) { loading = undefined; script.remove(); }
        throw error;
    });
    return loading;
}
