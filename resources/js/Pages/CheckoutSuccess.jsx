import { useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Check, Download, Package } from 'lucide-react';
import PurchaseHeader from '../Components/Home/PurchaseHeader';

export default function CheckoutSuccess({ pedido, comprobante, orderAccessUrl }) {
    const { auth } = usePage().props;
    useEffect(() => {
        if (window.top !== window.self) window.top.location.href = window.location.href;
        ['checkout_address', 'checkout_delivery', 'checkout_shipping_cost', 'checkout_customer'].forEach(key => sessionStorage.removeItem(key));
    }, []);
    return <div className="purchase-page">
        <Head title="Compra confirmada"><meta name="robots" content="noindex,nofollow" /></Head>
        <PurchaseHeader stage={3} complete />
        <main className="purchase-container"><section className="purchase-card purchase-status" aria-labelledby="purchase-confirmed">
            <span className="purchase-status-icon"><Check size={32} aria-hidden="true" /></span>
            <h1 id="purchase-confirmed">Tu compra está confirmada</h1>
            <p>Gracias por comprar en Novape. Conserva este código para consultar el estado de tu pedido.</p>
            <dl><div><dt>Código de pedido</dt><dd>{pedido.codigo}</dd></div><div><dt>Estado</dt><dd>{pedido.estado}</dd></div><div><dt>Total de la compra</dt><dd>{new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(pedido.total)}</dd></div></dl>
            {comprobante && <div className="purchase-notice"><div><strong>{comprobante.tipo} · {comprobante.numero}</strong><p>{comprobante.estado === 'aceptado' ? 'Comprobante electrónico emitido.' : 'Comprobante registrado. Emisión electrónica pendiente.'}</p></div></div>}
            <div className="purchase-status-actions">{comprobante && <a className="purchase-primary" href={comprobante.downloadUrl}><Download size={17} />Descargar comprobante</a>}<Link className="purchase-outline" href={`/seguimiento?codigo=${encodeURIComponent(pedido.codigo)}`}><Package size={17} />Seguir mi pedido</Link>
                {orderAccessUrl && <a className="purchase-outline" href={orderAccessUrl}>Estado y posventa de mi compra</a>}
                {auth?.user && <Link className="purchase-outline" href="/perfil?tab=compras">Mis compras</Link>}
                <Link className="purchase-outline" href="/catalogo">Seguir comprando<ArrowRight size={16} /></Link></div>
        </section></main>
    </div>;
}
