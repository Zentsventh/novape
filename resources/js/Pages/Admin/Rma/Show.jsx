import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    ArrowLeft, Check, Box, FileText, MessageSquare, ShieldCheck, 
    Clock, CheckCircle2, Search, ExternalLink, User, ShoppingBag
} from 'lucide-react';

export default function RmaShow({ rma }) {
    const { auth, errors = {} } = usePage().props;
    const [adminNotes, setAdminNotes] = useState(rma.admin_notes || '');
    const [status, setStatus] = useState(rma.status);
    const eligible = (rma.pedido?.items || []).filter(i => !rma.producto_id || i.variante?.producto_id === rma.producto_id);
    const [lines, setLines] = useState(() => Object.fromEntries(eligible.map(i => [i.id, { cantidad: 0, condicion: 'no_vendible' }])));
    const [saving, setSaving] = useState(false);

    // Normalizar imágenes de manera ultra segura (array, string JSON o vacío)
    let imagesList = [];
    if (Array.isArray(rma?.images)) {
        imagesList = rma.images;
    } else if (typeof rma?.images === 'string') {
        try {
            const parsed = JSON.parse(rma.images);
            if (Array.isArray(parsed)) imagesList = parsed;
        } catch {
            imagesList = [];
        }
    }

    const allowedStatuses = [rma.status, ...({
        pending: ['approved', 'rejected'],
        approved: ['received', 'rejected'],
        received: ['processed'],
        processed: [],
        rejected: [],
    }[rma.status] || [])];

    // Estilos SaaS en estricto #004797 y escala monocromática/neutra
    const getStatusStyle = (s) => {
        switch (s) {
            case 'pending':
                return { bg: '#F1F5F9', border: '#E2E8F0', text: '#475569', label: 'Pendiente' };
            case 'approved':
                return { bg: '#E6F0F9', border: '#BAE6FD', text: '#004797', label: 'Aprobado' };
            case 'received':
                return { bg: '#F0F7FF', border: '#E0F2FE', text: '#0284C7', label: 'En Revisión Técnica' };
            case 'processed':
                return { bg: '#F8FAFC', border: '#CBD5E1', text: '#002D62', label: 'Procesado / Resuelto' };
            case 'rejected':
                return { bg: '#F8FAFC', border: '#E2E8F0', text: '#94A3B8', label: 'Rechazado' };
            default:
                return { bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B', label: s };
        }
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);
        router.put(`/admin/rma/${rma.id}/status`, {
            status,
            admin_notes: adminNotes,
            ...(status === 'processed' && ['return', 'exchange'].includes(rma.type) ? {
                items: eligible
                    .filter(i => Number(lines[i.id]?.cantidad) > 0)
                    .map(i => ({
                        pedido_item_id: i.id,
                        cantidad: Number(lines[i.id].cantidad),
                        condicion: lines[i.id].condicion
                    }))
            } : {})
        }, {
            onFinish: () => setSaving(false)
        });
    };

    const badge = getStatusStyle(rma.status);

    return (
        <AdminLayout user={auth.user}>
            <Head title={`RMA #${rma.id.toString().padStart(6, '0')}`} />

            <div style={{ paddingBottom: '32px', maxWidth: '1100px', margin: '0 auto' }}>
                {/* Botón Volver */}
                <Link 
                    href="/admin/rma" 
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#004797'; e.currentTarget.style.transform = 'translateX(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.transform = 'none'; }}
                    style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        color: '#64748B', 
                        textDecoration: 'none', 
                        fontWeight: '600', 
                        fontSize: '14px', 
                        marginBottom: '20px',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <ArrowLeft size={16} /> Volver a Solicitudes
                </Link>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>
                    
                    {/* Columna Izquierda: Información de la Solicitud */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* Tarjeta Principal */}
                        <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0', padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ background: '#E6F0F9', padding: '8px', borderRadius: '8px', color: '#004797' }}>
                                        <ShieldCheck size={20} strokeWidth={2} />
                                    </div>
                                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0, letterSpacing: '-0.01em' }}>
                                        Solicitud #{rma.id.toString().padStart(6, '0')}
                                    </h2>
                                </div>
                                <span style={{ 
                                    background: badge.bg, 
                                    color: badge.text,
                                    border: `1px solid ${badge.border}`,
                                    padding: '4px 12px', 
                                    borderRadius: '6px', 
                                    fontSize: '12px', 
                                    fontWeight: '600'
                                }}>
                                    {badge.label}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <div style={{ color: '#64748B', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Tipo de Solicitud</div>
                                    <div style={{ fontWeight: '600', color: '#1E293B', fontSize: '14px' }}>
                                        {rma.type === 'return' ? 'Devolución' : rma.type === 'exchange' ? 'Cambio mediante devolución y nueva compra' : 'Garantía Técnica'}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ color: '#64748B', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Motivo Declarado</div>
                                    <div style={{ fontWeight: '600', color: '#1E293B', fontSize: '14px' }}>
                                        {rma.reason === 'defective' ? 'Producto Defectuoso' : rma.reason === 'wrong_item' ? 'Artículo Equivocado' : rma.reason === 'changed_mind' ? 'Cambio de Opinión' : rma.reason}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ color: '#64748B', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Fecha de Emisión</div>
                                    <div style={{ fontWeight: '600', color: '#1E293B', fontSize: '14px' }}>
                                        {new Date(rma.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div style={{ color: '#64748B', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Detalle del Cliente</div>
                                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '8px', color: '#334155', fontSize: '14px', lineHeight: '1.5' }}>
                                    {rma.description || 'Sin descripción adicional adjunta.'}
                                </div>
                            </div>

                            {/* Evidencia fotográfica protegida contra errores de tipo */}
                            {imagesList.length > 0 && (
                                <div style={{ marginTop: '20px' }}>
                                    <div style={{ color: '#64748B', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Evidencia Fotográfica</div>
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        {imagesList.map((img, i) => (
                                            <a key={i} href={img} target="_blank" rel="noreferrer" style={{ display: 'block', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0', transition: 'all 0.2s ease' }}>
                                                <img src={img} alt="Evidencia" style={{ width: '90px', height: '90px', objectFit: 'cover' }} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tarjeta de Producto y Pedido */}
                        <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0', padding: '24px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1E293B', margin: '0 0 16px 0', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                                Información Asociada
                            </h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <div style={{ color: '#64748B', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Cliente Titular</div>
                                    <div style={{ fontWeight: '600', color: '#1E293B', fontSize: '14px' }}>
                                        {rma.usuario?.nombres} {rma.usuario?.apellidos}
                                    </div>
                                    <div style={{ color: '#64748B', fontSize: '13px', marginTop: '2px' }}>
                                        {rma.usuario?.email} {rma.usuario?.telefono ? `• ${rma.usuario.telefono}` : ''}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ color: '#64748B', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Orden de Venta</div>
                                    <Link 
                                        href={`/admin/pedidos/${rma.pedido_id}`} 
                                        onMouseEnter={(e) => { e.currentTarget.style.color = '#002D62'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = '#004797'; }}
                                        style={{ fontWeight: '600', color: '#004797', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease' }}
                                    >
                                        <ShoppingBag size={14} /> Ver Pedido #{rma.pedido?.codigo || rma.pedido_id}
                                    </Link>
                                </div>
                            </div>

                            {rma.producto && (
                                <div>
                                    <div style={{ color: '#64748B', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Producto Afectado</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '14px', borderRadius: '8px' }}>
                                        <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px', color: '#004797' }}>
                                            <Box size={22} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1E293B', fontSize: '14px' }}>{rma.producto.nombre}</div>
                                            <div style={{ color: '#64748B', fontSize: '12px', marginTop: '2px' }}>SKU: {rma.producto.sku || 'No asignado'}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Columna Derecha: Panel de Resolución */}
                    <div>
                        <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0', padding: '24px', position: 'sticky', top: '24px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: '0 0 16px 0', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                                Resolución de Caso
                            </h3>

                            <form onSubmit={handleUpdate}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Actualizar Estado</label>
                                    <select 
                                        value={status} 
                                        onChange={(e) => setStatus(e.target.value)}
                                        onFocus={(e) => { e.target.style.borderColor = '#004797'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.1)'; }}
                                        onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#1E293B', fontSize: '14px', outline: 'none', transition: 'all 0.2s ease', cursor: 'pointer' }}
                                    >
                                        <option value="pending" disabled={!allowedStatuses.includes('pending')}>Pendiente</option>
                                        <option value="approved" disabled={!allowedStatuses.includes('approved')}>Aprobado (Esperando envío)</option>
                                        <option value="received" disabled={!allowedStatuses.includes('received')}>En Revisión Técnica</option>
                                        <option value="processed" disabled={!allowedStatuses.includes('processed')}>Procesado / Resuelto</option>
                                        <option value="rejected" disabled={!allowedStatuses.includes('rejected')}>Rechazado</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                                        Notas de Auditoría / Resolución
                                    </label>
                                    <textarea 
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        rows={5}
                                        placeholder="Ingresa los comentarios técnicos o motivos de resolución que quedarán registrados en el expediente..."
                                        onFocus={(e) => { e.target.style.borderColor = '#004797'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.1)'; e.target.style.backgroundColor = '#ffffff'; }}
                                        onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#1E293B', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', transition: 'all 0.2s ease', fontFamily: 'inherit' }}
                                    />
                                </div>

                                {status === 'processed' && ['return', 'exchange'].includes(rma.type) && rma.status !== 'processed' && (
                                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
                                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}>Artículos a Reintegrar</div>
                                        <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 12px 0' }}>Indica la cantidad recibida apta para volver al stock.</p>
                                        {eligible.map(i => (
                                            <div key={i.id} style={{ marginBottom: '10px' }}>
                                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                                                    {i.producto_nombre || i.variante?.producto?.nombre}
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <input 
                                                        type="number" 
                                                        min="0" 
                                                        max={i.cantidad} 
                                                        value={lines[i.id]?.cantidad || 0} 
                                                        onChange={e => setLines(prev => ({ ...prev, [i.id]: { ...prev[i.id], cantidad: e.target.value } }))}
                                                        style={{ width: '60px', padding: '6px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '13px' }}
                                                    />
                                                    <select 
                                                        value={lines[i.id]?.condicion} 
                                                        onChange={e => setLines(prev => ({ ...prev, [i.id]: { ...prev[i.id], condicion: e.target.value } }))}
                                                        style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '13px', backgroundColor: '#ffffff' }}
                                                    >
                                                        <option value="no_vendible">No apto para venta</option>
                                                        <option value="vendible">Apto para venta</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {Object.entries(errors).filter(([key]) => key.startsWith('items')).map(([key, value]) => (
                                    <p key={key} role="alert" style={{ color: '#004797', fontSize: '12px', margin: '0 0 10px 0' }}>{value}</p>
                                ))}
                                {errors.status && (
                                    <p role="alert" style={{ color: '#004797', fontSize: '12px', margin: '0 0 10px 0' }}>{errors.status}</p>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={saving} 
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#002D62'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 71, 151, 0.3)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#004797'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 71, 151, 0.2)'; }}
                                    style={{ 
                                        width: '100%', 
                                        padding: '12px', 
                                        background: '#004797', 
                                        color: '#ffffff', 
                                        border: 'none', 
                                        borderRadius: '8px', 
                                        fontWeight: '600', 
                                        fontSize: '14px', 
                                        cursor: 'pointer', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        gap: '8px', 
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 2px 4px rgba(0, 71, 151, 0.2)'
                                    }}
                                >
                                    <Check size={18} />
                                    {saving ? 'Guardando...' : 'Guardar Resolución'}
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
