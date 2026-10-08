import { UNICA_BANNER, BOTTOM_BANNER } from './constants';
import { Link, usePage } from '@inertiajs/react';

/* Renderiza el banner de envío gratuito. */
export function ShippingBanner() {
    const { globalConfig } = usePage().props;
    if (globalConfig?.free_shipping_enabled === false) return null;
    return (
        <Link href="/ayuda" style={{ display: 'block', padding: '10px 16px', backgroundColor: '#0b243b', color: '#fff', textAlign: 'center', textDecoration: 'none', fontSize: 13 }}>
            Envío gratis desde S/ {globalConfig?.free_shipping_threshold ?? 299} en Lima Metropolitana. Consulta cobertura y condiciones.
        </Link>
    );
}

/* Renderiza el banner de tarjeta Única. */
export function UnicaBanner() {
    return (
        <div className="efe-banner-full">
            <img src={UNICA_BANNER} alt="Tarjeta Única" />
        </div>
    );
}

/* Renderiza el banner inferior promocional. */
export function BottomBanner() {
    return (
        <div className="efe-banner-full">
            <img src={BOTTOM_BANNER} alt="Compra Hoy Recógelo Hoy" />
        </div>
    );
}
