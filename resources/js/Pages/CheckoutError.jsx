import { Head, Link } from '@inertiajs/react';
import { CircleAlert } from 'lucide-react';
import PurchaseHeader from '../Components/Home/PurchaseHeader';

export default function CheckoutError({ message }) {
    return <div className="purchase-page">
        <Head title="Revisar pago"><meta name="robots" content="noindex,nofollow" /></Head>
        <PurchaseHeader stage={3} />
        <main className="purchase-container"><section className="purchase-card purchase-status is-error" aria-labelledby="purchase-error">
            <span className="purchase-status-icon"><CircleAlert size={32} aria-hidden="true" /></span><h1 id="purchase-error">No pudimos confirmar tu pago</h1>
            <p role="alert">{message || 'Revisa los datos y el estado de la operación antes de volver a intentarlo.'}</p>
            <p>Si ves un cargo en tu cuenta, contacta con nosotros antes de repetir el pago.</p>
            <div className="purchase-status-actions"><Link className="purchase-primary" href="/checkout">Volver a revisar mi compra</Link><Link className="purchase-outline" href="/ayuda">Necesito ayuda</Link></div>
        </section></main>
    </div>;
}
