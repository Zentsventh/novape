import { useState } from 'react';
import { useForm } from '@inertiajs/react';

export default function OrderRefundPanel({ orderId, refunds = [], returnOptions = [] }) {
    const [selected, setSelected] = useState(null);
    const request = useForm({ rma_id: '', request_key: crypto.randomUUID() });
    const confirm = useForm({ amount: '', provider_reference: '', evidence: '', verified: false });
    return <section style={{ padding: 24, margin: '24px 0', background: 'white', borderRadius: 12 }}>
        <h2>Devoluciones de dinero</h2><p>Completa la devolución en Niubiz y registra su referencia. El inventario de una devolución parcial se gestiona desde RMA.</p>
        {refunds.map(refund => <p key={refund.id}>Solicitud #{refund.id} · {refund.rma_id ? `RMA #${refund.rma_id}` : 'Anulación total'} · S/ {refund.amount} · {refund.status}
            {refund.provider_reference && ` · Referencia ${refund.provider_reference}`}
            {refund.status === 'pending' && <button onClick={() => { setSelected(refund); confirm.setData({ amount: refund.amount, provider_reference: '', evidence: '', verified: false }); }}>Registrar devolución confirmada</button>}
        </p>)}
        {returnOptions.length > 0 && <form onSubmit={e => { e.preventDefault(); request.post(`/admin/pedidos/${orderId}/reembolso-parcial`, { preserveScroll: true, onSuccess: () => request.setData({ rma_id: '', request_key: crypto.randomUUID() }) }); }}>
            <label>Devolución recibida<select required value={request.data.rma_id} onChange={e => request.setData('rma_id', e.target.value)}><option value="">Selecciona una devolución</option>{returnOptions.map(rma => <option key={rma.id} value={rma.id}>RMA #{rma.id}</option>)}</select></label>
            <button disabled={request.processing}>Solicitar reembolso de estos artículos</button>
            {Object.values(request.errors).map((error, i) => <p key={i} role="alert">{error}</p>)}
        </form>}
        {selected && <form onSubmit={e => { e.preventDefault(); confirm.post(`/admin/pedidos/${orderId}/reembolsos/${selected.id}/confirmar`, { preserveScroll: true, onSuccess: () => setSelected(null) }); }}>
            <h3>Confirmar solicitud #{selected.id}</h3><label>Importe devuelto en soles<input type="number" step="0.01" min="0.01" required value={confirm.data.amount} onChange={e => confirm.setData('amount', e.target.value)} /></label>
            <label>Referencia de Niubiz<input required maxLength={128} value={confirm.data.provider_reference} onChange={e => confirm.setData('provider_reference', e.target.value)} /></label>
            <label>Evidencia de la devolución<textarea required minLength={20} maxLength={5000} value={confirm.data.evidence} onChange={e => confirm.setData('evidence', e.target.value)} style={{ display: 'block', width: '100%' }} /></label>
            <label><input type="checkbox" required checked={confirm.data.verified} onChange={e => confirm.setData('verified', e.target.checked)} /> Verifiqué importe y referencia en Niubiz</label>
            {Object.values(confirm.errors).map((error, i) => <p key={i} role="alert">{error}</p>)}
            <p><button disabled={confirm.processing}>Confirmar con evidencia</button> <button type="button" onClick={() => setSelected(null)}>Cerrar</button></p>
        </form>}
    </section>;
}
