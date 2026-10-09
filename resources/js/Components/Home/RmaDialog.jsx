import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import useStoreDialog from '../../Hooks/useStoreDialog';

export default function RmaDialog({ order, onClose }) {
    const panel = useStoreDialog(!!order, onClose);
    const form = useForm({ pedido_id: '', producto_id: '', type: 'warranty', reason: '', description: '', images: [] });
    useEffect(() => {
        form.reset(); form.clearErrors();
        if (order) form.setData('pedido_id', order.id);
    }, [order?.id]);
    if (!order) return null;
    const products = [...new Map((order.items || []).map(item => {
        const product = item.variante?.producto;
        return [product?.id, { id: product?.id, nombre: product?.nombre || item.producto_nombre }];
    }).filter(([id]) => id)).values()];
    const submit = event => {
        event.preventDefault();
        form.post('/perfil/devoluciones', { forceFormData: true, preserveScroll: true, onSuccess: onClose });
    };
    return <div className="store-modal-overlay store-rma-overlay" onClick={onClose}>
        <section ref={panel} role="dialog" aria-modal="true" aria-labelledby="rma-form-title" tabIndex={-1} className="store-modal-panel store-status-card" onClick={event => event.stopPropagation()}>
            <div className="store-page-heading"><h2 id="rma-form-title">Devolución, cambio o garantía</h2><button type="button" onClick={onClose} aria-label="Cerrar solicitud">×</button></div>
            <p>Pedido {order.codigo}</p>
            <form className="store-recovery-form" onSubmit={submit}>
                <label htmlFor="rma-product">Producto</label><select id="rma-product" value={form.data.producto_id} onChange={e => form.setData('producto_id', e.target.value)}>
                    <option value="">Pedido completo</option>{products.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <label htmlFor="rma-type">Tipo de solicitud</label><select id="rma-type" value={form.data.type} onChange={e => form.setData('type', e.target.value)}>
                    <option value="warranty">Garantía</option><option value="return">Devolución</option><option value="exchange">Cambio</option>
                </select>
                <label htmlFor="rma-reason">Motivo</label><input id="rma-reason" required maxLength={255} value={form.data.reason} onChange={e => form.setData('reason', e.target.value)} />
                <label htmlFor="rma-description">Describe lo ocurrido</label><textarea id="rma-description" rows={4} maxLength={5000} value={form.data.description} onChange={e => form.setData('description', e.target.value)} />
                <label htmlFor="rma-images">Fotos de evidencia (hasta 5, máximo 5 MB cada una)</label><input id="rma-images" type="file" accept="image/*" multiple onChange={e => {
                    const images = [...e.target.files];
                    if (images.length > 5 || images.some(file => file.size > 5 * 1024 * 1024)) { form.setError('images', 'Elige hasta 5 imágenes de máximo 5 MB cada una.'); form.setData('images', []); e.target.value = ''; }
                    else { form.clearErrors('images'); form.setData('images', images); }
                }} />
                {Object.entries(form.errors).map(([key, value]) => <p role="alert" key={key}>{value}</p>)}
                <button className="efe-btn-primary" disabled={form.processing}>{form.processing ? 'Enviando…' : 'Enviar solicitud'}</button>
            </form>
        </section>
    </div>;
}
