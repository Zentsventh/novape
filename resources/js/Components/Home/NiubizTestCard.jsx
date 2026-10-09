import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function NiubizTestCard({ quote }) {
    const [message, setMessage] = useState('');
    const [copied, setCopied] = useState('');
    if (quote?.env !== 'sandbox' || !quote.testCard) return null;
    const card = quote.testCard;
    const copy = async (label, value) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(label);
            setMessage(`${label} copiado. Pégalo en el formulario de Niubiz.`);
        } catch {
            setCopied('');
            setMessage('Selecciona el dato y cópialo manualmente.');
        }
    };
    return <section className="purchase-test-card" aria-label="Tarjeta oficial de prueba de Niubiz">
        <div className="purchase-test-card-heading"><strong>Modo de prueba</strong><span>{card.brand} · Venta aprobada</span></div>
        <p>Usa esta tarjeta de prueba de Niubiz. No uses una tarjeta real.</p>
        <dl>{[
            ['Número', card.number, card.number.replace(/(.{4})(?=.)/g, '$1 ')],
            ['Vencimiento', card.expiry, card.expiry],
            ['CVV', card.cvv, card.cvv],
        ].map(([label, value, display]) => <div key={label}><dt>{label}</dt><dd><code>{display}</code><button type="button" onClick={() => copy(label, value)} aria-label={`Copiar ${label.toLowerCase()} de prueba`}>{copied === label ? <Check size={16} /> : <Copy size={16} />}<span>Copiar</span></button></dd></div>)}</dl>
        <p>Nombre, apellido y correo se rellenarán con tus datos. Copia la tarjeta antes de abrir el formulario y pega sus datos allí.</p>
        <a href={card.source} target="_blank" rel="noopener noreferrer">Ver manual oficial de Niubiz</a>
        <p className="purchase-test-card-status" role="status" aria-live="polite">{message}</p>
    </section>;
}
