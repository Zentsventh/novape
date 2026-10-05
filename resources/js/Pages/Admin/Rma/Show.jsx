import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ArrowLeft, Check, X, Box, FileText, AlertTriangle, MessageSquare } from 'lucide-react';


export default function RmaShow({ rma }) {
    const { auth, errors = {} } = usePage().props;
    const [adminNotes, setAdminNotes] = useState(rma.admin_notes || '');
    const [status, setStatus] = useState(rma.status);
    const eligible = (rma.pedido?.items || []).filter(i => !rma.producto_id || i.variante?.producto_id === rma.producto_id);
    const [lines, setLines] = useState(() => Object.fromEntries(eligible.map(i => [i.id, {cantidad: 0, condicion: 'no_vendible'}])));
    const [saving, setSaving] = useState(false);
    const allowedStatuses = [rma.status, ...({
        pending: ['approved', 'rejected'], approved: ['received', 'rejected'],
        received: ['processed'], processed: [], rejected: [],
    }[rma.status] || [])];

    const getStatusStyle = (s) => {
        switch (s) {
            case 'pending': return { bg: '#fef3c7', text: '#d97706', label: 'Pendiente' };
            case 'approved': return { bg: '#dcfce7', text: '#16a34a', label: 'Aprobado' };
            case 'received': return { bg: '#dbeafe', text: '#2563eb', label: 'En Revisión Técnica' };
            case 'processed': return { bg: '#f3e8ff', text: '#9333ea', label: 'Procesado/Completado' };
            case 'rejected': return { bg: '#fee2e2', text: '#dc2626', label: 'Rechazado' };
            default: return { bg: '#f1f5f9', text: '#64748b', label: s };
        }
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);
        router.put(`/admin/rma/${rma.id}/status`, {
            status,
            admin_notes: adminNotes,
            ...(status === 'processed' && rma.type === 'return' ? {items: eligible.filter(i => Number(lines[i.id]?.cantidad) > 0).map(i => ({pedido_item_id: i.id, cantidad: Number(lines[i.id].cantidad), condicion: lines[i.id].condicion}))} : {})
        }, {onFinish: () => setSaving(false)});
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title={`RMA #${rma.id}`} />

            <div className="efe-admin-container" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
                <Link href="/admin/rma" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: '500', marginBottom: '24px' }}>
                    <ArrowLeft size={18} /> Volver a Solicitudes
                </Link>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
                    
                    {/* Left Column: Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                                    Detalles de la Solicitud #{rma.id.toString().padStart(6, '0')}
                                </h2>
                                <span style={{ 
                                    background: getStatusStyle(rma.status).bg, 
                                    color: getStatusStyle(rma.status).text,
                                    padding: '6px 16px', borderRadius: '24px', fontSize: '13px', fontWeight: '600'
                                }}>
                                    {getStatusStyle(rma.status).label}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div>
                                    <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '4px' }}>Tipo de Solicitud</div>
                                    <div style={{ fontWeight: '500', color: '#0f172a' }}>
                                        {rma.type === 'return' ? 'Devolución' : rma.type === 'exchange' ? 'Cambio' : 'Garantía'}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '4px' }}>Motivo</div>
                                    <div style={{ fontWeight: '500', color: '#0f172a' }}>
                                        {rma.reason === 'defective' ? 'Producto Defectuoso' : rma.reason === 'wrong_item' ? 'Artículo Equivocado' : rma.reason === 'changed_mind' ? 'Cambio de Opinión' : rma.reason}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '4px' }}>Fecha de Creación</div>
                                    <div style={{ fontWeight: '500', color: '#0f172a' }}>{new Date(rma.created_at).toLocaleString('es-PE')}</div>
                                </div>
                            </div>

                            <div style={{ marginTop: '24px' }}>
                                <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>Descripción del Cliente</div>
                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', color: '#334155' }}>
                                    {rma.description || 'Sin descripción'}
                                </div>
                            </div>

                            {rma.images && rma.images.length > 0 && (
                                <div style={{ marginTop: '24px' }}>
                                    <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>Evidencia Fotográfica</div>
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        {rma.images.map((img, i) => (
                                            <a key={i} href={img} target="_blank" rel="noreferrer" style={{ display: 'block', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                <img src={img} alt="Evidencia" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Product & Order Info */}
                        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '24px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                                Información Asociada
                            </h3>
                            
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '4px' }}>Cliente</div>
                                <div style={{ fontWeight: '600', color: '#0f172a' }}>{rma.usuario?.nombres} {rma.usuario?.apellidos}</div>
                                <div style={{ color: '#64748b', fontSize: '13px' }}>{rma.usuario?.email} • {rma.usuario?.telefono}</div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '4px' }}>Pedido</div>
                                <Link href={`/admin/pedidos/${rma.pedido_id}`} style={{ fontWeight: '600', color: '#3b82f6', textDecoration: 'none' }}>
                                    Ver Pedido #{rma.pedido_id}
                                </Link>
                            </div>

                            {rma.producto && (
                                <div>
                                    <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>Producto Afectado</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                                        <Box size={24} color="#94a3b8" />
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#0f172a' }}>{rma.producto.nombre}</div>
                                            <div style={{ color: '#64748b', fontSize: '12px' }}>SKU: {rma.producto.sku}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Actions */}
                    <div>
                        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '24px', position: 'sticky', top: '24px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                                Resolución / Estado
                            </h3>

                            <form onSubmit={handleUpdate}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Cambiar Estado</label>
                                    <select 
                                        value={status} 
                                        onChange={(e) => setStatus(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                                    >
                                        <option value="pending" disabled={!allowedStatuses.includes('pending')}>Pendiente</option>
                                        <option value="approved" disabled={!allowedStatuses.includes('approved')}>Aprobado (Esperando envío del cliente)</option>
                                        <option value="received" disabled={!allowedStatuses.includes('received')}>En Revisión Técnica (Recibido)</option>
                                        <option value="processed" disabled={!allowedStatuses.includes('processed')}>Procesado/Completado</option>
                                        <option value="rejected" disabled={!allowedStatuses.includes('rejected')}>Rechazado</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                                        Notas de Soporte (Visibles para el cliente)
                                    </label>
                                    <textarea 
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        rows={5}
                                        placeholder="Ej: Hemos recibido el equipo y determinamos que la pantalla tiene un defecto de fábrica. Procederemos con el reembolso."
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }}
                                    />
                                </div>

                                {status === 'processed' && rma.type === 'return' && rma.status !== 'processed' && <fieldset style={{marginBottom: 20}}>
                                    <legend>Artículos recibidos</legend>
                                    <p>Indica la cantidad recibida. Solo los artículos aptos vuelven al stock de venta.</p>
                                    {eligible.map(i => <div key={i.id} style={{marginBottom: 12}}>
                                        <label>{i.producto_nombre || i.variante?.producto?.nombre} / {i.sku || i.variante?.sku}
                                            <input type="number" min="0" max={i.cantidad} value={lines[i.id]?.cantidad || 0} onChange={e => setLines(prev => ({...prev, [i.id]: {...prev[i.id], cantidad: e.target.value}}))}/>
                                        </label>
                                        <select aria-label="Condición del artículo" value={lines[i.id]?.condicion} onChange={e => setLines(prev => ({...prev, [i.id]: {...prev[i.id], condicion: e.target.value}}))}>
                                            <option value="no_vendible">No apto para venta</option><option value="vendible">Apto para venta</option>
                                        </select>
                                    </div>)}
                                </fieldset>}
                                {Object.entries(errors).filter(([key]) => key.startsWith('items')).map(([key, value]) => <p key={key} role="alert" style={{color: '#dc2626'}}>{value}</p>)}
                                {errors.status && <p role="alert" style={{ color: '#dc2626' }}>{errors.status}</p>}
                                <button type="submit" disabled={saving} style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <Check size={18} />
                                    Guardar Resolución
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
