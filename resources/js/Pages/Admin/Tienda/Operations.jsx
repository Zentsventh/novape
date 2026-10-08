import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { Activity, ShieldAlert, CheckCircle2, XCircle, Clock, PackageSearch, CreditCard, AlertCircle, FileText, CheckCircle, ChevronRight, Server } from 'lucide-react';

export default function Operations({ health, readiness, tasks, payments, notifications, missingDimensions, dataQuality = [], catalogIssues }) {
    const { flash } = usePage().props;
    const [selected, setSelected] = useState(null);
    const form = useForm({ result: 'approved', amount: '', currency: 'PEN', provider_reference: '', evidence: '', verified: false });
    
    const select = (type, row) => { 
        setSelected({ type, row }); 
        form.setData({ result: type === 'payment' ? 'approved' : 'retry', amount: row.amount || '', currency: 'PEN', provider_reference: '', evidence: '', verified: false }); 
        form.clearErrors(); 
    };
    
    const links = (rows) => {
        if (!rows || !rows.links || rows.last_page <= 1) return null;
        return (
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', alignItems: 'center' }}>
                {rows.links.filter(l => l.url).map((l, i) => {
                    let cleanLabel = l.label || '';
                    if (cleanLabel.includes('pagination.previous') || cleanLabel.includes('&laquo;') || cleanLabel.toLowerCase().includes('previous')) {
                        cleanLabel = '‹ Anterior';
                    } else if (cleanLabel.includes('pagination.next') || cleanLabel.includes('&raquo;') || cleanLabel.toLowerCase().includes('next')) {
                        cleanLabel = 'Siguiente ›';
                    }
                    return (
                        <Link key={i} href={l.url} preserveScroll style={{ 
                            padding: '6px 12px', fontSize: '13px', borderRadius: '6px', 
                            border: l.active ? '1px solid #004797' : '1px solid #E5E7EB',
                            background: l.active ? '#004797' : '#fff',
                            color: l.active ? '#fff' : '#374151',
                            textDecoration: 'none', fontWeight: '500'
                        }}>
                            <span>{cleanLabel}</span>
                        </Link>
                    );
                })}
            </div>
        );
    };

    const Card = ({ title, icon: Icon, children }) => (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={18} color="#4B5563" />
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>{title}</h2>
            </div>
            <div style={{ padding: '20px', flex: 1 }}>{children}</div>
        </div>
    );

    const StatusBadge = ({ success, label }) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', background: success ? '#ECFDF5' : '#FEF2F2', color: success ? '#065F46' : '#991B1B' }}>
            {success ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {label}
        </span>
    );

    return (
        <AdminLayout>
            <Head title="Operación de tienda" />
            
            <div className="admin-header-row" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Activity size={24} color="#004797" /> Operación de tienda
                    </h1>
                    <p style={{ color: '#6B7280', fontSize: '14px', margin: '4px 0 0 0' }}>Supervisa pagos, entregas inciertas y la salud técnica del negocio en tiempo real.</p>
                </div>
            </div>

            {(flash?.success || flash?.error) && (
                <div style={{ background: flash?.success ? '#ECFDF5' : '#FEF2F2', color: flash?.success ? '#065F46' : '#991B1B', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '500', border: `1px solid ${flash?.success ? '#A7F3D0' : '#FECACA'}` }}>
                    {flash?.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />} {flash.success || flash.error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                
                {/* Readiness & Health */}
                <Card title="Salud del Sistema y Servicios" icon={Server}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Disponibilidad Comercial</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {Object.entries(readiness).map(([name, configured]) => (
                                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                                        <span style={{ color: '#374151' }}>{name}</span>
                                        <StatusBadge success={configured} label={configured ? 'Configurado' : 'Pendiente'} />
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '12px' }}>
                                <Link href="/admin/tienda/configuracion" style={{ fontSize: '13px', color: '#004797', fontWeight: '500', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    Editar información comercial <ChevronRight size={14} />
                                </Link>
                            </div>
                        </div>

                        <hr style={{ borderTop: '1px solid #E5E7EB', margin: '0' }} />

                        <div>
                            <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Procesos de Fondo</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {Object.entries(health.checks).map(([name, check]) => (
                                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                                        <span style={{ color: '#374151' }}>{name}</span>
                                        <StatusBadge success={check.ok} label={check.ok ? 'Activo' : 'Sin señal reciente'} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Data Quality */}
                <Card title="Calidad de Datos y Catálogo" icon={ShieldAlert}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Sincronización</h3>
                            {dataQuality.length ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {dataQuality.map(issue => (
                                        <div key={issue.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', background: '#FEF3C7', padding: '8px 12px', borderRadius: '6px' }}>
                                            <span style={{ color: '#92400E', fontWeight: '500' }}>{issue.key}</span>
                                            <span style={{ color: '#92400E', fontSize: '13px' }}>{issue.count} anomalías</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065F46', background: '#ECFDF5', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500' }}>
                                    <CheckCircle2 size={16} /> No hay incidencias registradas.
                                </div>
                            )}
                        </div>
                        
                        <hr style={{ borderTop: '1px solid #E5E7EB', margin: '0' }} />

                        <div>
                            <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Datos de Embalaje Faltantes</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', background: missingDimensions > 0 ? '#FEF2F2' : '#F9FAFB', padding: '12px', borderRadius: '8px', border: `1px solid ${missingDimensions > 0 ? '#FECACA' : '#E5E7EB'}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: missingDimensions > 0 ? '#991B1B' : '#6B7280' }}>
                                    <PackageSearch size={18} /> <span>Productos sin dimensiones:</span>
                                </div>
                                <span style={{ fontWeight: '700', fontSize: '16px', color: missingDimensions > 0 ? '#991B1B' : '#111827' }}>{missingDimensions}</span>
                            </div>
                            {missingDimensions > 0 && (
                                <Link href="/admin/products" style={{ display: 'block', marginTop: '12px', fontSize: '13px', color: '#004797', fontWeight: '500', textDecoration: 'none' }}>
                                    → Completar datos en el catálogo
                                </Link>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Catalog Issues List */}
            {catalogIssues && catalogIssues.data.length > 0 && (
                <div style={{ marginBottom: '32px', background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <AlertCircle size={20} color="#EA580C" />
                        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>Catálogo: Productos que requieren atención</h2>
                    </div>
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>SKU</th>
                                    <th>Deficiencias detectadas</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {catalogIssues.data.map(p => {
                                    const errs = [];
                                    if (!p.descripcion) errs.push("Falta descripción");
                                    if (!p.garantias) errs.push("Falta garantía");
                                    if (!p.shipping_length_cm || !p.shipping_width_cm || !p.shipping_height_cm) errs.push("Dimensiones incompletas");
                                    return (
                                        <tr key={p.sku}>
                                            <td style={{ fontWeight: '500' }}>{p.nombre}</td>
                                            <td style={{ color: '#6B7280' }}>{p.sku}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                    {errs.map(e => <span key={e} style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>{e}</span>)}
                                                </div>
                                            </td>
                                            <td>
                                                <Link href={`/admin/products/${p.id}/edit`} style={{ color: '#004797', fontSize: '13px', fontWeight: '500', textDecoration: 'none' }}>Corregir</Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {links(catalogIssues)}
                </div>
            )}

            {/* Reconciliation Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
                
                {/* Payments */}
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <CreditCard size={20} color="#004797" />
                        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>Pagos pendientes de conciliación</h2>
                    </div>
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Pedido</th>
                                    <th>Compra Niubiz</th>
                                    <th>Importe</th>
                                    <th>Estado</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.data.map(row => (
                                    <tr key={row.id}>
                                        <td><Link href={`/admin/pedidos/${row.pedido_id}`} style={{ fontWeight: '600', color: '#004797', textDecoration: 'none' }}>{row.codigo}</Link></td>
                                        <td style={{ fontFamily: 'monospace', color: '#4B5563' }}>{row.purchase_number}</td>
                                        <td style={{ fontWeight: '500' }}>S/ {row.amount}</td>
                                        <td><span style={{ background: '#DBEAFE', color: '#1E40AF', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{row.status}</span></td>
                                        <td><button onClick={() => select('payment', row)} style={{ background: 'transparent', border: '1px solid #D1D5DB', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', color: '#374151', transition: 'all 0.2s', ':hover': { background: '#F9FAFB' } }}>Conciliar</button></td>
                                    </tr>
                                ))}
                                {!payments.data.length && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>Todo al día. No hay pagos pendientes.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    {links(payments)}
                </div>

                {/* Tasks & Notifications Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                    
                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <Clock size={20} color="#4B5563" />
                            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>Confirmaciones atascadas (Tareas)</h2>
                        </div>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Tarea / Pedido</th>
                                        <th>Detalle de error</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.data.map(row => (
                                        <tr key={row.id}>
                                            <td>
                                                <div style={{ fontWeight: '500' }}>{row.kind}</div>
                                                {row.pedido_id && <Link href={`/admin/pedidos/${row.pedido_id}`} style={{ fontSize: '12px', color: '#004797', textDecoration: 'none' }}>Ver Pedido #{row.pedido_id}</Link>}
                                            </td>
                                            <td style={{ color: '#991B1B', fontSize: '13px' }}>{row.error || '-'}</td>
                                            <td>{['blocked', 'needs_review'].includes(row.status) && <button onClick={() => select('task', row)} style={{ background: 'transparent', border: '1px solid #D1D5DB', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>Resolver</button>}</td>
                                        </tr>
                                    ))}
                                    {!tasks.data.length && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>No hay tareas atascadas.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        {links(tasks)}
                    </div>

                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <FileText size={20} color="#4B5563" />
                            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>Notificaciones de salida (Emails)</h2>
                        </div>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Pedido / Canal</th>
                                        <th>Detalle de error</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {notifications.data.map(row => (
                                        <tr key={row.id}>
                                            <td>
                                                <Link href={`/admin/pedidos/${row.pedido_id}`} style={{ fontWeight: '500', color: '#004797', textDecoration: 'none' }}>Pedido #{row.pedido_id}</Link>
                                                <div style={{ fontSize: '12px', color: '#6B7280' }}>{row.channel}</div>
                                            </td>
                                            <td style={{ color: '#991B1B', fontSize: '13px' }}>{row.error || '-'}</td>
                                            <td>{row.status === 'failed' && <button onClick={() => select('notification', row)} style={{ background: 'transparent', border: '1px solid #D1D5DB', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>Resolver</button>}</td>
                                        </tr>
                                    ))}
                                    {!notifications.data.length && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>No hay notificaciones fallidas.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        {links(notifications)}
                    </div>

                </div>
            </div>

            {/* Modal de Resolución */}
            {selected && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '550px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                                {selected.type === 'payment' ? `Verificación de pago #${selected.row.purchase_number}` : `Resolución manual`}
                            </h2>
                            <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280' }}><XCircle size={24} /></button>
                        </div>
                        
                        <div style={{ padding: '24px' }}>
                            <form onSubmit={e => { e.preventDefault(); form.post(`/admin/tienda/${selected.type === 'payment' ? 'pagos' : selected.type === 'notification' ? 'notificaciones' : 'tareas'}/${selected.row.id}/resolver`, { preserveScroll: true, onSuccess: () => setSelected(null) }); }}>
                                
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Resultado de la verificación</label>
                                    <select 
                                        value={form.data.result} 
                                        onChange={e => form.setData('result', e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', background: '#fff', outline: 'none' }}
                                    >
                                        {(selected.type === 'payment' 
                                            ? [['approved', 'Pago aprobado por Niubiz'], ['declined', 'Pago denegado / no existe']] 
                                            : selected.type === 'task'
                                                ? [['delivered', 'Marcar como resuelto / comprobante emitido'], ['skipped', 'Omitir tarea (prueba o comprobante externo)'], ['retry', 'Reintentar operación']]
                                                : [['retry', 'Reintentar operación'], ['delivered', 'Marcar como resuelto / entregado']]
                                        ).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </div>

                                {selected.type === 'payment' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Importe (PEN)</label>
                                            <input type="number" min="0.01" step="0.01" required value={form.data.amount} onChange={e => form.setData('amount', e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Cod. Transacción Niubiz</label>
                                            <input required maxLength={128} value={form.data.provider_reference} onChange={e => form.setData('provider_reference', e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none' }} />
                                        </div>
                                    </div>
                                )}

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Evidencia u observaciones (Obligatorio)</label>
                                    <textarea required minLength={20} maxLength={5000} rows={4} value={form.data.evidence} onChange={e => form.setData('evidence', e.target.value)} placeholder="Indica cómo verificaste este resultado y proporciona detalles adicionales." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', resize: 'vertical', outline: 'none' }} />
                                </div>

                                {selected.type === 'payment' && (
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F3F4F6', padding: '12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px', border: '1px solid #E5E7EB' }}>
                                        <input type="checkbox" required checked={form.data.verified} onChange={e => form.setData('verified', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#004797' }} />
                                        <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>Confirmo bajo responsabilidad que los datos son reales y exactos según Niubiz.</span>
                                    </label>
                                )}

                                {Object.values(form.errors).map((error, i) => (
                                    <div key={i} style={{ color: '#B91C1C', background: '#FEF2F2', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>
                                ))}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
                                    <button type="button" onClick={() => setSelected(null)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid #D1D5DB', borderRadius: '6px', color: '#374151', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>Cancelar</button>
                                    <button type="submit" disabled={form.processing} style={{ padding: '10px 16px', background: '#004797', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: '600', cursor: form.processing ? 'not-allowed' : 'pointer', opacity: form.processing ? 0.7 : 1, fontSize: '14px' }}>
                                        {form.processing ? 'Procesando...' : 'Aplicar resolución'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            
        </AdminLayout>
    );
}
