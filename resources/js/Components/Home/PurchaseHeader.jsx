import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Check, ChevronLeft, ShieldCheck } from 'lucide-react';
import '../../../css/home/purchase-flow.css';

export default function PurchaseHeader({ stage = 1, complete = false, onDelivery }) {
    const { globalConfig } = usePage().props;
    const [logoFailed, setLogoFailed] = useState(false);
    return <header className="purchase-header">
        <div className="purchase-header-inner">
            <Link href="/" className="purchase-logo" aria-label="Novape, ir al inicio">
                {globalConfig?.logo_url && !logoFailed ? <img src={globalConfig.logo_url} alt="Novape" onError={() => setLogoFailed(true)} /> : <strong>Nova<span>Pe</span><i>.</i></strong>}
            </Link>
            <nav className="purchase-progress" aria-label="Progreso de compra"><ol>
                {['Carrito', 'Entrega', 'Pago'].map((label, index) => {
                    const number = index + 1, done = complete || number < stage;
                    const content = <><span className="purchase-step-number">{done ? <Check size={16} aria-hidden="true" /> : number}</span><span>{label}</span></>;
                    return <li key={label} className={done ? 'is-done' : number === stage ? 'is-current' : ''}>
                        {number === 1 && stage > 1 && !complete ? <Link href="/carrito">{content}</Link>
                            : number === 2 && stage > 2 && onDelivery && !complete ? <button type="button" onClick={onDelivery}>{content}</button>
                                : <span aria-current={!complete && number === stage ? 'step' : undefined}>{content}</span>}
                    </li>;
                })}
            </ol></nav>
            <span className="purchase-header-note"><ShieldCheck size={17} aria-hidden="true" />Compra en Novape</span>
        </div>
    </header>;
}

export function PurchaseBackLink({ href = '/catalogo', children = 'Seguir comprando' }) {
    return <Link href={href} className="purchase-back-link"><ChevronLeft size={16} aria-hidden="true" />{children}</Link>;
}
