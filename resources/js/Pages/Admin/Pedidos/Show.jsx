import React from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { ArrowLeft, FileText, Package, RefreshCw, User, CreditCard, Box, Calendar, Save, CheckCircle, Truck } from 'lucide-react';

export default function Show({ pedido }) {
    const confirmDialog = useConfirm();

    const { flash } = usePage().props;
    const { data, setData, put, processing } = useForm({
        estado: pedido.estado,
        tracking: pedido.envio?.tracking || '',
        estado_envio: pedido.envio?.estado || ''
    });

    const updateStatus = (e) => {
        e.preventDefault();
        put(`/admin/pedidos/${pedido.id}/estado`);
    };

    return (
        <AdminLayout logoUrl={null}>
            <Head title={`Pedido ${pedido.codigo}`} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link 
                        href="/admin/pedidos" 
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#64748B'; }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#64748B', transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.02em' }}>
                            Pedido <span style={{ color: '#004797' }}>#{pedido.codigo}</span>
                        </h1>
                        <p style={{ color: '#64748B', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                            <Calendar size={14} /> {new Date(pedido.created_at).toLocaleString('es-PE')}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <a 
                        href={`/admin/pedidos/${pedido.id}/factura`} 
                        target="_blank" 
                        rel="noreferrer" 
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#009BE0'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 71, 151, 0.3)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#004797'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 71, 151, 0.2)'; }}
                        style={{ background: '#004797', color: 'white', textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0, 71, 151, 0.2)' }}
                    >
                        <FileText size={16} />
                        Ver Factura
                    </a>
                </div>
            </div>

            {flash?.success && (
                <div style={{ background: '#ECFDF5', color: '#059669', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontWeight: '600', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle size={20} />
                    {flash.success}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '24px', alignItems: 'start' }}>
                {/* Lado izquierdo: Artículos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Package size={18} style={{ color: '#004797' }} /> Artículos del Pedido
                        </h2>
                        
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                        <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '6px 0 0 6px' }}>Producto</th>
                                        <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Precio</th>
                                        <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Cant.</th>
                                        <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', borderRadius: '0 6px 6px 0' }}>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pedido.items?.map(item => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                            <td style={{ padding: '16px', color: '#1E293B' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', flexShrink: 0 }}>
                                                        <Box size={20} style={{ color: '#94A3B8' }} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '600', fontSize: '14px', lineHeight: '1.4' }}>{item.variante?.producto?.nombre || 'Producto Desconocido'}</div>
                                                        {item.variante?.sku && <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>SKU: {item.variante.sku}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px', color: '#64748B', fontSize: '14px', fontWeight: '500' }}>S/ {item.precio_unitario}</td>
                                            <td style={{ padding: '16px', color: '#1E293B', fontWeight: '600', fontSize: '14px', textAlign: 'center' }}>{item.cantidad}</td>
                                            <td style={{ padding: '16px', textAlign: 'right', color: '#1E293B', fontWeight: '700', fontSize: '14px' }}>S/ {item.subtotal}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end', fontSize: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px', color: '#64748B' }}>
                                <span>Subtotal:</span>
                                <span style={{ fontWeight: '500', color: '#1E293B' }}>S/ {pedido.subtotal}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px', color: '#64748B' }}>
                                <span>Envío:</span>
                                <span style={{ fontWeight: '500', color: '#1E293B' }}>S/ {pedido.costo_envio}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px', fontWeight: '800', color: '#1E293B', fontSize: '18px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                                <span>Total:</span>
                                <span style={{ color: '#004797' }}>S/ {pedido.total}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lado derecho: Info y Estado */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Actualizar Estado */}
                    <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <RefreshCw size={18} style={{ color: '#004797' }} /> Actualizar Estado
                        </h2>
                        
                        <form onSubmit={updateStatus}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#64748B', fontSize: '13px', fontWeight: '600' }}>Estado del Pedido</label>
                                <select 
                                    value={data.estado} 
                                    onChange={e => setData('estado', e.target.value)}
                                    onFocus={(e) => { e.target.style.borderColor = '#004797'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.1)'; e.target.style.backgroundColor = '#ffffff'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#1E293B', fontSize: '14px', outline: 'none', transition: 'all 0.2s ease', cursor: 'pointer' }}
                                >
                                    <option value="pendiente">Pendiente</option>
                                    <option value="procesando">Procesando</option>
                                    <option value="enviado">Enviado</option>
                                    <option value="completado">Completado</option>
                                    <option value="cancelado">Cancelado</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#64748B', fontSize: '13px', fontWeight: '600' }}>Código de Tracking</label>
                                <input 
                                    type="text"
                                    value={data.tracking}
                                    onChange={e => setData('tracking', e.target.value)}
                                    placeholder="Ej: SHP-12345"
                                    onFocus={(e) => { e.target.style.borderColor = '#004797'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.1)'; e.target.style.backgroundColor = '#ffffff'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#1E293B', fontSize: '14px', outline: 'none', transition: 'all 0.2s ease', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#64748B', fontSize: '13px', fontWeight: '600' }}>Estado de Envío</label>
                                <select 
                                    value={data.estado_envio} 
                                    onChange={e => setData('estado_envio', e.target.value)}
                                    onFocus={(e) => { e.target.style.borderColor = '#004797'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.1)'; e.target.style.backgroundColor = '#ffffff'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#1E293B', fontSize: '14px', outline: 'none', transition: 'all 0.2s ease', cursor: 'pointer' }}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Preparando">Preparando</option>
                                    <option value="Enviado">Enviado / En Tránsito</option>
                                    <option value="Entregado">Entregado</option>
                                </select>
                            </div>
                            
                            <button 
                                type="submit" 
                                disabled={processing}
                                onMouseEnter={(e) => { if(!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = '#0F172A'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'; } }}
                                onMouseLeave={(e) => { if(!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = '#1E293B'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'; } }}
                                style={{ width: '100%', background: '#1E293B', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', opacity: processing ? 0.7 : 1 }}
                            >
                                <Save size={16} />
                                {processing ? 'Actualizando...' : 'Guardar Estado'}
                            </button>
                        </form>
                    </div>

                    {/* Información del Cliente */}
                    <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={18} style={{ color: '#004797' }} /> Información del Cliente
                        </h2>
                        {pedido.usuario ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                                    <span style={{ color: '#64748B', fontWeight: '500' }}>Nombre</span>
                                    <span style={{ color: '#1E293B', fontWeight: '600' }}>{pedido.usuario.nombres} {pedido.usuario.apellidos}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                                    <span style={{ color: '#64748B', fontWeight: '500' }}>Email</span>
                                    <span style={{ color: '#1E293B', fontWeight: '600' }}>{pedido.usuario.email}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                                    <span style={{ color: '#64748B', fontWeight: '500' }}>Teléfono</span>
                                    <span style={{ color: '#1E293B', fontWeight: '600' }}>{pedido.usuario.telefono || 'N/A'}</span>
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '12px', background: '#FEE2E2', color: '#EF4444', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textAlign: 'center' }}>Usuario Eliminado</div>
                        )}
                    </div>
                    
                    {/* Acciones de Pago */}
                    <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CreditCard size={18} style={{ color: '#004797' }} /> Acciones de Pago
                        </h2>
                        <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginBottom: '8px' }}>
                                <span style={{ color: '#64748B' }}>Método de Pago</span>
                                <span style={{ color: '#1E293B', fontWeight: '700', textTransform: 'capitalize' }}>{pedido.pago?.metodo_pago || 'Desconocido'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                <span style={{ color: '#64748B' }}>Estado del Pago</span>
                                <span style={{ 
                                    color: pedido.pago?.estado === 'completado' ? '#059669' : pedido.pago?.estado === 'pendiente' ? '#D97706' : '#EF4444', 
                                    fontWeight: '700', 
                                    textTransform: 'capitalize',
                                    background: pedido.pago?.estado === 'completado' ? '#D1FAE5' : pedido.pago?.estado === 'pendiente' ? '#FEF3C7' : '#FEE2E2',
                                    padding: '2px 8px',
                                    borderRadius: '9999px',
                                    fontSize: '11px'
                                }}>
                                    {pedido.pago?.estado || 'Desconocido'}
                                </span>
                            </div>
                        </div>
                        
                        {pedido.pago?.estado === 'completado' && pedido.estado !== 'cancelado' ? (
                            <button 
                                onClick={async () => { if(await confirmDialog('¿Estás seguro que deseas reembolsar y cancelar este pedido? Esta acción no se puede deshacer.')) {
                                        router.post(`/admin/pedidos/${pedido.id}/reembolsar`);
                                    }
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#B91C1C'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.2)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#DC2626'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                style={{ width: '100%', background: '#DC2626', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <RefreshCw size={16} />
                                Reembolsar Pedido
                            </button>
                        ) : (
                            <p style={{ color: '#94A3B8', fontSize: '13px', textAlign: 'center', margin: 0, fontWeight: '500' }}>No es posible reembolsar este pedido actualmente.</p>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
